const mongoose = require('mongoose');

const kycRequestSchema = new mongoose.Schema({
    // Request Identification
    requestId: {
        type: String,
        unique: true,
        uppercase: true,
        index: true
    },

    // User Reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },

    // Bank Reference
    bankId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bank',
        required: [true, 'Bank ID is required'],
        index: true
    },

    // Request Type
    requestType: {
        type: String,
        enum: {
            values: ['new', 'update', 'renewal', 'upgrade'],
            message: '{VALUE} is not a valid request type'
        },
        required: true,
        index: true
    },

    kycLevel: {
        type: Number,
        enum: [1, 2, 3],
        required: true,
        default: 1
    },

    // Status Workflow
    status: {
        type: String,
        enum: {
            values: [
                'draft',
                'submitted',
                'pending',
                'document_verification',
                'under_review',
                'additional_info_required',
                'approved',
                'rejected',
                'expired',
                'cancelled'
            ],
            message: '{VALUE} is not a valid status'
        },
        default: 'draft',
        required: true,
        index: true
    },

    // Status History
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        remarks: String,
        ipAddress: String
    }],

    // Workflow Tracking
    workflow: {
        submittedAt: Date,
        reviewStartedAt: Date,
        reviewCompletedAt: Date,
        approvedAt: Date,
        rejectedAt: Date,
        expiresAt: Date,

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },

    // Documents Submitted
    documents: [{
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
            required: true
        },
        documentType: {
            type: String,
            required: true,
            enum: [
                'nid_front',
                'nid_back',
                'passport',
                'birth_certificate',
                'driving_license',
                'utility_bill',
                'bank_statement',
                'tax_certificate',
                'photograph',
                'signature',
                'income_proof',
                'address_proof',
                'business_registration',
                'trade_license',
                'other'
            ]
        },
        status: {
            type: String,
            enum: ['pending', 'verified', 'rejected', 'expired'],
            default: 'pending'
        },
        verifiedAt: Date,
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        remarks: String
    }],

    // Additional Information Required
    additionalInfoRequired: [{
        field: String,
        reason: String,
        requestedAt: {
            type: Date,
            default: Date.now
        },
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        providedAt: Date,
        response: String
    }],

    // Risk Assessment
    riskAssessment: {
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'very_high'],
            default: 'low'
        },
        riskFactors: [{
            factor: String,
            score: Number,
            description: String
        }],
        totalRiskScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        assessedAt: Date,
        assessedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        remarks: String
    },

    // Verification Checks
    verificationChecks: {
        nidVerification: {
            status: {
                type: String,
                enum: ['pending', 'success', 'failed'],
                default: 'pending'
            },
            verifiedAt: Date,
            remarks: String
        },
        faceMatch: {
            status: {
                type: String,
                enum: ['pending', 'success', 'failed'],
                default: 'pending'
            },
            confidenceScore: Number,
            verifiedAt: Date
        },
        addressVerification: {
            status: {
                type: String,
                enum: ['pending', 'success', 'failed'],
                default: 'pending'
            },
            method: {
                type: String,
                enum: ['utility_bill', 'bank_statement', 'government_letter', 'field_visit']
            },
            verifiedAt: Date,
            remarks: String
        },
        phoneVerification: {
            status: {
                type: String,
                enum: ['pending', 'success', 'failed'],
                default: 'pending'
            },
            verifiedAt: Date,
            otpSentAt: Date
        },
        emailVerification: {
            status: {
                type: String,
                enum: ['pending', 'success', 'failed'],
                default: 'pending'
            },
            verifiedAt: Date
        },
        biometricVerification: {
            status: {
                type: String,
                enum: ['pending', 'success', 'failed', 'not_required'],
                default: 'not_required'
            },
            verifiedAt: Date,
            biometricType: {
                type: String,
                enum: ['fingerprint', 'iris', 'facial']
            }
        }
    },

    // AML/CFT Screening
    amlScreening: {
        status: {
            type: String,
            enum: ['pending', 'clear', 'flagged', 'blocked'],
            default: 'pending'
        },
        screenedAt: Date,
        screenedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        watchlistMatch: {
            type: Boolean,
            default: false
        },
        pep: {
            type: Boolean,
            default: false
        },
        sanctionsList: {
            type: Boolean,
            default: false
        },
        adverseMedia: {
            type: Boolean,
            default: false
        },
        remarks: String
    },

    // Rejection Details
    rejectionReason: {
        category: {
            type: String,
            enum: [
                'incomplete_documents',
                'invalid_documents',
                'failed_verification',
                'high_risk',
                'aml_concerns',
                'duplicate_account',
                'ineligible',
                'other'
            ]
        },
        details: String,
        canReapply: {
            type: Boolean,
            default: true
        },
        reapplyAfter: Date
    },

    // Blockchain Integration
    blockchain: {
        credentialHash: {
            type: String,
            unique: true,
            sparse: true,
            index: true
        },
        transactionHash: {
            type: String,
            unique: true,
            sparse: true
        },
        blockNumber: Number,
        issuedOnChain: {
            type: Boolean,
            default: false
        },
        issuedAt: Date
    },

    // Processing Metrics
    metrics: {
        submissionDuration: Number,
        reviewDuration: Number,
        totalProcessingTime: Number,
        documentVerificationTime: Number,
        numberOfRevisions: {
            type: Number,
            default: 0
        },
        officerChanges: {
            type: Number,
            default: 0
        }
    },

    // Notes and Comments
    internalNotes: [{
        note: {
            type: String,
            required: true
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        isPrivate: {
            type: Boolean,
            default: true
        }
    }],

    // IP and Device Tracking
    submissionDetails: {
        ipAddress: String,
        userAgent: String,
        deviceType: String,
        location: {
            country: String,
            region: String,
            city: String,
            coordinates: {
                latitude: Number,
                longitude: Number
            }
        }
    },

    // Priority
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
        index: true
    },

    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound Indexes
kycRequestSchema.index({ userId: 1, status: 1 });
kycRequestSchema.index({ bankId: 1, status: 1 });
kycRequestSchema.index({ status: 1, priority: 1, createdAt: -1 });
kycRequestSchema.index({ 'workflow.assignedTo': 1, status: 1 });
kycRequestSchema.index({ requestType: 1, kycLevel: 1 });
kycRequestSchema.index({ 'amlScreening.status': 1 });
kycRequestSchema.index({ 'riskAssessment.riskLevel': 1 });
kycRequestSchema.index({ createdAt: -1 });

// TTL Index: Auto-delete expired requests after 90 days
kycRequestSchema.index({ 'workflow.expiresAt': 1 }, { expireAfterSeconds: 7776000 });

// Virtual: Days Since Submission
kycRequestSchema.virtual('daysSinceSubmission').get(function() {
    if (!this.workflow?.submittedAt) return null;
    return Math.floor((Date.now() - this.workflow.submittedAt) / (24 * 60 * 60 * 1000));
});

// Virtual: Is Expired
kycRequestSchema.virtual('isExpired').get(function() {
    if (!this.workflow?.expiresAt) return false;
    return this.workflow.expiresAt < Date.now();
});

// Virtual: All Documents Verified
kycRequestSchema.virtual('allDocumentsVerified').get(function() {
    if (!this.documents || this.documents.length === 0) return false;
    return this.documents.every(doc => doc.status === 'verified');
});

// Virtual: Verification Progress
kycRequestSchema.virtual('verificationProgress').get(function() {
    const checks = this.verificationChecks;
    if (!checks) return 0;

    const checkKeys = ['nidVerification', 'faceMatch', 'addressVerification', 'phoneVerification', 'emailVerification'];
    const completedChecks = checkKeys.filter(key => checks[key]?.status === 'success').length;

    return Math.round((completedChecks / checkKeys.length) * 100);
});

// Pre-save Middleware: Generate Request ID
kycRequestSchema.pre('save', async function(next) {
    if (this.isNew && !this.requestId) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();

        this.requestId = `KYC${year}${month}${random}`;
    }
    next();
});

// Pre-save Middleware: Track Status Changes
kycRequestSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date(),
            changedBy: this.updatedBy
        });

        if (this.status === 'submitted' && !this.workflow.submittedAt) {
            this.workflow.submittedAt = new Date();
            this.workflow.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (this.status === 'under_review' && !this.workflow.reviewStartedAt) {
            this.workflow.reviewStartedAt = new Date();
        } else if (this.status === 'approved') {
            this.workflow.approvedAt = new Date();
            this.workflow.reviewCompletedAt = new Date();
        } else if (this.status === 'rejected') {
            this.workflow.rejectedAt = new Date();
            this.workflow.reviewCompletedAt = new Date();
        }
    }
    next();
});

// Pre-save Middleware: Calculate Processing Time
kycRequestSchema.pre('save', function(next) {
    if ((this.status === 'approved' || this.status === 'rejected') && this.workflow.submittedAt) {
        const endTime = this.workflow.approvedAt || this.workflow.rejectedAt;
        if (endTime) {
            this.metrics.totalProcessingTime = Math.floor((endTime - this.workflow.submittedAt) / 1000);
        }

        if (this.workflow.reviewStartedAt && this.workflow.reviewCompletedAt) {
            this.metrics.reviewDuration = Math.floor(
                (this.workflow.reviewCompletedAt - this.workflow.reviewStartedAt) / 1000
            );
        }
    }
    next();
});

// Static Method: Find pending requests
kycRequestSchema.statics.findPending = function(bankId) {
    const query = { status: { $in: ['pending', 'under_review', 'document_verification'] } };
    if (bankId) query.bankId = bankId;
    return this.find(query).sort({ priority: -1, createdAt: 1 });
};

// Static Method: Find overdue requests
kycRequestSchema.statics.findOverdue = function() {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    return this.find({
        status: { $in: ['pending', 'under_review'] },
        'workflow.submittedAt': { $lt: twoDaysAgo }
    }).sort({ 'workflow.submittedAt': 1 });
};

// Instance Method: Assign to officer
kycRequestSchema.methods.assignTo = function(officerId) {
    if (this.workflow.assignedTo) {
        this.metrics.officerChanges += 1;
    }
    this.workflow.assignedTo = officerId;
    return this.save();
};

// Instance Method: Add internal note
kycRequestSchema.methods.addNote = function(note, userId, isPrivate = true) {
    this.internalNotes.push({
        note,
        addedBy: userId,
        isPrivate
    });
    return this.save();
};

// Instance Method: Update document status
kycRequestSchema.methods.updateDocumentStatus = function(documentId, status, remarks, userId) {
    const doc = this.documents.find(d => d.documentId.toString() === documentId.toString());
    if (doc) {
        doc.status = status;
        doc.remarks = remarks;
        if (status === 'verified') {
            doc.verifiedAt = new Date();
            doc.verifiedBy = userId;
        }
    }
    return this.save();
};

module.exports = mongoose.model('KycRequest', kycRequestSchema);
