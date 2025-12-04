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

        res.status(200).json({
            success: true,
            data: kycRequest
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

        res.status(200).json({
            success: true,
            message: `KYC request ${approved ? 'approved' : 'rejected'} successfully`,
            data: result.data
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
