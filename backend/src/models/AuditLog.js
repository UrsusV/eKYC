const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    // Log Identification
    logId: {
        type: String,
        unique: true,
        uppercase: true,
        index: true
    },

    // Timestamp
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        index: true,
        immutable: true
    },

    // Actor Information
    actor: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
            immutable: true
        },
        userEmail: {
            type: String,
            required: true,
            immutable: true
        },
        userRole: {
            type: String,
            enum: ['customer', 'bank_officer', 'admin'],
            required: true,
            immutable: true,
            index: true
        },
        bankId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bank',
            index: true,
            immutable: true
        }
    },

    // Action Details
    action: {
        type: {
            type: String,
            required: [true, 'Action type is required'],
            enum: {
                values: [
                    'user_register',
                    'user_login',
                    'user_logout',
                    'user_update',
                    'user_delete',
                    'password_change',
                    'password_reset',
                    '2fa_enable',
                    '2fa_disable',
                    'kyc_submit',
                    'kyc_update',
                    'kyc_approve',
                    'kyc_reject',
                    'kyc_review_start',
                    'kyc_assign',
                    'kyc_cancel',
                    'kyc_expire',
                    'document_upload',
                    'document_view',
                    'document_download',
                    'document_verify',
                    'document_reject',
                    'document_delete',
                    'document_update',
                    'credential_issue',
                    'credential_revoke',
                    'credential_verify',
                    'credential_share',
                    'consent_grant',
                    'consent_revoke',
                    'consent_request',
                    'bank_register',
                    'bank_update',
                    'bank_verify',
                    'bank_suspend',
                    'bank_activate',
                    'admin_role_change',
                    'admin_permission_grant',
                    'admin_permission_revoke',
                    'admin_system_config',
                    'admin_user_impersonate',
                    'login_failed',
                    'account_locked',
                    'account_unlocked',
                    'suspicious_activity',
                    'security_breach_attempt',
                    'blockchain_transaction',
                    'blockchain_verify',
                    'aml_screening',
                    'risk_assessment',
                    'compliance_report_generate',
                    'data_export',
                    'data_import',
                    'data_delete',
                    'data_anonymize',
                    'other'
                ],
                message: '{VALUE} is not a valid action type'
            },
            required: true,
            index: true,
            immutable: true
        },

        category: {
            type: String,
            enum: [
                'authentication',
                'authorization',
                'kyc',
                'document',
                'credential',
                'consent',
                'bank',
                'admin',
                'security',
                'blockchain',
                'compliance',
                'data',
                'system'
            ],
            required: true,
            index: true,
            immutable: true
        },

        description: {
            type: String,
            required: true,
            maxlength: 500,
            immutable: true
        },

        severity: {
            type: String,
            enum: ['info', 'low', 'medium', 'high', 'critical'],
            default: 'info',
            required: true,
            index: true,
            immutable: true
        }
    },

    // Target Resource
    target: {
        resourceType: {
            type: String,
            enum: ['user', 'kyc_request', 'document', 'credential', 'bank', 'consent', 'system', 'other'],
            immutable: true,
            index: true
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            immutable: true,
            index: true
        },
        resourceIdentifier: {
            type: String,
            immutable: true
        }
    },

    // Status and Outcome
    status: {
        type: String,
        enum: ['success', 'failure', 'partial', 'pending'],
        default: 'success',
        required: true,
        immutable: true,
        index: true
    },

    // Changes Made
    changes: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed,
        fieldsChanged: [String]
    },

    // Request Details
    request: {
        ipAddress: {
            type: String,
            required: true,
            immutable: true,
            index: true
        },
        userAgent: {
            type: String,
            immutable: true
        },
        deviceType: {
            type: String,
            enum: ['web', 'mobile', 'tablet', 'api', 'unknown'],
            default: 'unknown',
            immutable: true
        },
        location: {
            country: String,
            region: String,
            city: String,
            coordinates: {
                latitude: Number,
                longitude: Number
            }
        },
        method: {
            type: String,
            enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            immutable: true
        },
        endpoint: {
            type: String,
            immutable: true
        },
        requestId: {
            type: String,
            immutable: true
        }
    },

    // Compliance Information
    compliance: {
        regulatoryRequirement: {
            type: String,
            enum: [
                'bangladesh_bank_kyc',
                'aml_cft_act_2012',
                'money_laundering_prevention_act_2012',
                'data_protection',
                'right_to_be_forgotten',
                'audit_trail',
                'other'
            ],
            index: true
        },
        retainUntil: {
            type: Date,
            required: true,
            default: function() {
                return new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);
            },
            immutable: true
        },
        canDelete: {
            type: Boolean,
            default: false,
            immutable: true
        }
    },

    // Error Information
    error: {
        code: String,
        message: String,
        stack: String
    },

    // Additional Context
    metadata: {
        sessionId: String,
        transactionId: String,
        correlationId: String,
        parentLogId: String,
        tags: [String],
        customData: mongoose.Schema.Types.Mixed
    },

    // Blockchain Verification
    blockchain: {
        isVerified: {
            type: Boolean,
            default: false
        },
        transactionHash: {
            type: String,
            unique: true,
            sparse: true
        },
        blockNumber: Number,
        verifiedAt: Date
    },

    // Privacy and Security
    isPIIIncluded: {
        type: Boolean,
        default: false,
        index: true
    },

    isAnonymized: {
        type: Boolean,
        default: false
    },

    anonymizedAt: Date,

    // Review and Investigation
    requiresReview: {
        type: Boolean,
        default: false,
        index: true
    },

    reviewedAt: Date,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    investigationStatus: {
        type: String,
        enum: ['none', 'pending', 'in_progress', 'resolved', 'escalated'],
        default: 'none',
        index: true
    },

    investigationNotes: String,

    // Alerting
    alertTriggered: {
        type: Boolean,
        default: false,
        index: true
    },

    alertType: {
        type: String,
        enum: ['security', 'compliance', 'fraud', 'system', 'other']
    },

    alertSentAt: Date,

    // System Information
    system: {
        environment: {
            type: String,
            enum: ['development', 'staging', 'production'],
            default: 'production',
            immutable: true
        },
        version: String,
        hostname: String,
        processId: String
    }
}, {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound Indexes
auditLogSchema.index({ timestamp: -1, 'actor.userId': 1 });
auditLogSchema.index({ 'actor.userId': 1, 'action.type': 1, timestamp: -1 });
auditLogSchema.index({ 'target.resourceType': 1, 'target.resourceId': 1, timestamp: -1 });
auditLogSchema.index({ 'action.category': 1, 'action.severity': 1, timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });
auditLogSchema.index({ 'request.ipAddress': 1, timestamp: -1 });
auditLogSchema.index({ 'actor.bankId': 1, timestamp: -1 }, { sparse: true });
auditLogSchema.index({ requiresReview: 1, investigationStatus: 1 });
auditLogSchema.index({ alertTriggered: 1, alertType: 1 });
auditLogSchema.index({ 'blockchain.isVerified': 1 });

// TTL Index: Auto-delete after retention period
auditLogSchema.index({ 'compliance.retainUntil': 1 }, { expireAfterSeconds: 0 });

// Virtual: Age of Log
auditLogSchema.virtual('ageInDays').get(function() {
    return Math.floor((Date.now() - this.timestamp) / (24 * 60 * 60 * 1000));
});

// Virtual: Days Until Deletion
auditLogSchema.virtual('daysUntilDeletion').get(function() {
    if (!this.compliance.retainUntil) return null;
    return Math.ceil((this.compliance.retainUntil - Date.now()) / (24 * 60 * 60 * 1000));
});

// Virtual: Is Critical
auditLogSchema.virtual('isCritical').get(function() {
    return this.action.severity === 'critical' || this.action.severity === 'high';
});

// Pre-save Middleware: Generate Log ID
auditLogSchema.pre('save', async function(next) {
    if (this.isNew && !this.logId) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();

        this.logId = `LOG${year}${month}${day}${random}`;
    }
    next();
});

// Pre-save Middleware: Auto-flag for review
auditLogSchema.pre('save', function(next) {
    if (this.action.severity === 'critical' || this.status === 'failure') {
        this.requiresReview = true;
    }

    const suspiciousActions = [
        'login_failed',
        'security_breach_attempt',
        'admin_user_impersonate',
        'suspicious_activity'
    ];

    if (suspiciousActions.includes(this.action.type)) {
        this.requiresReview = true;
        this.alertTriggered = true;
        this.alertType = 'security';
    }

    next();
});

// Pre-save Middleware: Prevent updates
auditLogSchema.pre('save', function(next) {
    if (!this.isNew) {
        return next(new Error('Audit logs cannot be modified after creation'));
    }
    next();
});

// Static Method: Create audit log
auditLogSchema.statics.createLog = async function(logData) {
    try {
        const log = new this(logData);
        await log.save();
        return log;
    } catch (error) {
        console.error('Failed to create audit log:', error);
        throw error;
    }
};

// Static Method: Find logs by user
auditLogSchema.statics.findByUser = function(userId, startDate, endDate) {
    const query = { 'actor.userId': userId };

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    return this.find(query).sort({ timestamp: -1 });
};

// Static Method: Find logs by action type
auditLogSchema.statics.findByAction = function(actionType, startDate, endDate) {
    const query = { 'action.type': actionType };

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    return this.find(query).sort({ timestamp: -1 });
};

// Static Method: Find suspicious activities
auditLogSchema.statics.findSuspicious = function(limit = 100) {
    return this.find({
        $or: [
            { 'action.severity': { $in: ['high', 'critical'] } },
            { status: 'failure' },
            { requiresReview: true },
            { alertTriggered: true }
        ]
    })
        .sort({ timestamp: -1 })
        .limit(limit);
};

// Static Method: Generate compliance report
auditLogSchema.statics.generateComplianceReport = async function(startDate, endDate, options = {}) {
    const matchStage = {
        timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    if (options.userId) matchStage['actor.userId'] = mongoose.Types.ObjectId(options.userId);
    if (options.category) matchStage['action.category'] = options.category;
    if (options.bankId) matchStage['actor.bankId'] = mongoose.Types.ObjectId(options.bankId);

    const report = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    category: '$action.category',
                    type: '$action.type'
                },
                count: { $sum: 1 },
                successCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
                },
                failureCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
                },
                criticalCount: {
                    $sum: { $cond: [{ $eq: ['$action.severity', 'critical'] }, 1, 0] }
                }
            }
        },
        { $sort: { count: -1 } }
    ]);

    return report;
};

// Static Method: Find failed login attempts
auditLogSchema.statics.findFailedLogins = function(userId, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.find({
        'actor.userId': userId,
        'action.type': 'login_failed',
        timestamp: { $gte: since }
    }).sort({ timestamp: -1 });
};

// Instance Method: Anonymize PII
auditLogSchema.methods.anonymize = function() {
    if (this.isAnonymized) return this;

    if (this.actor.userEmail) {
        this.actor.userEmail = `anonymized_${this._id}@example.com`;
    }

    if (this.metadata?.customData) {
        this.metadata.customData = { anonymized: true };
    }

    if (this.changes) {
        this.changes = { anonymized: true };
    }

    this.isAnonymized = true;
    this.anonymizedAt = new Date();

    return this.save();
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
