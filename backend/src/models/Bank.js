const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
    // Basic Information
    bankName: {
        type: String,
        required: [true, 'Bank name is required'],
        trim: true,
        unique: true
    },

    bankNameBangla: {
        type: String,
        trim: true
    },

    bankCode: {
        type: String,
        required: [true, 'Bank code is required'],
        unique: true,
        uppercase: true,
        match: [/^[A-Z]{4}$/, 'Bank code must be 4 uppercase letters'],
        index: true
    },

    swiftCode: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
        match: [/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT code']
    },

    routingNumber: {
        type: String,
        required: [true, 'Routing number is required'],
        unique: true,
        match: [/^\d{9}$/, 'Routing number must be 9 digits']
    },

    // Bangladesh Bank Registration
    licenseNumber: {
        type: String,
        required: [true, 'Bangladesh Bank license number is required'],
        unique: true
    },

    licenseIssueDate: {
        type: Date,
        required: true
    },

    licenseExpiryDate: {
        type: Date,
        required: true
    },

    bankType: {
        type: String,
        enum: {
            values: [
                'state_owned_commercial',
                'specialized',
                'private_commercial',
                'foreign_commercial',
                'islamic_bank',
                'non_banking_financial'
            ],
            message: '{VALUE} is not a valid bank type'
        },
        required: true,
        index: true
    },

    // Contact Information
    headOffice: {
        addressLine: {
            type: String,
            required: true
        },
        division: {
            type: String,
            enum: ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'],
            required: true
        },
        district: {
            type: String,
            required: true
        },
        postCode: {
            type: String,
            match: [/^\d{4}$/, 'Post code must be 4 digits']
        },
        phone: {
            type: String,
            required: true,
            match: [/^(\+880|880|0)?[1-9]\d{6,10}$/, 'Invalid Bangladesh phone number']
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
        },
        website: {
            type: String,
            match: [/^https?:\/\/.+/, 'Invalid URL']
        }
    },

    // Branch Information
    totalBranches: {
        type: Number,
        default: 0,
        min: 0
    },

    totalAgents: {
        type: Number,
        default: 0,
        min: 0
    },

    totalAtms: {
        type: Number,
        default: 0,
        min: 0
    },

    // KYC Integration
    kycIntegration: {
        isEnabled: {
            type: Boolean,
            default: false
        },
        enabledAt: Date,
        apiKey: {
            type: String,
            unique: true,
            sparse: true,
            select: false
        },
        apiSecret: {
            type: String,
            select: false
        },
        webhookUrl: {
            type: String,
            match: [/^https?:\/\/.+/, 'Invalid webhook URL']
        },
        webhookSecret: {
            type: String,
            select: false
        },
        allowedIPs: [{
            type: String,
            validate: {
                validator: function(v) {
                    return /^(\d{1,3}\.){3}\d{1,3}$/.test(v);
                },
                message: 'Invalid IP address'
            }
        }]
    },

    // Blockchain Integration
    blockchainIntegration: {
        walletAddress: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address']
        },
        isAuthorizedIssuer: {
            type: Boolean,
            default: false
        },
        authorizedAt: Date,
        authorizedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },

    // Compliance & Regulatory
    regulatory: {
        bangladeshBankInspectionDate: Date,
        nextInspectionDate: Date,
        complianceStatus: {
            type: String,
            enum: ['compliant', 'non_compliant', 'under_review', 'suspended'],
            default: 'under_review'
        },
        amlCompliant: {
            type: Boolean,
            default: false
        },
        cftCompliant: {
            type: Boolean,
            default: false
        },
        kycCompliant: {
            type: Boolean,
            default: false
        },
        remarks: String
    },

    // Statistics
    statistics: {
        totalCustomers: {
            type: Number,
            default: 0,
            min: 0
        },
        totalKycRequests: {
            type: Number,
            default: 0,
            min: 0
        },
        approvedKycRequests: {
            type: Number,
            default: 0,
            min: 0
        },
        rejectedKycRequests: {
            type: Number,
            default: 0,
            min: 0
        },
        pendingKycRequests: {
            type: Number,
            default: 0,
            min: 0
        },
        averageProcessingTime: {
            type: Number,
            default: 0
        }
    },

    // Status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    verifiedAt: Date,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    suspendedAt: Date,
    suspendedReason: String,

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

// Indexes for Performance
bankSchema.index({ bankCode: 1, isActive: 1 });
bankSchema.index({ routingNumber: 1 });
bankSchema.index({ 'kycIntegration.isEnabled': 1 });
bankSchema.index({ 'blockchainIntegration.isAuthorizedIssuer': 1 });
bankSchema.index({ 'regulatory.complianceStatus': 1 });
bankSchema.index({ createdAt: -1 });

// Virtual: License Status
bankSchema.virtual('isLicenseValid').get(function() {
    if (!this.licenseExpiryDate) return false;
    return this.licenseExpiryDate > Date.now();
});

// Virtual: KYC Approval Rate
bankSchema.virtual('kycApprovalRate').get(function() {
    if (this.statistics.totalKycRequests === 0) return 0;
    return ((this.statistics.approvedKycRequests / this.statistics.totalKycRequests) * 100).toFixed(2);
});

// Virtual: Active Officers Count
bankSchema.virtual('activeOfficers', {
    ref: 'User',
    localField: '_id',
    foreignField: 'bankOfficerInfo.bankId',
    count: true
});

// Pre-save Middleware: Validate dates
bankSchema.pre('save', function(next) {
    if (this.licenseIssueDate && this.licenseExpiryDate) {
        if (this.licenseExpiryDate <= this.licenseIssueDate) {
            return next(new Error('License expiry date must be after issue date'));
        }
    }
    next();
});

// Static Method: Find active banks
bankSchema.statics.findActive = function() {
    return this.find({ isActive: true, isVerified: true });
};

// Static Method: Find authorized issuers
bankSchema.statics.findAuthorizedIssuers = function() {
    return this.find({
        isActive: true,
        'blockchainIntegration.isAuthorizedIssuer': true
    });
};

// Instance Method: Update KYC statistics
bankSchema.methods.updateKycStats = async function(status) {
    const updates = { $inc: { 'statistics.totalKycRequests': 1 } };

    if (status === 'approved') {
        updates.$inc['statistics.approvedKycRequests'] = 1;
    } else if (status === 'rejected') {
        updates.$inc['statistics.rejectedKycRequests'] = 1;
    } else if (status === 'pending' || status === 'under_review') {
        updates.$inc['statistics.pendingKycRequests'] = 1;
    }

    return this.updateOne(updates);
};

module.exports = mongoose.model('Bank', bankSchema);
