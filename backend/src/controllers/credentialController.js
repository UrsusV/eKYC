const Credential = require('../models/Credential');
const User = require('../models/User');
const Bank = require('../models/Bank');
const Consent = require('../models/Consent');
const KycRequest = require('../models/KycRequest');
const { getCredentialService } = require('../services/blockchain');
const Joi = require('joi');

/**
 * @desc    Revoke a credential (issuer only)
 * @route   POST /api/v1/credentials/:credentialId/revoke
 * @access  Private (Bank Officer - Issuer only)
 */
exports.revokeCredential = async (req, res) => {
    try {
        const credentialId = req.params.credentialId;
        const userId = req.user.id;

        // Validate request body
        const schema = Joi.object({
            reason: Joi.string()
                .valid(
                    'fraud_detected',
                    'data_inaccuracy',
                    'user_request',
                    'expired_documents',
                    'compliance_violation',
                    'duplicate_credential',
                    'other'
                )
                .required(),
            details: Joi.string().max(500).optional()
        });

        const { error, value } = schema.validate(req.body);
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

        const { reason, details } = value;

        // Find credential by credentialId field (not _id)
        const credential = await Credential.findOne({ credentialId })
            .populate('bankId', 'bankName')
            .populate('issuedBy', 'email role');

        if (!credential) {
            return res.status(404).json({
                success: false,
                message: 'Credential not found'
            });
        }

        // Check if credential is already revoked
        if (credential.status === 'revoked' || credential.revocation.isRevoked) {
            return res.status(400).json({
                success: false,
                message: 'Credential is already revoked'
            });
        }

        // Authorization: Only the issuer (bank officer from the issuing bank) can revoke
        const user = await User.findById(userId);

        if (user.role !== 'bank_officer') {
            return res.status(403).json({
                success: false,
                message: 'Only bank officers can revoke credentials'
            });
        }

        // Check if bank officer has bank association
        if (!user.bankOfficerInfo || !user.bankOfficerInfo.bankId) {
            return res.status(400).json({
                success: false,
                message: 'Bank officer is not associated with any bank'
            });
        }

        // Check if the bank officer is from the issuing bank
        if (user.bankOfficerInfo.bankId.toString() !== credential.bankId._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only revoke credentials issued by your bank'
            });
        }

        // Get credential service
        const credentialService = getCredentialService();

        // Initialize if not already initialized
        if (!credentialService.isInitialized) {
            await credentialService.initialize();
        }

        // If issuer address is missing or zero address, fetch from blockchain
        if (!credential.blockchain.issuerAddress || credential.blockchain.issuerAddress === '0x0000000000000000000000000000000000000000') {
            try {
                console.log('Fetching issuer address from blockchain for credential:', credential.blockchain.blockchainCredentialId);
                const blockchainCred = await credentialService.getCredential(
                    credential.blockchain.blockchainCredentialId
                );

                console.log('Blockchain credential data:', {
                    issuer: blockchainCred.issuer,
                    holder: blockchainCred.holder,
                    isRevoked: blockchainCred.isRevoked
                });

                // Check if the credential exists on blockchain (issuer would not be zero if it exists)
                if (blockchainCred.issuer === '0x0000000000000000000000000000000000000000') {
                    console.warn('Credential not found on blockchain, performing database-only revocation');

                    // Revoke in database only (blockchain revocation is skipped)
                    await credential.revoke(userId, reason, details, null);

                    return res.status(200).json({
                        success: true,
                        message: 'Credential revoked successfully (database only - credential not found on blockchain)',
                        data: {
                            credentialId: credential.credentialId,
                            status: credential.status,
                            revokedAt: credential.revocation.revokedAt,
                            revocationReason: credential.revocation.revocationReason,
                            transactionHash: null,
                            warning: 'This credential was not found on the blockchain and was revoked in the database only.'
                        }
                    });
                }

                // Update the issuer address in the database using set and markModified
                credential.set('blockchain.issuerAddress', blockchainCred.issuer);
                credential.markModified('blockchain');
                await credential.save();

                console.log('Successfully updated issuer address in database to:', blockchainCred.issuer);
            } catch (fetchError) {
                console.error('Failed to fetch issuer from blockchain:', fetchError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to verify credential issuer from blockchain',
                    error: process.env.NODE_ENV === 'development' ? fetchError.message : undefined
                });
            }
        }

        // Revoke on blockchain first
        let blockchainTxHash;
        try {
            const blockchainResult = await credentialService.revokeCredential(
                credential.blockchain.blockchainCredentialId,
                { useQueue: false }
            );
            blockchainTxHash = blockchainResult.transactionHash;
        } catch (blockchainError) {
            console.error('Blockchain revocation failed:', blockchainError);
            return res.status(500).json({
                success: false,
                message: 'Failed to revoke credential on blockchain. The credential was issued by a different wallet address and can only be revoked by that issuer.',
                error: process.env.NODE_ENV === 'development' ? blockchainError.message : undefined
            });
        }

        // Revoke credential in database
        await credential.revoke(userId, reason, details, blockchainTxHash);

        res.status(200).json({
            success: true,
            message: 'Credential revoked successfully',
            data: {
                credentialId: credential.credentialId,
                status: credential.status,
                revokedAt: credential.revocation.revokedAt,
                revocationReason: credential.revocation.revocationReason,
                transactionHash: blockchainTxHash
            }
        });

    } catch (error) {
        console.error('Revoke credential error:', error);
        res.status(500).json({
            success: false,
            message: 'Error revoking credential',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Check revocation status of a credential from blockchain
 * @route   GET /api/v1/credentials/:credentialId/revocation-status
 * @access  Private (Bank Officer with consent)
 */
exports.getRevocationStatus = async (req, res) => {
    try {
        const credentialId = req.params.credentialId;
        const userId = req.user.id;

        // Find credential
        const credential = await Credential.findById(credentialId)
            .populate('userId', 'email personalInfo')
            .populate('bankId', 'bankName bankCode');

        if (!credential) {
            return res.status(404).json({
                success: false,
                message: 'Credential not found'
            });
        }

        // Authorization check: Bank officer must have a valid consent or be from the issuing bank
        const user = await User.findById(userId);

        if (user.role !== 'bank_officer' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only bank officers can check credential revocation status'
            });
        }

        // If officer is not from the issuing bank, check for valid consent via KYC request
        const isIssuer = user.bankId && user.bankId.toString() === credential.bankId._id.toString();

        if (!isIssuer) {
            // Check if there's a KYC request where this credential is being shared with officer's bank
            const kycRequest = await KycRequest.findOne({
                userId: credential.userId._id,
                bankId: user.bankId,
                sharedCredentialId: credentialId,
                status: { $in: ['pending', 'under_review', 'approved'] }
            });

            if (!kycRequest) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to view this credential. User must share it via a KYC request first.'
                });
            }

            // Check if user has granted consent for credential sharing
            const validConsent = await Consent.findOne({
                userId: credential.userId._id,
                kycRequestId: kycRequest._id,
                consentType: { $in: ['data_sharing', 'all'] },
                status: 'granted',
                isActive: true
            });

            if (!validConsent) {
                return res.status(403).json({
                    success: false,
                    message: 'User has not granted consent to share this credential'
                });
            }
        }

        // Fetch revocation status from blockchain
        let blockchainData;
        try {
            blockchainData = await credentialService.getCredential(
                credential.blockchain.blockchainCredentialId
            );
        } catch (blockchainError) {
            console.error('Blockchain fetch failed:', blockchainError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch credential status from blockchain',
                error: process.env.NODE_ENV === 'development' ? blockchainError.message : undefined
            });
        }

        // Record access in credential audit log
        await credential.recordAccess(userId, req.ip, req.get('user-agent'));

        res.status(200).json({
            success: true,
            data: {
                credentialId: credential.credentialId,
                databaseStatus: {
                    status: credential.status,
                    isRevoked: credential.revocation.isRevoked,
                    revokedAt: credential.revocation.revokedAt,
                    revocationReason: credential.revocation.revocationReason
                },
                blockchainStatus: {
                    isRevoked: blockchainData.isRevoked,
                    credentialHash: blockchainData.credentialHash,
                    issuer: blockchainData.issuer,
                    holder: blockchainData.holder,
                    issuedAt: blockchainData.issuedAt,
                    credentialType: blockchainData.credentialType
                },
                isValid: !blockchainData.isRevoked && credential.status === 'active' && !credential.isExpired,
                checkedAt: new Date().toISOString(),
                checkedBy: {
                    userId: user._id,
                    email: user.email,
                    bank: user.bankId
                }
            }
        });

    } catch (error) {
        console.error('Get revocation status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking credential revocation status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get credential details (for credential holder or authorized officer)
 * @route   GET /api/v1/credentials/:credentialId
 * @access  Private
 */
exports.getCredentialDetails = async (req, res) => {
    try {
        const credentialId = req.params.credentialId;
        const userId = req.user.id;

        const credential = await Credential.findById(credentialId)
            .populate('userId', 'email personalInfo')
            .populate('bankId', 'bankName bankCode')
            .populate('kycRequestId', 'requestId status')
            .populate('issuedBy', 'email personalInfo.fullName');

        if (!credential) {
            return res.status(404).json({
                success: false,
                message: 'Credential not found'
            });
        }

        // Authorization: owner or bank officer with valid consent
        const isOwner = credential.userId._id.toString() === userId.toString();

        if (!isOwner && req.user.role !== 'bank_officer' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this credential'
            });
        }

        // Record access
        await credential.recordAccess(userId, req.ip, req.get('user-agent'));

        res.status(200).json({
            success: true,
            data: {
                _id: credential._id,
                credentialId: credential.credentialId,
                credentialType: credential.credentialType,
                status: credential.status,
                isValid: credential.isValid,
                isExpired: credential.isExpired,
                issuedAt: credential.issuedAt,
                expiresAt: credential.expiresAt,
                daysUntilExpiry: credential.daysUntilExpiry,
                blockchain: {
                    credentialHash: credential.blockchain.credentialHash,
                    transactionHash: credential.blockchain.transactionHash,
                    blockNumber: credential.blockchain.blockNumber,
                    blockchainCredentialId: credential.blockchain.blockchainCredentialId,
                    holderAddress: credential.blockchain.holderAddress,
                    issuerAddress: credential.blockchain.issuerAddress
                },
                revocation: credential.revocation,
                bank: {
                    _id: credential.bankId._id,
                    name: credential.bankId.bankName,
                    code: credential.bankId.bankCode
                },
                kycRequest: credential.kycRequestId ? {
                    _id: credential.kycRequestId._id,
                    requestId: credential.kycRequestId.requestId,
                    status: credential.kycRequestId.status
                } : null,
                usageStats: credential.usageStats,
                createdAt: credential.createdAt,
                updatedAt: credential.updatedAt
            }
        });

    } catch (error) {
        console.error('Get credential details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving credential details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = exports;
