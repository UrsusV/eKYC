const KycRequest = require('../models/KycRequest');
const User = require('../models/User');
const Bank = require('../models/Bank');

/**
 * Status state machine for KYC requests
 * Defines valid state transitions
 */
const STATUS_TRANSITIONS = {
    draft: ['submitted', 'cancelled'],
    submitted: ['pending', 'under_review', 'approved', 'rejected', 'cancelled'],
    pending: ['under_review', 'approved', 'rejected', 'cancelled'],
    under_review: ['approved', 'rejected', 'additional_info_required', 'document_verification'],
    document_verification: ['under_review', 'additional_info_required', 'approved', 'rejected'],
    additional_info_required: ['under_review', 'approved', 'rejected', 'cancelled'],
    approved: ['issued', 'expired'],
    issued: ['expired'],
    rejected: [],
    expired: [],
    cancelled: []
};

/**
 * Validate Bangladesh NID format
 * @param {string} nidNumber - NID number to validate
 * @returns {Object} { valid: boolean, message: string, format: string }
 */
const verifyNIDFormat = (nidNumber) => {
    if (!nidNumber || typeof nidNumber !== 'string') {
        return {
            valid: false,
            message: 'NID number is required',
            format: null
        };
    }

    const nid = nidNumber.trim();

    // Check for 10 digit format (old NID)
    if (/^\d{10}$/.test(nid)) {
        return {
            valid: true,
            message: 'Valid 10-digit NID format',
            format: '10-digit'
        };
    }

    // Check for 13 digit format (new NID)
    if (/^\d{13}$/.test(nid)) {
        return {
            valid: true,
            message: 'Valid 13-digit NID format',
            format: '13-digit'
        };
    }

    // Check for 17 digit format (Smart NID)
    if (/^\d{17}$/.test(nid)) {
        return {
            valid: true,
            message: 'Valid 17-digit Smart NID format',
            format: '17-digit'
        };
    }

    return {
        valid: false,
        message: 'Invalid NID format. Must be 10, 13, or 17 digits',
        format: null
    };
};

/**
 * Validate status transition
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - New status to transition to
 * @returns {Object} { valid: boolean, message: string }
 */
const validateStatusTransition = (currentStatus, newStatus) => {
    if (!STATUS_TRANSITIONS[currentStatus]) {
        return {
            valid: false,
            message: `Invalid current status: ${currentStatus}`
        };
    }

    if (!STATUS_TRANSITIONS[currentStatus].includes(newStatus)) {
        return {
            valid: false,
            message: `Cannot transition from '${currentStatus}' to '${newStatus}'. Valid transitions: ${STATUS_TRANSITIONS[currentStatus].join(', ') || 'none'}`
        };
    }

    return {
        valid: true,
        message: 'Valid status transition'
    };
};

/**
 * Create a new KYC request
 * @param {Object} data - KYC request data
 * @param {string} data.userId - User ID making the request
 * @param {string} data.bankId - Bank ID for the request
 * @param {string} data.nidNumber - NID number
 * @param {Object} data.nidData - NID data object
 * @param {string} data.requestType - Type of request (new, update, renewal, upgrade)
 * @param {number} data.kycLevel - KYC level (1, 2, 3)
 * @returns {Promise<Object>} Created KYC request
 */
const createKYCRequest = async (data) => {
    try {
        const {
            userId,
            bankId,
            nidNumber,
            nidData,
            requestType = 'new',
            kycLevel = 1,
            useExistingCredential = false,
            sharedCredentialId = null
        } = data;

        // Validate required fields
        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!bankId) {
            throw new Error('Bank ID is required');
        }

        if (!nidNumber && !useExistingCredential) {
            throw new Error('NID number is required');
        }

        // Validate NID format only if not using existing credential
        let nidValidation = { valid: true, format: 'shared-credential' };
        if (!useExistingCredential) {
            nidValidation = verifyNIDFormat(nidNumber);
            if (!nidValidation.valid) {
                throw new Error(nidValidation.message);
            }
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if bank exists and is active
        const bank = await Bank.findById(bankId);
        if (!bank) {
            throw new Error('Bank not found');
        }

        if (!bank.isActive) {
            throw new Error('Bank is not active');
        }

        // Check for existing pending requests
        const existingPendingRequest = await KycRequest.findOne({
            userId,
            status: { $in: ['draft', 'submitted', 'pending', 'under_review', 'document_verification', 'additional_info_required'] }
        });

        if (existingPendingRequest) {
            throw new Error('User already has a pending KYC request');
        }

        // Validate NID data structure only if not using existing credential
        if (!useExistingCredential) {
            const requiredNidFields = ['nid_number', 'full_name', 'date_of_birth', 'address'];
            const missingFields = requiredNidFields.filter(field => !nidData || !nidData[field]);

            if (missingFields.length > 0) {
                throw new Error(`Missing required NID fields: ${missingFields.join(', ')}`);
            }
        }

        // Update user's NID if not already set and not using existing credential
        if (!useExistingCredential && !user.personalInfo.nid) {
            user.personalInfo.nid = nidNumber;
            await user.save();
        }

        // Create KYC request with credential sharing support
        const kycRequestData = {
            userId,
            bankId,
            requestType,
            kycLevel,
            status: 'submitted',
            createdBy: userId,
            updatedBy: userId,
            useExistingCredential,
            verificationChecks: {
                nidVerification: {
                    status: useExistingCredential ? 'success' : 'pending'
                },
                emailVerification: {
                    status: user.isEmailVerified ? 'success' : 'pending'
                },
                phoneVerification: {
                    status: user.isPhoneVerified ? 'success' : 'pending'
                }
            },
            // Store NID data as metadata (could be stored in a separate secure location)
            submissionDetails: {
                nidData: nidData,
                nidFormat: nidValidation.format
            }
        };

        // Add shared credential if using existing credential
        if (useExistingCredential && sharedCredentialId) {
            kycRequestData.sharedCredentialId = sharedCredentialId;
            kycRequestData.credentialVerification = {
                verified: false,
                blockchainStatus: {
                    isRevoked: null,
                    checkedAt: null,
                    blockchainData: null
                }
            };
        }

        const kycRequest = await KycRequest.create(kycRequestData);

        // Update user KYC status
        user.kycStatus = 'pending';
        await user.save();

        return {
            success: true,
            message: 'KYC request created successfully',
            data: kycRequest
        };

    } catch (error) {
        throw error;
    }
};

/**
 * Update KYC request status
 * @param {string} requestId - KYC request ID or ObjectId
 * @param {string} newStatus - New status to set
 * @param {string} reviewerId - ID of the reviewer making the change
 * @param {Object} options - Additional options
 * @param {string} options.remarks - Remarks for the status change
 * @param {string} options.rejectionCategory - Rejection category (if status is rejected)
 * @param {string} options.rejectionDetails - Rejection details (if status is rejected)
 * @returns {Promise<Object>} Updated KYC request
 */
const updateKYCStatus = async (requestId, newStatus, reviewerId, options = {}) => {
    try {
        // Validate inputs
        if (!requestId) {
            throw new Error('Request ID is required');
        }

        if (!newStatus) {
            throw new Error('New status is required');
        }

        if (!reviewerId) {
            throw new Error('Reviewer ID is required');
        }

        // Find KYC request
        const kycRequest = await KycRequest.findById(requestId);
        if (!kycRequest) {
            throw new Error('KYC request not found');
        }

        // Validate status transition
        const transition = validateStatusTransition(kycRequest.status, newStatus);
        if (!transition.valid) {
            throw new Error(transition.message);
        }

        // Verify reviewer exists and has appropriate role
        const reviewer = await User.findById(reviewerId);
        if (!reviewer) {
            throw new Error('Reviewer not found');
        }

        if (!['bank_officer', 'admin'].includes(reviewer.role)) {
            throw new Error('Only bank officers and admins can update KYC status');
        }

        // If bank officer, verify they belong to the same bank
        if (reviewer.role === 'bank_officer') {
            if (!reviewer.bankOfficerInfo?.bankId ||
                reviewer.bankOfficerInfo.bankId.toString() !== kycRequest.bankId.toString()) {
                throw new Error('Bank officer can only review requests for their own bank');
            }
        }

        // Update status
        const oldStatus = kycRequest.status;
        kycRequest.status = newStatus;
        kycRequest.updatedBy = reviewerId;

        // Handle specific status transitions
        switch (newStatus) {
            case 'under_review':
                if (!kycRequest.workflow.reviewStartedAt) {
                    kycRequest.workflow.reviewStartedAt = new Date();
                }
                if (!kycRequest.workflow.assignedTo) {
                    kycRequest.workflow.assignedTo = reviewerId;
                }
                kycRequest.workflow.reviewedBy = reviewerId;
                break;

            case 'approved':
                kycRequest.workflow.approvedAt = new Date();
                kycRequest.workflow.approvedBy = reviewerId;
                kycRequest.workflow.reviewCompletedAt = new Date();

                // Update user KYC status
                const user = await User.findById(kycRequest.userId);
                if (user) {
                    user.kycStatus = 'approved';
                    user.kycLevel = kycRequest.kycLevel;
                    user.kycCompletedAt = new Date();
                    // KYC valid for 1 year
                    user.kycExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                    await user.save();
                }
                break;

            case 'rejected':
                kycRequest.workflow.rejectedAt = new Date();
                kycRequest.workflow.reviewCompletedAt = new Date();

                // Set rejection details
                if (options.rejectionCategory) {
                    kycRequest.rejectionReason = {
                        category: options.rejectionCategory,
                        details: options.rejectionDetails || '',
                        canReapply: options.canReapply !== false,
                        reapplyAfter: options.reapplyAfter || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    };
                }

                // Update user KYC status
                const rejectedUser = await User.findById(kycRequest.userId);
                if (rejectedUser) {
                    rejectedUser.kycStatus = 'rejected';
                    await rejectedUser.save();
                }
                break;

            case 'issued':
                // This status is set after blockchain credential issuance
                kycRequest.blockchain.issuedAt = new Date();

                // Update user
                const issuedUser = await User.findById(kycRequest.userId);
                if (issuedUser) {
                    issuedUser.kycStatus = 'approved';
                    await issuedUser.save();
                }
                break;

            case 'additional_info_required':
                // Add to additional info required
                if (options.requiredFields && Array.isArray(options.requiredFields)) {
                    options.requiredFields.forEach(field => {
                        kycRequest.additionalInfoRequired.push({
                            field: field.field,
                            reason: field.reason,
                            requestedBy: reviewerId,
                            requestedAt: new Date()
                        });
                    });
                }
                break;
        }

        // Add internal note if remarks provided
        if (options.remarks) {
            kycRequest.internalNotes.push({
                note: `Status changed from '${oldStatus}' to '${newStatus}': ${options.remarks}`,
                addedBy: reviewerId,
                addedAt: new Date(),
                isPrivate: true
            });
        }

        await kycRequest.save();

        return {
            success: true,
            message: `KYC request status updated to '${newStatus}'`,
            data: kycRequest
        };

    } catch (error) {
        throw error;
    }
};

/**
 * Get a single KYC request
 * @param {string} requestId - KYC request ID or ObjectId
 * @param {string} userId - User ID making the request (for authorization)
 * @returns {Promise<Object>} KYC request
 */
const getKYCRequest = async (requestId, userId) => {
    try {
        if (!requestId) {
            throw new Error('Request ID is required');
        }

        // Find KYC request
        const kycRequest = await KycRequest.findById(requestId)
            .populate('userId', 'email personalInfo.fullName personalInfo.nid contactInfo.primaryPhone')
            .populate('bankId', 'bankName bankCode')
            .populate('workflow.assignedTo', 'personalInfo.fullName email')
            .populate('workflow.reviewedBy', 'personalInfo.fullName email')
            .populate('workflow.approvedBy', 'personalInfo.fullName email');

        if (!kycRequest) {
            throw new Error('KYC request not found');
        }

        // Authorization check
        if (userId) {
            const user = await User.findById(userId);

            // Customer can only see their own requests
            if (user.role === 'customer' && kycRequest.userId._id.toString() !== userId.toString()) {
                throw new Error('Unauthorized to view this KYC request');
            }

            // Bank officer can only see requests for their bank
            if (user.role === 'bank_officer') {
                if (!user.bankOfficerInfo?.bankId ||
                    user.bankOfficerInfo.bankId.toString() !== kycRequest.bankId._id.toString()) {
                    throw new Error('Unauthorized to view this KYC request');
                }
            }
        }

        return {
            success: true,
            data: kycRequest
        };

    } catch (error) {
        throw error;
    }
};

/**
 * Get user's KYC history
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit number of results
 * @param {number} options.skip - Skip number of results
 * @param {string} options.status - Filter by status
 * @returns {Promise<Object>} User's KYC requests
 */
const getUserKYCHistory = async (userId, options = {}) => {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Build query
        const query = { userId };
        if (options.status) {
            query.status = options.status;
        }

        // Get KYC requests
        const requests = await KycRequest.find(query)
            .populate('bankId', 'bankName bankCode')
            .populate('workflow.reviewedBy', 'personalInfo.fullName email')
            .sort({ createdAt: -1 })
            .limit(options.limit || 10)
            .skip(options.skip || 0);

        // Get total count
        const totalCount = await KycRequest.countDocuments(query);

        return {
            success: true,
            data: {
                requests,
                pagination: {
                    total: totalCount,
                    limit: options.limit || 10,
                    skip: options.skip || 0,
                    hasMore: totalCount > (options.skip || 0) + requests.length
                }
            }
        };

    } catch (error) {
        throw error;
    }
};

/**
 * Get pending KYC requests for a bank
 * @param {string} bankId - Bank ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Pending KYC requests
 */
const getPendingRequests = async (bankId, options = {}) => {
    try {
        if (!bankId) {
            throw new Error('Bank ID is required');
        }

        const requests = await KycRequest.findPending(bankId)
            .populate('userId', 'email personalInfo.fullName personalInfo.nid')
            .populate('workflow.assignedTo', 'personalInfo.fullName email')
            .limit(options.limit || 50)
            .skip(options.skip || 0);

        const totalCount = await KycRequest.countDocuments({
            bankId,
            status: { $in: ['pending', 'under_review', 'document_verification'] }
        });

        return {
            success: true,
            data: {
                requests,
                pagination: {
                    total: totalCount,
                    limit: options.limit || 50,
                    skip: options.skip || 0
                }
            }
        };

    } catch (error) {
        throw error;
    }
};

/**
 * Assign KYC request to an officer
 * @param {string} requestId - KYC request ID
 * @param {string} officerId - Officer ID to assign to
 * @param {string} assignerId - ID of user making the assignment
 * @returns {Promise<Object>} Updated KYC request
 */
const assignKYCRequest = async (requestId, officerId, assignerId) => {
    try {
        const kycRequest = await KycRequest.findById(requestId);
        if (!kycRequest) {
            throw new Error('KYC request not found');
        }

        const officer = await User.findById(officerId);
        if (!officer || officer.role !== 'bank_officer') {
            throw new Error('Officer not found or invalid role');
        }

        // Verify officer belongs to the same bank
        if (officer.bankOfficerInfo?.bankId?.toString() !== kycRequest.bankId.toString()) {
            throw new Error('Officer must belong to the same bank as the request');
        }

        await kycRequest.assignTo(officerId);

        // Add note
        kycRequest.internalNotes.push({
            note: `Request assigned to ${officer.personalInfo.fullName}`,
            addedBy: assignerId,
            isPrivate: true
        });

        await kycRequest.save();

        return {
            success: true,
            message: 'KYC request assigned successfully',
            data: kycRequest
        };

    } catch (error) {
        throw error;
    }
};

module.exports = {
    createKYCRequest,
    updateKYCStatus,
    getKYCRequest,
    getUserKYCHistory,
    getPendingRequests,
    assignKYCRequest,
    verifyNIDFormat,
    validateStatusTransition,
    STATUS_TRANSITIONS
};
