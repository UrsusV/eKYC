const kycService = require('../services/kycService');
const KycRequest = require('../models/KycRequest');
const User = require('../models/User');
const Credential = require('../models/Credential');
const { getCredentialService } = require('../services/blockchain');
const crypto = require('crypto');
const {
    verifyKycSchema,
    issueCredentialSchema,
    kycRequestsQuerySchema
} = require('../validators/bankValidators');

/**
 * @desc    Get KYC requests for bank officer's bank
 * @route   GET /api/v1/bank/kyc-requests
 * @access  Private (Bank Officer only)
 */
exports.getKycRequests = async (req, res) => {
    try {
        // Validate query parameters
        const { error, value } = kycRequestsQuerySchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        const { status, page, limit } = value;
        const bankOfficer = req.user;

        // Verify bank officer has bank association
        if (!bankOfficer.bankOfficerInfo || !bankOfficer.bankOfficerInfo.bankId) {
            console.error('Bank officer missing bank association:', {
                userId: bankOfficer._id,
                email: bankOfficer.email,
                role: bankOfficer.role,
                hasBankOfficerInfo: !!bankOfficer.bankOfficerInfo,
                bankId: bankOfficer.bankOfficerInfo?.bankId
            });
            return res.status(400).json({
                success: false,
                message: 'Bank officer is not associated with any bank',
                debug: process.env.NODE_ENV === 'development' ? {
                    hasBankOfficerInfo: !!bankOfficer.bankOfficerInfo,
                    bankId: bankOfficer.bankOfficerInfo?.bankId
                } : undefined
            });
        }

        const bankId = bankOfficer.bankOfficerInfo.bankId;

        // Build query
        const query = { bankId };

        if (status !== 'all') {
            query.status = status;
        }

        // Calculate skip
        const skip = (page - 1) * limit;

        // Get KYC requests
        const requests = await KycRequest.find(query)
            .populate('userId', 'email personalInfo.fullName personalInfo.nid contactInfo.primaryPhone')
            .populate('workflow.assignedTo', 'personalInfo.fullName')
            .select('requestId status kycLevel createdAt userId workflow submissionDetails bankId documentType')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        // Get total count
        const totalCount = await KycRequest.countDocuments(query);

        // Format response
        const formattedRequests = requests.map(req => ({
            _id: req._id,
            requestId: req.requestId,
            bankId: req.bankId.toString(),
            fullName: req.userId?.personalInfo?.fullName || 'N/A',
            customerName: req.userId?.personalInfo?.fullName || 'N/A',
            documentNumber: req.submissionDetails?.nidData?.nid_number || req.userId?.personalInfo?.nid || 'N/A',
            nidNumber: req.submissionDetails?.nidData?.nid_number || req.userId?.personalInfo?.nid || 'N/A',
            documentType: req.documentType || 'nid',
            email: req.userId?.email,
            phone: req.userId?.contactInfo?.primaryPhone,
            submissionDate: req.createdAt,
            createdAt: req.createdAt,
            status: req.status,
            kycLevel: req.kycLevel,
            assignedTo: req.workflow?.assignedTo?.personalInfo?.fullName
        }));

        res.status(200).json({
            success: true,
            data: {
                requests: formattedRequests,
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    hasMore: totalCount > skip + requests.length
                }
            }
        });

    } catch (error) {
        console.error('Get KYC requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving KYC requests',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get detailed KYC request by ID
 * @route   GET /api/v1/bank/kyc-request/:id
 * @access  Private (Bank Officer only)
 */
exports.getKycRequestDetails = async (req, res) => {
    try {
        const requestId = req.params.id;
        const bankOfficer = req.user;

        // Get KYC request with full details
        const kycRequest = await KycRequest.findById(requestId)
            .populate('userId', 'email personalInfo contactInfo walletAddress kycStatus')
            .populate('bankId', 'bankName bankCode')
            .populate('sharedCredentialId')
            .populate('workflow.assignedTo', 'personalInfo.fullName email')
            .populate('workflow.reviewedBy', 'personalInfo.fullName email')
            .populate('workflow.approvedBy', 'personalInfo.fullName email');

        if (!kycRequest) {
            return res.status(404).json({
                success: false,
                message: 'KYC request not found'
            });
        }

        // Verify bank officer can access this request (must be from same bank)
        if (!bankOfficer.bankOfficerInfo ||
            kycRequest.bankId._id.toString() !== bankOfficer.bankOfficerInfo.bankId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this KYC request'
            });
        }

        // If this request uses a shared credential, automatically verify it from blockchain
        let credentialVerificationResult = null;
        if (kycRequest.useExistingCredential && kycRequest.sharedCredentialId) {
            try {
                // Get credential service instance
                const credentialService = getCredentialService();

                // Initialize if not already initialized
                if (!credentialService.isInitialized) {
                    console.log('🔧 Initializing credential service for blockchain verification...');
                    await credentialService.initialize();
                }

                const credential = kycRequest.sharedCredentialId;

                console.log('🔍 Verifying credential on blockchain:', {
                    credentialId: credential._id,
                    credentialIdString: credential.credentialId,
                    blockchainCredentialId: credential.blockchain?.blockchainCredentialId,
                    hasBlockchainData: !!credential.blockchain
                });

                // Check if credential has blockchain data
                if (!credential.blockchain || !credential.blockchain.blockchainCredentialId) {
                    console.error('❌ Credential has no blockchain data:', credential._id);
                    credentialVerificationResult = {
                        isValid: false,
                        isRevoked: false,
                        error: 'Credential not found on blockchain',
                        details: 'This credential was not issued to the blockchain. It may be a legacy credential or there was an error during issuance.',
                        checkedAt: new Date()
                    };
                } else {
                    // Fetch blockchain status
                    console.log('📡 Calling blockchain to get credential:', credential.blockchain.blockchainCredentialId);
                    const blockchainData = await credentialService.getCredential(
                        credential.blockchain.blockchainCredentialId
                    );

                    console.log('✅ Blockchain response:', blockchainData);

                    // Update credential verification status in KYC request
                    kycRequest.credentialVerification = {
                        verified: !blockchainData.isRevoked,
                        verifiedAt: new Date(),
                        verifiedBy: bankOfficer._id,
                        blockchainStatus: {
                            isRevoked: blockchainData.isRevoked,
                            checkedAt: new Date(),
                            blockchainData: blockchainData
                        },
                        verificationNotes: blockchainData.isRevoked
                            ? 'Credential has been revoked on blockchain'
                            : 'Credential verified successfully on blockchain'
                    };

                    await kycRequest.save();

                    credentialVerificationResult = {
                        isValid: !blockchainData.isRevoked,
                        isRevoked: blockchainData.isRevoked,
                        checkedAt: new Date(),
                        blockchainData: {
                            credentialHash: blockchainData.credentialHash,
                            issuer: blockchainData.issuer,
                            holder: blockchainData.holder,
                            issuedAt: blockchainData.issuedAt,
                            credentialType: blockchainData.credentialType
                        }
                    };
                }
            } catch (blockchainError) {
                console.error('❌ Blockchain verification error:', blockchainError);
                console.error('Error stack:', blockchainError.stack);
                credentialVerificationResult = {
                    isValid: false,
                    error: 'Failed to verify credential on blockchain',
                    details: blockchainError.message,
                    checkedAt: new Date()
                };
            }
        }

        // Prepare response data
        const responseData = kycRequest.toObject();
        if (credentialVerificationResult) {
            responseData.credentialVerificationResult = credentialVerificationResult;
        }

        res.status(200).json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('Get KYC request details error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid request ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error retrieving KYC request details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Verify (approve/reject) KYC request
 * @route   POST /api/v1/bank/verify/:requestId
 * @access  Private (Bank Officer only)
 */
exports.verifyKycRequest = async (req, res) => {
    try {
        // Validate input
        const { error, value } = verifyKycSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        const { approved, comments, rejectionCategory } = value;
        const requestId = req.params.requestId;
        const bankOfficer = req.user;

        // Get KYC request
        const kycRequest = await KycRequest.findById(requestId);
        if (!kycRequest) {
            return res.status(404).json({
                success: false,
                message: 'KYC request not found'
            });
        }

        // Verify bank officer can verify this request
        if (!bankOfficer.bankOfficerInfo ||
            kycRequest.bankId.toString() !== bankOfficer.bankOfficerInfo.bankId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to verify this KYC request'
            });
        }

        // Determine new status
        const newStatus = approved ? 'approved' : 'rejected';

        // Prepare options for status update
        const options = {
            remarks: comments
        };

        if (!approved && rejectionCategory) {
            options.rejectionCategory = rejectionCategory;
            options.rejectionDetails = comments;
        }

        // Update KYC status using service
        const result = await kycService.updateKYCStatus(
            requestId,
            newStatus,
            bankOfficer._id,
            options
        );

        // If approved, automatically issue credential
        let credentialData = null;
        if (approved) {
            console.log('🎯 KYC APPROVED - Starting automatic credential issuance for request:', requestId);
            try {
                // Get updated KYC request with user details
                const updatedKycRequest = await KycRequest.findById(requestId)
                    .populate('userId', 'walletAddress personalInfo');

                if (!updatedKycRequest) {
                    throw new Error('KYC request not found after approval');
                }

                // Check if user already has a credential (for any previous KYC)
                const existingCredential = await Credential.findOne({
                    userId: updatedKycRequest.userId._id,
                    status: 'active',
                    credentialType: 'identity_verification'
                });

                if (existingCredential) {
                    console.log(`✅ User ${updatedKycRequest.userId._id} already has an active credential (${existingCredential.credentialId}). Skipping issuance.`);

                    // Add note to KYC request
                    updatedKycRequest.internalNotes.push({
                        note: `User already has an active credential (ID: ${existingCredential.credentialId}). No new credential issued.`,
                        addedBy: bankOfficer._id,
                        addedAt: new Date(),
                        isPrivate: true
                    });
                    await updatedKycRequest.save();

                    credentialData = {
                        message: 'KYC approved. User already has an active credential.',
                        existingCredential: {
                            credentialId: existingCredential.credentialId,
                            issuedAt: existingCredential.issuedAt,
                            expiresAt: existingCredential.expiresAt
                        }
                    };
                } else {
                    // Check if credential already issued for this specific request
                    if (updatedKycRequest.blockchain.issuedOnChain) {
                        console.log(`Credential already issued for this KYC request ${requestId}`);
                        credentialData = {
                            message: 'Credential already issued for this request'
                        };
                    } else if (!updatedKycRequest.userId.walletAddress) {
                        // User doesn't have a wallet address - log warning
                        console.warn(`⚠️  User ${updatedKycRequest.userId._id} does not have a wallet address. Credential issuance skipped.`);

                        updatedKycRequest.internalNotes.push({
                            note: 'User does not have a wallet address. Credential issuance skipped. Please ask user to set up wallet.',
                            addedBy: bankOfficer._id,
                            addedAt: new Date(),
                            isPrivate: true
                        });
                        await updatedKycRequest.save();

                        credentialData = {
                            message: 'KYC approved but credential not issued. User needs to set up wallet address.'
                        };
                    } else {
                        // Issue new credential
                        console.log(`🚀 Issuing NEW credential for KYC request ${requestId}`);

                        // Generate credential hash from KYC data
                        const credentialDataForHash = {
                            requestId: updatedKycRequest.requestId,
                            userId: updatedKycRequest.userId._id,
                            nid: updatedKycRequest.userId.personalInfo?.nid,
                            fullName: updatedKycRequest.userId.personalInfo?.fullName,
                            kycLevel: updatedKycRequest.kycLevel,
                            approvedAt: updatedKycRequest.workflow.approvedAt,
                            approvedBy: updatedKycRequest.workflow.approvedBy
                        };

                        const credentialHash = crypto
                            .createHash('sha256')
                            .update(JSON.stringify(credentialDataForHash))
                            .digest('hex');

                        // Issue credential on blockchain
                        const credentialService = getCredentialService();

                        // Initialize if not already initialized
                        if (!credentialService.isInitialized) {
                            await credentialService.initialize();
                        }

                        const blockchainResult = await credentialService.issueCredential(
                            credentialHash,
                            updatedKycRequest.userId.walletAddress,
                            2, // Credential type 2 = KYC
                            { useQueue: false }
                        );

                        // Verify blockchain result
                        if (!blockchainResult || !blockchainResult.transactionHash) {
                            throw new Error('Invalid blockchain response: missing transaction hash');
                        }

                        if (!blockchainResult.credentialId) {
                            throw new Error('Invalid blockchain response: missing credential ID');
                        }

                        // Calculate expiry date (1 year from now)
                        const expiryDate = new Date();
                        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

                        // Create Credential record in database
                        const credential = await Credential.create({
                            userId: updatedKycRequest.userId._id,
                            kycRequestId: updatedKycRequest._id,
                            bankId: updatedKycRequest.bankId,
                            issuedBy: bankOfficer._id,
                            credentialType: 'identity_verification',
                            blockchain: {
                                credentialHash: credentialHash,
                                transactionHash: blockchainResult.transactionHash,
                                blockNumber: blockchainResult.blockNumber,
                                holderAddress: updatedKycRequest.userId.walletAddress,
                                issuerAddress: blockchainResult.issuerAddress || process.env.BLOCKCHAIN_ISSUER_ADDRESS || '0x0000000000000000000000000000000000000000',
                                blockchainCredentialId: blockchainResult.credentialId,
                                networkId: process.env.BLOCKCHAIN_NETWORK || 'localhost',
                                gasUsed: blockchainResult.gasUsed
                            },
                            status: 'active',
                            issuedAt: new Date(),
                            expiresAt: expiryDate,
                            credentialData: {
                                documentType: 'kyc_verification',
                                fullName: updatedKycRequest.userId.personalInfo?.fullName,
                                dateOfBirth: updatedKycRequest.userId.personalInfo?.dateOfBirth,
                                nationality: updatedKycRequest.userId.personalInfo?.nationality,
                                kycLevel: updatedKycRequest.kycLevel
                            },
                            verificationProof: {
                                verificationMethod: 'manual',
                                verificationNotes: 'KYC approved by bank officer',
                                documentsVerified: updatedKycRequest.documents?.map(doc => doc.documentType) || []
                            }
                        });

                        // Update KYC request with blockchain details
                        updatedKycRequest.blockchain = {
                            credentialHash: credentialHash,
                            transactionHash: blockchainResult.transactionHash,
                            blockNumber: blockchainResult.blockNumber,
                            issuedOnChain: true,
                            issuedAt: new Date()
                        };

                        await updatedKycRequest.save();

                        credentialData = {
                            message: 'Credential issued successfully',
                            credential: {
                                _id: credential._id,
                                credentialId: credential.credentialId,
                                userId: credential.userId,
                                kycRequestId: credential.kycRequestId,
                                credentialType: credential.credentialType,
                                status: credential.status,
                                issuedAt: credential.issuedAt,
                                expiresAt: credential.expiresAt
                            },
                            transaction: {
                                transactionHash: blockchainResult.transactionHash,
                                blockNumber: blockchainResult.blockNumber,
                                blockchainCredentialId: blockchainResult.credentialId,
                                gasUsed: blockchainResult.gasUsed
                            }
                        };

                        console.log(`✅ Credential issued successfully for KYC request ${requestId}`, {
                            credentialId: credential.credentialId,
                            transactionHash: blockchainResult.transactionHash
                        });
                    }
                }
            } catch (credentialError) {
                // Log error but don't fail the approval
                console.error('❌ Automatic credential issuance failed:', credentialError);
                console.error('Error stack:', credentialError.stack);

                // Add internal note about the failure
                const kycReq = await KycRequest.findById(requestId);
                if (kycReq) {
                    kycReq.internalNotes.push({
                        note: `Automatic credential issuance failed: ${credentialError.message}. KYC approved but credential not issued.`,
                        addedBy: bankOfficer._id,
                        addedAt: new Date(),
                        isPrivate: true
                    });
                    await kycReq.save();
                }

                credentialData = {
                    message: 'KYC approved but credential issuance failed. Please retry manually.',
                    error: process.env.NODE_ENV === 'development' ? credentialError.message : undefined
                };
            }
        }

        res.status(200).json({
            success: true,
            message: `KYC request ${approved ? 'approved' : 'rejected'} successfully`,
            data: {
                ...result.data,
                ...(credentialData && { credential: credentialData })
            }
        });

    } catch (error) {
        console.error('Verify KYC request error:', error);

        if (error.message.includes('Cannot transition')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error verifying KYC request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Issue blockchain credential for approved KYC
 * @route   POST /api/v1/bank/issue-credential
 * @access  Private (Bank Officer only)
 */
exports.issueCredential = async (req, res) => {
    try {
        // Validate input
        const { error, value } = issueCredentialSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        const { requestId } = value;
        const bankOfficer = req.user;

        // Get KYC request with user details
        const kycRequest = await KycRequest.findById(requestId)
            .populate('userId', 'walletAddress personalInfo');

        if (!kycRequest) {
            return res.status(404).json({
                success: false,
                message: 'KYC request not found'
            });
        }

        // Verify bank officer can issue credential for this request
        if (!bankOfficer.bankOfficerInfo ||
            kycRequest.bankId.toString() !== bankOfficer.bankOfficerInfo.bankId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to issue credentials for this request'
            });
        }

        // Check if KYC is approved
        if (kycRequest.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'KYC request must be approved before issuing credential'
            });
        }

        // Check if credential already issued
        if (kycRequest.blockchain.issuedOnChain) {
            return res.status(400).json({
                success: false,
                message: 'Blockchain credential has already been issued for this request'
            });
        }

        // Check if user has wallet address
        if (!kycRequest.userId.walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'User does not have a wallet address. Please ask user to set up their wallet first.'
            });
        }

        // Generate credential hash from KYC data
        const credentialData = {
            requestId: kycRequest.requestId,
            userId: kycRequest.userId._id,
            nid: kycRequest.userId.personalInfo?.nid,
            fullName: kycRequest.userId.personalInfo?.fullName,
            kycLevel: kycRequest.kycLevel,
            approvedAt: kycRequest.workflow.approvedAt,
            approvedBy: kycRequest.workflow.approvedBy
        };

        const credentialHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(credentialData))
            .digest('hex');

        // Issue credential on blockchain
        const credentialService = getCredentialService();

        // Initialize if not already initialized
        if (!credentialService.isInitialized) {
            try {
                await credentialService.initialize();
            } catch (initError) {
                console.error('Blockchain service initialization failed:', initError);

                // Add internal note about initialization failure
                kycRequest.internalNotes.push({
                    note: `Blockchain service initialization failed: ${initError.message}. KYC approved but credential issuance pending.`,
                    addedBy: bankOfficer._id,
                    addedAt: new Date(),
                    isPrivate: true
                });
                await kycRequest.save();

                return res.status(500).json({
                    success: false,
                    message: 'Blockchain service is unavailable. KYC is approved but credential cannot be issued at this time. Please retry later.',
                    error: process.env.NODE_ENV === 'development' ? initError.message : undefined,
                    data: {
                        kycRequest: {
                            _id: kycRequest._id,
                            requestId: kycRequest.requestId,
                            status: 'approved'
                        }
                    }
                });
            }
        }

        let blockchainResult;
        try {
            blockchainResult = await credentialService.issueCredential(
                credentialHash,
                kycRequest.userId.walletAddress,
                2, // Credential type 2 = KYC
                { useQueue: false } // Execute immediately for synchronous response
            );

            // Verify blockchain result has required fields
            if (!blockchainResult || !blockchainResult.transactionHash) {
                throw new Error('Invalid blockchain response: missing transaction hash');
            }

            if (!blockchainResult.credentialId) {
                throw new Error('Invalid blockchain response: missing credential ID');
            }

        } catch (blockchainError) {
            console.error('Blockchain credential issuance failed:', blockchainError);

            // Add internal note about blockchain failure
            kycRequest.internalNotes.push({
                note: `Blockchain credential issuance failed: ${blockchainError.message}. KYC approved but on-chain credential not created.`,
                addedBy: bankOfficer._id,
                addedAt: new Date(),
                isPrivate: true
            });
            await kycRequest.save();

            return res.status(500).json({
                success: false,
                message: 'KYC approved successfully, but blockchain credential issuance failed. Please retry credential issuance.',
                error: process.env.NODE_ENV === 'development' ? blockchainError.message : undefined,
                data: {
                    kycRequest: {
                        _id: kycRequest._id,
                        requestId: kycRequest.requestId,
                        status: 'approved'
                    }
                }
            });
        }

        // Calculate expiry date (1 year from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        // Create Credential record in database
        const credential = await Credential.create({
            userId: kycRequest.userId._id,
            kycRequestId: kycRequest._id,
            bankId: kycRequest.bankId,
            issuedBy: bankOfficer._id,
            credentialType: 'identity_verification',
            blockchain: {
                credentialHash: credentialHash,
                transactionHash: blockchainResult.transactionHash,
                blockNumber: blockchainResult.blockNumber,
                holderAddress: kycRequest.userId.walletAddress,
                issuerAddress: blockchainResult.issuerAddress || process.env.BLOCKCHAIN_ISSUER_ADDRESS || '0x0000000000000000000000000000000000000000',
                blockchainCredentialId: blockchainResult.credentialId,
                networkId: process.env.BLOCKCHAIN_NETWORK || 'localhost',
                gasUsed: blockchainResult.gasUsed
            },
            status: 'active',
            issuedAt: new Date(),
            expiresAt: expiryDate,
            credentialData: {
                documentType: 'kyc_verification',
                fullName: kycRequest.userId.personalInfo?.fullName,
                dateOfBirth: kycRequest.userId.personalInfo?.dateOfBirth,
                nationality: kycRequest.userId.personalInfo?.nationality,
                kycLevel: kycRequest.kycLevel
            },
            verificationProof: {
                verificationMethod: 'manual',
                verificationNotes: `KYC approved by bank officer`,
                documentsVerified: kycRequest.documents?.map(doc => doc.documentType) || []
            }
        });

        // Update KYC request with blockchain details
        kycRequest.blockchain = {
            credentialHash: credentialHash,
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber,
            issuedOnChain: true,
            issuedAt: new Date()
        };

        await kycRequest.save();

        res.status(200).json({
            success: true,
            message: 'Blockchain credential issued successfully',
            data: {
                credential: {
                    _id: credential._id,
                    credentialId: credential.credentialId,
                    userId: credential.userId,
                    kycRequestId: credential.kycRequestId,
                    credentialType: credential.credentialType,
                    status: credential.status,
                    issuedAt: credential.issuedAt,
                    expiresAt: credential.expiresAt
                },
                transaction: {
                    transactionHash: blockchainResult.transactionHash,
                    blockNumber: blockchainResult.blockNumber,
                    blockchainCredentialId: blockchainResult.credentialId,
                    gasUsed: blockchainResult.gasUsed
                }
            }
        });

    } catch (error) {
        console.error('Issue credential error:', error);

        res.status(500).json({
            success: false,
            message: 'Error issuing blockchain credential',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get credentials issued by bank officer's bank
 * @route   GET /api/v1/bank/credentials
 * @access  Private (Bank Officer only)
 */
exports.getIssuedCredentials = async (req, res) => {
    try {
        const bankOfficer = req.user;

        // Verify bank officer has bank association
        if (!bankOfficer.bankOfficerInfo || !bankOfficer.bankOfficerInfo.bankId) {
            return res.status(400).json({
                success: false,
                message: 'Bank officer is not associated with any bank'
            });
        }

        const bankId = bankOfficer.bankOfficerInfo.bankId;

        // Get query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || 'all';
        const search = req.query.search || '';

        // Build query
        const query = { bankId };

        // Filter by status
        if (status !== 'all') {
            query.status = status;
        }

        // Search by credential ID, user ID, or NID
        if (search) {
            query.$or = [
                { credentialId: { $regex: search, $options: 'i' } },
                { userId: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate skip
        const skip = (page - 1) * limit;

        // Get credentials
        const credentials = await Credential.find(query)
            .populate('userId', 'email personalInfo.fullName personalInfo.nid')
            .populate('issuedBy', 'email personalInfo.fullName')
            .sort({ issuedAt: -1 })
            .limit(limit)
            .skip(skip);

        // Get total count
        const totalCount = await Credential.countDocuments(query);

        res.status(200).json({
            success: true,
            data: credentials,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('Get issued credentials error:', error);

        res.status(500).json({
            success: false,
            message: 'Error fetching issued credentials',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
