const mongoose = require('mongoose');

/**
 * Credential Schema
 * Stores blockchain-issued credentials for KYC verification
 */
const credentialSchema = new mongoose.Schema({
    // Unique Credential Identifier
    credentialId: {
        type: String,
        required: [true, 'Credential ID is required'],
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

    // KYC Request Reference
    kycRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KycRequest',
        required: [true, 'KYC Request ID is required'],
        index: true
    },

    // Bank Reference (Issuer)
    bankId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bank',
        required: [true, 'Bank ID is required'],
        index: true
    },

    // Issued By (Bank Officer)
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Issuer is required']
    },

    // Credential Type
    credentialType: {
        type: String,
        enum: {
            values: [
                'identity_verification',
                'address_verification',
                'document_verification',
                'kyc_level_1',
                'kyc_level_2',
                'kyc_level_3'
            ],
            message: '{VALUE} is not a valid credential type'
        },
        required: [true, 'Credential type is required'],
        index: true
    },

    // Blockchain Data
    blockchain: {
        credentialHash: {
            type: String,
            required: [true, 'Credential hash is required'],
            unique: true,
            index: true
        },
        transactionHash: {
            type: String,
            required: [true, 'Transaction hash is required'],
            unique: true,
            index: true
        },
        blockNumber: {
            type: Number,
            required: [true, 'Block number is required'],
            index: true
        },
        holderAddress: {
            type: String,
            required: [true, 'Holder blockchain address is required'],
            lowercase: true,
            match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format']
        },
        issuerAddress: {
            type: String,
            required: [true, 'Issuer blockchain address is required'],
            lowercase: true,
            match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format']
        },
        blockchainCredentialId: {
            type: String,
            required: false,
            sparse: true,
            index: true
        },
        networkId: {
            type: String,
            default: 'localhost'
        },
        gasUsed: {
            type: String
        }
    },

    // Credential Status
    status: {
        type: String,
        enum: {
            values: ['pending', 'active', 'revoked', 'expired', 'suspended'],
            message: '{VALUE} is not a valid credential status'
        },
        default: 'active',
        required: true,
        index: true
    },

    // Validity Period
    issuedAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },

    expiresAt: {
        type: Date,
        required: true,
        index: true
    },

    // Revocation Details
    revocation: {
        isRevoked: {
            type: Boolean,
            default: false,
            index: true
        },
        revokedAt: Date,
        revokedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        revocationReason: {
            type: String,
            enum: [
                'fraud_detected',
                'data_inaccuracy',
                'user_request',
                'expired_documents',
                'compliance_violation',
                'duplicate_credential',
                'other'
            ]
        },
        revocationDetails: String,
        revocationTransactionHash: String
    },

    // Credential Data (encrypted reference)
    credentialData: {
        documentType: String,
        documentNumber: String,
        fullName: String,
        dateOfBirth: Date,
        nationality: String,
        kycLevel: {
            type: Number,
            enum: [1, 2, 3]
        }
    },

    // Verification Proof
    verificationProof: {
        verificationMethod: {
            type: String,
            enum: ['manual', 'automated', 'hybrid'],
            default: 'manual'
        },
        verificationScore: {
            type: Number,
            min: 0,
            max: 100
        },
        verificationNotes: String,
        documentsVerified: [String],
        checksPerformed: [String]
    },

    // Access Control
    accessGrants: [{
        grantedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        grantedAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: Date,
        purpose: String,
        isActive: {
            type: Boolean,
            default: true
        }
    }],

    // Audit Trail
    auditLog: [{
        action: {
            type: String,
            enum: [
                'issued',
                'accessed',
                'verified',
                'revoked',
                'renewed',
                'access_granted',
                'access_revoked',
                'updated'
            ],
            required: true
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        performedAt: {
            type: Date,
            default: Date.now
        },
        ipAddress: String,
        userAgent: String,
        details: String
    }],

    // Metadata
    metadata: {
        version: {
            type: String,
            default: '1.0'
        },
        credentialSchema: String,
        issuancePolicy: String,
        verificationPolicy: String
    },

    // Usage Statistics
    usageStats: {
        viewCount: {
            type: Number,
            default: 0
        },
        verificationCount: {
            type: Number,
            default: 0
        },
        lastAccessedAt: Date,
        lastVerifiedAt: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Composite indexes for performance (individual field indexes are already defined with index: true above)
credentialSchema.index({ userId: 1, status: 1 });
credentialSchema.index({ kycRequestId: 1, status: 1 });
credentialSchema.index({ status: 1, expiresAt: 1 });
credentialSchema.index({ issuedAt: -1 });

// Virtual for checking if credential is expired
credentialSchema.virtual('isExpired').get(function() {
    return this.expiresAt < new Date();
});

// Virtual for checking if credential is valid
credentialSchema.virtual('isValid').get(function() {
    return this.status === 'active' &&
           !this.revocation.isRevoked &&
           !this.isExpired;
});

// Virtual for days until expiry
credentialSchema.virtual('daysUntilExpiry').get(function() {
    const now = new Date();
    const diffTime = this.expiresAt - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate credential ID
credentialSchema.pre('save', async function(next) {
    if (!this.credentialId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.credentialId = `CRED-${timestamp}-${random}`;
    }

    // Auto-expire if past expiry date
    if (this.expiresAt < new Date() && this.status === 'active') {
        this.status = 'expired';
    }

    next();
});

// Pre-save middleware for audit logging
credentialSchema.pre('save', function(next) {
    if (this.isNew) {
        this.auditLog.push({
            action: 'issued',
            performedBy: this.issuedBy,
            performedAt: new Date(),
            details: `Credential issued for ${this.credentialType}`
        });
    }
    next();
});

// Static method to find active credentials
credentialSchema.statics.findActive = function(userId) {
    return this.find({
        userId,
        status: 'active',
        'revocation.isRevoked': false,
        expiresAt: { $gt: new Date() }
    }).sort({ issuedAt: -1 });
};

// Static method to find expiring soon
credentialSchema.statics.findExpiringSoon = function(days = 30) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.find({
        status: 'active',
        'revocation.isRevoked': false,
        expiresAt: {
            $gt: now,
            $lte: futureDate
        }
    }).sort({ expiresAt: 1 });
};

// Instance method to revoke credential
credentialSchema.methods.revoke = async function(revokedBy, reason, details, txHash) {
    this.status = 'revoked';
    this.revocation = {
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy,
        revocationReason: reason,
        revocationDetails: details,
        revocationTransactionHash: txHash
    };

    this.auditLog.push({
        action: 'revoked',
        performedBy: revokedBy,
        performedAt: new Date(),
        details: `Credential revoked: ${reason}`
    });

    return this.save();
};

// Instance method to grant access
credentialSchema.methods.grantAccess = async function(userId, purpose, duration = 30) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    this.accessGrants.push({
        grantedTo: userId,
        grantedAt: new Date(),
        expiresAt,
        purpose,
        isActive: true
    });

    this.auditLog.push({
        action: 'access_granted',
        performedBy: this.userId,
        performedAt: new Date(),
        details: `Access granted to ${userId} for ${purpose}`
    });

    return this.save();
};

// Instance method to record verification
credentialSchema.methods.recordVerification = async function(verifiedBy) {
    this.usageStats.verificationCount += 1;
    this.usageStats.lastVerifiedAt = new Date();

    this.auditLog.push({
        action: 'verified',
        performedBy: verifiedBy,
        performedAt: new Date(),
        details: 'Credential verified on blockchain'
    });

    return this.save();
};

// Instance method to record access
credentialSchema.methods.recordAccess = async function(accessedBy, ipAddress, userAgent) {
    this.usageStats.viewCount += 1;
    this.usageStats.lastAccessedAt = new Date();

    this.auditLog.push({
        action: 'accessed',
        performedBy: accessedBy,
        performedAt: new Date(),
        ipAddress,
        userAgent,
        details: 'Credential accessed'
    });

    return this.save();
};

const Credential = mongoose.model('Credential', credentialSchema);

module.exports = Credential;
