const Consent = require('../models/Consent');
const KYCRequest = require('../models/KycRequest');
const {
    createConsentSchema,
    grantConsentSchema,
    revokeConsentSchema,
    bulkGrantConsentSchema,
    queryConsentsSchema,
    consentIdSchema
} = require('../validators/consentValidators');

/**
 * @desc    Create consent request (usually done automatically during KYC submission)
 * @route   POST /api/v1/consent/create
 * @access  Private
 */
exports.createConsent = async (req, res) => {
    try {
        // Validate input
        const { error, value } = createConsentSchema.validate(req.body);
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

        const userId = req.user.id;
        const {
            kycRequestId,
            consentType,
            purpose,
            duration,
            dataCategories,
            thirdParties,
            isMandatory
        } = value;

        // Verify KYC request exists and belongs to user
        const kycRequest = await KYCRequest.findById(kycRequestId);
        if (!kycRequest) {
            return res.status(404).json({
                success: false,
                message: 'KYC request not found'
            });
        }

        if (kycRequest.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to create consent for this KYC request'
            });
        }

        // Check if consent already exists
        const existingConsent = await Consent.findOne({
            userId,
            kycRequestId,
            consentType,
            status: { $in: ['pending', 'granted'] }
        });

        if (existingConsent) {
            return res.status(400).json({
                success: false,
                message: 'A consent of this type already exists for this KYC request'
            });
        }

        // Prepare consent text based on type
        const consentText = generateConsentText(consentType, purpose, dataCategories, thirdParties);

        // Create consent
        const consent = new Consent({
            userId,
            kycRequestId,
            consentType,
            purpose,
            consentText,
            duration: duration || 365,
            dataCategories: dataCategories || [],
            thirdParties: thirdParties || [],
            isMandatory: isMandatory || false,
            status: 'pending',
            auditLog: [{
                action: 'created',
                timestamp: new Date(),
                performedBy: userId,
                details: 'Consent request created',
                ipAddress: req.ip
            }]
        });

        await consent.save();

        res.status(201).json({
            success: true,
            message: 'Consent request created successfully',
            data: {
                _id: consent._id,
                consentId: consent.consentId,
                consentType: consent.consentType,
                purpose: consent.purpose,
                consentText: consent.consentText,
                status: consent.status,
                duration: consent.duration,
                isMandatory: consent.isMandatory,
                dataCategories: consent.dataCategories,
                thirdParties: consent.thirdParties,
                createdAt: consent.createdAt
            }
        });

    } catch (error) {
        console.error('Create consent error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating consent request',
            error: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? error.message : undefined
        });
    }
};

/**
 * @desc    Grant consent
 * @route   POST /api/v1/consent/:consentId/grant
 * @access  Private (Consent owner only)
 */
exports.grantConsent = async (req, res) => {
    try {
        // Validate consent ID
        const { error: idError } = consentIdSchema.validate({ consentId: req.params.consentId });
        if (idError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid consent ID format'
            });
        }

        // Validate input
        const { error, value } = grantConsentSchema.validate(req.body);
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

        const userId = req.user.id;
        const consentId = req.params.consentId;

        // Find consent
        const consent = await Consent.findById(consentId);
        if (!consent) {
            return res.status(404).json({
                success: false,
                message: 'Consent not found'
            });
        }

        // Check ownership
        if (consent.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to grant this consent'
            });
        }

        // Check if already granted
        if (consent.status === 'granted') {
            return res.status(400).json({
                success: false,
                message: 'Consent has already been granted'
            });
        }

        // Check if revoked
        if (consent.status === 'revoked') {
            return res.status(400).json({
                success: false,
                message: 'Cannot grant a revoked consent'
            });
        }

        // Grant consent
        const grantDetails = {
            ipAddress: value.ipAddress || req.ip,
            userAgent: value.userAgent || req.get('user-agent'),
            location: {
                country: req.headers['cf-ipcountry'] || 'Unknown',
                city: 'Unknown'
            }
        };

        await consent.grant(grantDetails);

        res.status(200).json({
            success: true,
            message: 'Consent granted successfully',
            data: {
                _id: consent._id,
                consentId: consent.consentId,
                consentType: consent.consentType,
                status: consent.status,
                grantedAt: consent.grantedAt,
                expiresAt: consent.expiresAt
            }
        });

    } catch (error) {
        console.error('Grant consent error:', error);
        res.status(500).json({
            success: false,
            message: 'Error granting consent',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Deny consent
 * @route   POST /api/v1/consent/:consentId/deny
 * @access  Private (Consent owner only)
 */
exports.denyConsent = async (req, res) => {
    try {
        const userId = req.user.id;
        const consentId = req.params.consentId;

        const consent = await Consent.findById(consentId);
        if (!consent) {
            return res.status(404).json({
                success: false,
                message: 'Consent not found'
            });
        }

        if (consent.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to deny this consent'
            });
        }

        if (consent.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending consents can be denied'
            });
        }

        // Check if mandatory
        if (consent.isMandatory) {
            return res.status(400).json({
                success: false,
                message: 'This consent is mandatory and cannot be denied. The KYC process cannot proceed without it.'
            });
        }

        await consent.deny(userId, req.ip);

        res.status(200).json({
            success: true,
            message: 'Consent denied successfully',
            data: {
                _id: consent._id,
                consentId: consent.consentId,
                status: consent.status
            }
        });

    } catch (error) {
        console.error('Deny consent error:', error);
        res.status(500).json({
            success: false,
            message: 'Error denying consent',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Revoke consent
 * @route   POST /api/v1/consent/:consentId/revoke
 * @access  Private (Consent owner only)
 */
exports.revokeConsent = async (req, res) => {
    try {
        const { error, value } = revokeConsentSchema.validate(req.body);
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

        const userId = req.user.id;
        const consentId = req.params.consentId;

        const consent = await Consent.findById(consentId);
        if (!consent) {
            return res.status(404).json({
                success: false,
                message: 'Consent not found'
            });
        }

        if (consent.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to revoke this consent'
            });
        }

        if (consent.status !== 'granted') {
            return res.status(400).json({
                success: false,
                message: 'Only granted consents can be revoked'
            });
        }

        await consent.revoke(value.reason, userId, req.ip);

        res.status(200).json({
            success: true,
            message: 'Consent revoked successfully',
            data: {
                _id: consent._id,
                consentId: consent.consentId,
                status: consent.status,
                revokedAt: consent.revokedAt,
                revocationReason: consent.revocationReason
            }
        });

    } catch (error) {
        console.error('Revoke consent error:', error);

        if (error.message.includes('cannot be withdrawn')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error revoking consent',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get user's consents
 * @route   GET /api/v1/consent/my-consents
 * @access  Private
 */
exports.getMyConsents = async (req, res) => {
    try {
        const { error, value } = queryConsentsSchema.validate(req.query);
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

        const userId = req.user.id;
        const { status, consentType, kycRequestId, page, limit } = value;

        // Build query
        const query = { userId };

        if (status !== 'all') {
            query.status = status;
        }

        if (consentType) {
            query.consentType = consentType;
        }

        if (kycRequestId) {
            query.kycRequestId = kycRequestId;
        }

        // Calculate skip
        const skip = (page - 1) * limit;

        // Get consents
        const consents = await Consent.find(query)
            .populate('kycRequestId', 'requestId status')
            .select('-auditLog')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        // Get total count
        const totalCount = await Consent.countDocuments(query);

        // Format response
        const formattedConsents = consents.map(consent => ({
            _id: consent._id,
            consentId: consent.consentId,
            consentType: consent.consentType,
            purpose: consent.purpose,
            status: consent.status,
            isMandatory: consent.isMandatory,
            canBeWithdrawn: consent.canBeWithdrawn,
            grantedAt: consent.grantedAt,
            expiresAt: consent.expiresAt,
            revokedAt: consent.revokedAt,
            isValid: consent.isValid,
            isExpired: consent.isExpired,
            kycRequest: consent.kycRequestId,
            createdAt: consent.createdAt
        }));

        res.status(200).json({
            success: true,
            data: {
                consents: formattedConsents,
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get my consents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving consents',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get consent details
 * @route   GET /api/v1/consent/:consentId
 * @access  Private (Consent owner only)
 */
exports.getConsentDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const consentId = req.params.consentId;

        const consent = await Consent.findById(consentId)
            .populate('kycRequestId', 'requestId status')
            .populate('userId', 'email personalInfo.fullName');

        if (!consent) {
            return res.status(404).json({
                success: false,
                message: 'Consent not found'
            });
        }

        // Check ownership (or allow bank officers to view)
        if (req.user.role !== 'bank_officer' && consent.userId._id.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this consent'
            });
        }

        // Add view to audit log
        consent.auditLog.push({
            action: 'viewed',
            timestamp: new Date(),
            performedBy: userId,
            details: 'Consent details viewed',
            ipAddress: req.ip
        });
        await consent.save();

        res.status(200).json({
            success: true,
            data: consent
        });

    } catch (error) {
        console.error('Get consent details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving consent details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Bulk grant consents (for KYC submission)
 * @route   POST /api/v1/consent/bulk-grant
 * @access  Private
 */
exports.bulkGrantConsents = async (req, res) => {
    try {
        const { error, value } = bulkGrantConsentSchema.validate(req.body);
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

        const userId = req.user.id;
        const { consentIds, ipAddress, userAgent } = value;

        // Find all consents
        const consents = await Consent.find({
            _id: { $in: consentIds },
            userId
        });

        if (consents.length !== consentIds.length) {
            return res.status(404).json({
                success: false,
                message: 'Some consents not found or do not belong to you'
            });
        }

        // Check if any are already granted or not pending
        const nonPending = consents.filter(c => c.status !== 'pending');
        if (nonPending.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some consents are not in pending status'
            });
        }

        // Grant all consents
        const grantDetails = {
            ipAddress: ipAddress || req.ip,
            userAgent: userAgent || req.get('user-agent'),
            location: {
                country: req.headers['cf-ipcountry'] || 'Unknown',
                city: 'Unknown'
            }
        };

        const grantPromises = consents.map(consent => consent.grant(grantDetails));
        await Promise.all(grantPromises);

        res.status(200).json({
            success: true,
            message: `${consents.length} consent(s) granted successfully`,
            data: {
                grantedCount: consents.length,
                consents: consents.map(c => ({
                    _id: c._id,
                    consentId: c.consentId,
                    consentType: c.consentType,
                    status: c.status
                }))
            }
        });

    } catch (error) {
        console.error('Bulk grant consents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error granting consents',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Helper function to generate consent text based on type
 */
function generateConsentText(consentType, purpose, dataCategories, thirdParties) {
    const texts = {
        data_collection: `By granting this consent, you authorize us to collect your personal information for the purpose of: ${purpose}.

The data we collect includes: ${dataCategories && dataCategories.length > 0 ? dataCategories.join(', ') : 'personal and identification information'}.

Your data will be processed in accordance with applicable data protection laws and our Privacy Policy.`,

        data_processing: `By granting this consent, you authorize us to process your personal data for KYC verification purposes.

Purpose: ${purpose}

We will process your data to verify your identity, assess your eligibility, and comply with regulatory requirements.`,

        data_sharing: `By granting this consent, you authorize us to share your personal information with the following third parties:

${thirdParties && thirdParties.length > 0 ? thirdParties.map(tp => `- ${tp.name}: ${tp.purpose || 'verification purposes'}`).join('\n') : 'Authorized verification partners and regulatory bodies'}

Purpose: ${purpose}`,

        blockchain_storage: `By granting this consent, you authorize us to store your KYC credentials on a blockchain network.

Purpose: ${purpose}

Your credentials will be stored in a secure, immutable blockchain ledger for verification purposes. This ensures the integrity and authenticity of your verified identity.`,

        biometric_collection: `By granting this consent, you authorize us to collect and process your biometric data (fingerprints, facial recognition, etc.).

Purpose: ${purpose}

Your biometric data will be securely stored and used solely for identity verification purposes.`,

        credit_check: `By granting this consent, you authorize us to perform credit checks and access your credit history.

Purpose: ${purpose}`,

        background_check: `By granting this consent, you authorize us to conduct background verification checks.

Purpose: ${purpose}

This may include employment history, educational qualifications, and criminal record checks where applicable.`,

        all: `By granting this comprehensive consent, you authorize us to:

1. Collect your personal information
2. Process your data for KYC verification
3. Share your data with authorized third parties
4. Store your credentials on blockchain
5. Collect biometric data (if applicable)
6. Perform credit and background checks (if applicable)

Purpose: ${purpose}

All data processing activities will be conducted in accordance with applicable laws and regulations.`
    };

    return texts[consentType] || texts.all;
}

module.exports = exports;
