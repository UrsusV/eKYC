const kycService = require('../services/kycService');
const KycRequest = require('../models/KycRequest');
const Bank = require('../models/Bank');
const {
    submitKycSchema,
    paginationSchema,
    credentialFilterSchema,
    objectIdSchema
} = require('../validators/kycValidators');

/**
 * @desc    Submit a new KYC request
 * @route   POST /api/v1/kyc/submit
 * @access  Private (Customer only)
 */
exports.submitKycRequest = async (req, res) => {
    try {
        // Validate input
        const { error, value } = submitKycSchema.validate(req.body);
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

        const { nid_number, full_name, date_of_birth, address, father_name, mother_name, phone } = value;
        const userId = req.user.id;

        // Get the first active bank (in production, user should select bank)
        const bank = await Bank.findOne({ isActive: true });
        if (!bank) {
            return res.status(400).json({
                success: false,
                message: 'No active bank found. Please contact support.'
            });
        }

        // Prepare NID data
        const nidData = {
            nid_number,
            full_name,
            date_of_birth,
            address,
            father_name: father_name || req.user.personalInfo?.fatherName || 'N/A',
            mother_name: mother_name || req.user.personalInfo?.motherName || 'N/A'
        };

        // Create KYC request using service
        const result = await kycService.createKYCRequest({
            userId,
            bankId: bank._id,
            nidNumber: nid_number,
            nidData,
            requestType: 'new',
            kycLevel: 1
        });

        res.status(201).json({
            success: true,
            message: 'KYC request submitted successfully',
            data: {
                requestId: result.data.requestId,
                _id: result.data._id,
                status: result.data.status,
                kycLevel: result.data.kycLevel,
                createdAt: result.data.createdAt
            }
        });

    } catch (error) {
        console.error('Submit KYC request error:', error);

        // Handle specific errors
        if (error.message.includes('already has a pending')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('Invalid NID format')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error submitting KYC request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get KYC request status by ID
 * @route   GET /api/v1/kyc/status/:requestId
 * @access  Private (Request owner only)
 */
exports.getKycStatus = async (req, res) => {
    try {
        // Validate request ID
        const { error } = objectIdSchema.validate({ requestId: req.params.requestId });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request ID format'
            });
        }

        const requestId = req.params.requestId;
        const userId = req.user.id;

        // Get KYC request using service (includes authorization check)
        const result = await kycService.getKYCRequest(requestId, userId);

        // Check if user is authorized
        if (req.user.role === 'customer' && result.data.userId._id.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this KYC request'
            });
        }

        res.status(200).json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('Get KYC status error:', error);

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'KYC request not found'
            });
        }

        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error retrieving KYC request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get user's KYC history
 * @route   GET /api/v1/kyc/history
 * @access  Private (Customer only)
 */
exports.getKycHistory = async (req, res) => {
    try {
        // Validate pagination parameters
        const { error, value } = paginationSchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        const { page, limit } = value;
        const userId = req.user.id;

        // Calculate skip
        const skip = (page - 1) * limit;

        // Get user's KYC history using service
        const result = await kycService.getUserKYCHistory(userId, {
            limit,
            skip
        });

        res.status(200).json({
            success: true,
            data: {
                requests: result.data.requests,
                pagination: {
                    page,
                    limit,
                    total: result.data.pagination.total,
                    totalPages: Math.ceil(result.data.pagination.total / limit),
                    hasMore: result.data.pagination.hasMore
                }
            }
        });

    } catch (error) {
        console.error('Get KYC history error:', error);

        res.status(500).json({
            success: false,
            message: 'Error retrieving KYC history',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get user's blockchain credentials
 * @route   GET /api/v1/kyc/credentials
 * @access  Private (Customer only)
 */
exports.getCredentials = async (req, res) => {
    try {
        // Validate filter parameters
        const { error, value } = credentialFilterSchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid filter parameters',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        const { status, page, limit } = value;
        const userId = req.user.id;

        // Build query for blockchain credentials
        const query = {
            userId,
            'blockchain.issuedOnChain': true
        };

        // Filter by status
        if (status === 'active') {
            query.status = 'approved';
        } else if (status === 'revoked') {
            query.status = 'revoked';
        } else {
            // 'all' - no additional filter
            query.status = { $in: ['approved', 'revoked'] };
        }

        // Calculate skip for pagination
        const skip = (page - 1) * limit;

        // Get credentials
        const credentials = await KycRequest.find(query)
            .select('requestId status blockchain kycLevel createdAt workflow')
            .populate('bankId', 'bankName bankCode')
            .sort({ 'blockchain.issuedAt': -1 })
            .limit(limit)
            .skip(skip);

        // Get total count
        const totalCount = await KycRequest.countDocuments(query);

        // Format response
        const formattedCredentials = credentials.map(cred => ({
            requestId: cred.requestId,
            credentialHash: cred.blockchain.credentialHash,
            transactionHash: cred.blockchain.transactionHash,
            blockNumber: cred.blockchain.blockNumber,
            issuedAt: cred.blockchain.issuedAt,
            status: cred.status,
            kycLevel: cred.kycLevel,
            bank: {
                name: cred.bankId?.bankName,
                code: cred.bankId?.bankCode
            }
        }));

        res.status(200).json({
            success: true,
            data: formattedCredentials,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasMore: totalCount > skip + credentials.length
            }
        });

    } catch (error) {
        console.error('Get credentials error:', error);

        res.status(500).json({
            success: false,
            message: 'Error retrieving blockchain credentials',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
