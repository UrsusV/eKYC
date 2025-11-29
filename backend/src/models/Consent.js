const mongoose = require('mongoose');

/**
 * Consent Model
 * Manages user consent for data sharing and processing
 */

const consentSchema = new mongoose.Schema({
    // User who gave consent
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // KYC Request this consent is for
    kycRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KycRequest',
        required: true,
        index: true
    },

    // Consent ID for tracking
    consentId: {
        type: String,
        unique: true,
        default: function() {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            return `CNS${timestamp}${random}`;
        }
    },

    // Type of consent
    consentType: {
        type: String,
        enum: [
            'data_collection',      // Consent to collect personal data
            'data_processing',      // Consent to process data for KYC
            'data_sharing',         // Consent to share data with third parties
            'blockchain_storage',   // Consent to store credentials on blockchain
            'biometric_collection', // Consent to collect biometric data
            'credit_check',         // Consent for credit verification
            'background_check',     // Consent for background verification
            'all'                   // All-inclusive consent
        ],
        required: true
    },

    // Consent status
    status: {
        type: String,
        enum: ['pending', 'granted', 'denied', 'revoked', 'expired'],
        default: 'pending',
        required: true
    },

    // Purpose of consent
    purpose: {
        type: String,
        required: true,
        maxlength: 500
    },

    // Detailed consent text shown to user
    consentText: {
        type: String,
        required: true
    },

    // Duration of consent (in days)
    duration: {
        type: Number,
        default: 365, // 1 year default
        min: 1,
        max: 3650 // Max 10 years
    },

    // Grant details
    grantedAt: {
        type: Date
    },

    grantedBy: {
        ipAddress: String,
        userAgent: String,
        location: {
            country: String,
            city: String
        }
    },

    // Expiry date (calculated from grantedAt + duration)
    expiresAt: {
        type: Date
    },

    // Revocation details
    revokedAt: {
        type: Date
    },

    revocationReason: {
        type: String,
        maxlength: 500
    },

    // Third parties with whom data will be shared
    thirdParties: [{
        name: {
            type: String,
            required: true
        },
        purpose: String,
        dataCategories: [String]
    }],

    // Data categories covered by this consent
    dataCategories: [{
        type: String,
        enum: [
            'personal_info',        // Name, DOB, etc.
            'contact_info',         // Email, phone, address
            'identification',       // NID, passport, etc.
            'biometric',           // Fingerprint, face, etc.
            'financial',           // Bank details, transactions
            'employment',          // Employment history
            'education',           // Educational records
            'medical',             // Health records
            'criminal_record'      // Criminal background
        ]
    }],

    // Legal basis for processing
    legalBasis: {
        type: String,
        enum: [
            'consent',              // User consent
            'contract',             // Contract execution
            'legal_obligation',     // Legal requirement
            'vital_interests',      // Protection of vital interests
            'public_task',          // Public interest task
            'legitimate_interests'  // Legitimate business interests
        ],
        default: 'consent'
    },

    // Version of consent form (for tracking changes)
    version: {
        type: String,
        default: '1.0'
    },

    // Is this consent mandatory for the service?
    isMandatory: {
        type: Boolean,
        default: false
    },

    // Withdrawal allowed?
    canBeWithdrawn: {
        type: Boolean,
        default: true
    },

    // Metadata
    metadata: {
        policyUrl: String,          // Link to privacy policy
        termsUrl: String,           // Link to terms of service
        language: {
            type: String,
            default: 'en'
        },
        jurisdiction: String        // Legal jurisdiction
    },

    // Audit trail
    auditLog: [{
        action: {
            type: String,
            enum: ['created', 'granted', 'denied', 'revoked', 'viewed', 'modified']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        details: String,
        ipAddress: String
    }],

    // Active status
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
consentSchema.index({ userId: 1, status: 1 });
consentSchema.index({ kycRequestId: 1 });
consentSchema.index({ consentType: 1, status: 1 });
consentSchema.index({ expiresAt: 1 });
consentSchema.index({ status: 1, isActive: 1 });

// Virtual for checking if consent is expired
consentSchema.virtual('isExpired').get(function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
});

// Virtual for checking if consent is valid
consentSchema.virtual('isValid').get(function() {
    return this.status === 'granted' &&
           this.isActive &&
           !this.isExpired;
});

// Pre-save middleware to set expiry date
consentSchema.pre('save', function(next) {
    if (this.grantedAt && this.duration && !this.expiresAt) {
        const expiryDate = new Date(this.grantedAt);
        expiryDate.setDate(expiryDate.getDate() + this.duration);
        this.expiresAt = expiryDate;
    }
    next();
});

// Method to grant consent
consentSchema.methods.grant = function(grantDetails) {
    this.status = 'granted';
    this.grantedAt = new Date();
    this.grantedBy = grantDetails;

    // Calculate expiry
    const expiryDate = new Date(this.grantedAt);
    expiryDate.setDate(expiryDate.getDate() + this.duration);
    this.expiresAt = expiryDate;

    // Add to audit log
    this.auditLog.push({
        action: 'granted',
        timestamp: this.grantedAt,
        performedBy: this.userId,
        details: 'Consent granted by user',
        ipAddress: grantDetails.ipAddress
    });

    return this.save();
};

// Method to revoke consent
consentSchema.methods.revoke = function(reason, performedBy, ipAddress) {
    if (!this.canBeWithdrawn) {
        throw new Error('This consent cannot be withdrawn');
    }

    this.status = 'revoked';
    this.revokedAt = new Date();
    this.revocationReason = reason;
    this.isActive = false;

    // Add to audit log
    this.auditLog.push({
        action: 'revoked',
        timestamp: this.revokedAt,
        performedBy: performedBy,
        details: reason,
        ipAddress: ipAddress
    });

    return this.save();
};

// Method to deny consent
consentSchema.methods.deny = function(performedBy, ipAddress) {
    this.status = 'denied';

    // Add to audit log
    this.auditLog.push({
        action: 'denied',
        timestamp: new Date(),
        performedBy: performedBy,
        details: 'Consent denied by user',
        ipAddress: ipAddress
    });

    return this.save();
};

// Static method to check if user has valid consent
consentSchema.statics.hasValidConsent = async function(userId, kycRequestId, consentType) {
    const consent = await this.findOne({
        userId,
        kycRequestId,
        consentType: { $in: [consentType, 'all'] },
        status: 'granted',
        isActive: true,
        $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null }
        ]
    });

    return !!consent;
};

// Static method to get all valid consents for a user
consentSchema.statics.getValidConsents = async function(userId, kycRequestId) {
    return this.find({
        userId,
        kycRequestId,
        status: 'granted',
        isActive: true,
        $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null }
        ]
    });
};

// Generate consent ID
const Consent = mongoose.model('Consent', consentSchema);

module.exports = Consent;
