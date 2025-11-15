const mongoose = require('mongoose');
const crypto = require('crypto');

const documentSchema = new mongoose.Schema({
    // Document Identification
    documentId: {
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

    // KYC Request Reference
    kycRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KycRequest',
        index: true
    },

    // Document Classification
    documentType: {
        type: String,
        required: [true, 'Document type is required'],
        enum: {
            values: [
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
            ],
            message: '{VALUE} is not a valid document type'
        },
        index: true
    },

    documentCategory: {
        type: String,
        enum: ['identity', 'address', 'financial', 'biometric', 'other'],
        required: true,
        index: true
    },

    // File Information
    file: {
        originalName: {
            type: String,
            required: true
        },
        fileName: {
            type: String,
            required: true,
            unique: true
        },
        filePath: {
            type: String,
            required: true
        },
        mimeType: {
            type: String,
            required: true,
            validate: {
                validator: function(v) {
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
                    return allowedTypes.includes(v);
                },
                message: 'File type not allowed'
            }
        },
        fileSize: {
            type: Number,
            required: true,
            max: [10485760, 'File size cannot exceed 10MB']
        },
        fileExtension: {
            type: String,
            required: true
        }
    },

    // Encryption Metadata
    encryption: {
        isEncrypted: {
            type: Boolean,
            default: true,
            required: true
        },
        algorithm: {
            type: String,
            default: 'aes-256-cbc',
            enum: ['aes-256-cbc', 'aes-256-gcm']
        },
        iv: {
            type: String,
            required: function() {
                return this.encryption.isEncrypted;
            },
            select: false
        },
        encryptionKeyId: {
            type: String,
            required: function() {
                return this.encryption.isEncrypted;
            },
            select: false
        },
        encryptedAt: {
            type: Date,
            default: Date.now
        },
        encryptedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },

    // Hash for Integrity
    hash: {
        algorithm: {
            type: String,
            default: 'sha256',
            enum: ['sha256', 'sha512']
        },
        value: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },

    // Blockchain Storage
    blockchain: {
        isStoredOnChain: {
            type: Boolean,
            default: false
        },
        documentHash: {
            type: String,
            unique: true,
            sparse: true
        },
        transactionHash: {
            type: String,
            unique: true,
            sparse: true
        },
        blockNumber: Number,
        storedAt: Date
    },

    // Document Verification
    verification: {
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'verified', 'rejected', 'expired'],
            default: 'pending',
            index: true
        },
        verifiedAt: Date,
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verificationMethod: {
            type: String,
            enum: ['manual', 'ocr', 'api', 'ai_model']
        },
        confidenceScore: {
            type: Number,
            min: 0,
            max: 100
        },
        remarks: String
    },

    // OCR/Extracted Data
    extractedData: {
        nidNumber: String,
        passportNumber: String,
        fullName: String,
        dateOfBirth: Date,
        address: String,
        issueDate: Date,
        expiryDate: Date,
        rawText: String,
        confidence: Number
    },

    // Quality Checks
    qualityChecks: {
        imageQuality: {
            score: Number,
            issues: [String]
        },
        tamperDetection: {
            isTampered: {
                type: Boolean,
                default: false
            },
            confidence: Number
        },
        faceDetection: {
            faceDetected: Boolean,
            numberOfFaces: Number,
            confidence: Number
        },
        readability: {
            isReadable: Boolean,
            score: Number
        }
    },

    // Access Control
    accessControl: {
        isPublic: {
            type: Boolean,
            default: false
        },
        allowedRoles: [{
            type: String,
            enum: ['admin', 'bank_officer', 'customer']
        }],
        allowedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        allowedBanks: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bank'
        }]
    },

    // Access Log
    accessLog: [{
        accessedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        accessedAt: {
            type: Date,
            default: Date.now
        },
        action: {
            type: String,
            enum: ['view', 'download', 'verify', 'update', 'delete'],
            required: true
        },
        ipAddress: String,
        reason: String
    }],

    // Expiry Management
    expiryDate: Date,

    isExpired: {
        type: Boolean,
        default: false,
        index: true
    },

    // Retention Policy
    retentionPolicy: {
        retainUntil: {
            type: Date,
            required: true,
            default: function() {
                return new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);
            }
        },
        canDelete: {
            type: Boolean,
            default: false
        },
        deletionScheduledAt: Date
    },

    // Version Control
    version: {
        type: Number,
        default: 1
    },

    previousVersions: [{
        versionNumber: Number,
        fileName: String,
        hash: String,
        replacedAt: Date,
        replacedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String
    }],

    // Status
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted', 'quarantined'],
        default: 'active',
        index: true
    },

    // Soft Delete
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },

    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deletionReason: String,

    // Upload Details
    uploadDetails: {
        ipAddress: String,
        userAgent: String,
        uploadSource: {
            type: String,
            enum: ['web', 'mobile', 'api', 'admin'],
            default: 'web'
        }
    },

    // Metadata
    metadata: {
        tags: [String],
        notes: String,
        customFields: mongoose.Schema.Types.Mixed
    },

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
documentSchema.index({ userId: 1, documentType: 1 });
documentSchema.index({ userId: 1, status: 1 });
documentSchema.index({ kycRequestId: 1, documentType: 1 });
documentSchema.index({ 'verification.status': 1, createdAt: -1 });
documentSchema.index({ 'encryption.isEncrypted': 1 });
documentSchema.index({ 'blockchain.isStoredOnChain': 1 });
documentSchema.index({ isDeleted: 1, status: 1 });
documentSchema.index({ createdAt: -1 });

// TTL Index: Auto-delete after retention period
documentSchema.index({ 'retentionPolicy.deletionScheduledAt': 1 }, { expireAfterSeconds: 0 });

// Virtual: File Size in MB
documentSchema.virtual('fileSizeMB').get(function() {
    return (this.file.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual: Days Until Expiry
documentSchema.virtual('daysUntilExpiry').get(function() {
    if (!this.expiryDate) return null;
    return Math.ceil((this.expiryDate - Date.now()) / (24 * 60 * 60 * 1000));
});

// Virtual: Is Accessible
documentSchema.virtual('isAccessible').get(function() {
    return this.status === 'active' && !this.isDeleted && !this.isExpired;
});

// Pre-save Middleware: Generate Document ID
documentSchema.pre('save', async function(next) {
    if (this.isNew && !this.documentId) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();

        this.documentId = `DOC${year}${month}${random}`;
    }
    next();
});

// Pre-save Middleware: Check Expiry
documentSchema.pre('save', function(next) {
    if (this.expiryDate && this.expiryDate < Date.now()) {
        this.isExpired = true;
        this.verification.status = 'expired';
    }
    next();
});

// Pre-save Middleware: Version Control
documentSchema.pre('save', function(next) {
    if (this.isModified('file.fileName') && !this.isNew) {
        this.previousVersions.push({
            versionNumber: this.version,
            fileName: this.file.fileName,
            hash: this.hash.value,
            replacedAt: new Date(),
            replacedBy: this.updatedBy
        });
        this.version += 1;
    }
    next();
});

// Static Method: Generate file hash
documentSchema.statics.generateHash = function(buffer, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(buffer).digest('hex');
};

// Static Method: Find expired documents
documentSchema.statics.findExpired = function() {
    return this.find({
        expiryDate: { $lt: new Date() },
        isExpired: false
    });
};

// Static Method: Find documents pending verification
documentSchema.statics.findPendingVerification = function(userId) {
    const query = { 'verification.status': 'pending', isDeleted: false };
    if (userId) query.userId = userId;
    return this.find(query).sort({ createdAt: 1 });
};

// Instance Method: Log access
documentSchema.methods.logAccess = function(userId, action, ipAddress, reason) {
    this.accessLog.push({
        accessedBy: userId,
        action,
        ipAddress,
        reason
    });
    return this.save();
};

// Instance Method: Soft delete
documentSchema.methods.softDelete = function(userId, reason) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    this.deletionReason = reason;
    this.status = 'deleted';
    return this.save();
};

// Instance Method: Check if user can access
documentSchema.methods.canAccess = function(userId, userRole) {
    if (this.userId.toString() === userId.toString()) return true;
    if (this.accessControl.isPublic) return true;
    if (this.accessControl.allowedRoles.includes(userRole)) return true;
    if (this.accessControl.allowedUsers.some(id => id.toString() === userId.toString())) {
        return true;
    }
    return false;
};

// Instance Method: Encrypt document metadata
documentSchema.methods.encryptMetadata = function(encryptionKey) {
    if (!this.encryption.isEncrypted) return;

    const iv = crypto.randomBytes(16);
    this.encryption.iv = iv.toString('hex');
    this.encryption.encryptedAt = new Date();
};

module.exports = mongoose.model('Document', documentSchema);
