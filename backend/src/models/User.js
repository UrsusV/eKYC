const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    // Basic Information
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 8,
        select: false
    },

    role: {
        type: String,
        enum: {
            values: ['customer', 'bank_officer', 'admin'],
            message: '{VALUE} is not a valid role'
        },
        default: 'customer',
        required: true,
        index: true
    },

    // Personal Information (Bangladesh-specific)
    personalInfo: {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true
        },
        fullNameBangla: {
            type: String,
            trim: true
        },
        fatherName: {
            type: String,
            required: [true, 'Father name is required'],
            trim: true
        },
        motherName: {
            type: String,
            required: [true, 'Mother name is required'],
            trim: true
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'Date of birth is required'],
            validate: {
                validator: function(value) {
                    const age = (Date.now() - value) / (365.25 * 24 * 60 * 60 * 1000);
                    return age >= 18;
                },
                message: 'Must be at least 18 years old'
            }
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true
        },
        nationality: {
            type: String,
            default: 'Bangladeshi',
            required: true
        },
        nid: {
            type: String,
            unique: true,
            sparse: true,
            match: [/^\d{10}$|^\d{13}$|^\d{17}$/, 'Invalid NID format']
        },
        passport: {
            type: String,
            unique: true,
            sparse: true,
            match: [/^[A-Z]{2}\d{7}$/, 'Invalid passport format']
        },
        birthCertificate: {
            type: String,
            unique: true,
            sparse: true,
            match: [/^\d{17}$/, 'Invalid birth certificate number']
        },
        taxIdentificationNumber: {
            type: String,
            unique: true,
            sparse: true,
            match: [/^\d{12}$/, 'TIN must be 12 digits']
        }
    },

    // Contact Information
    contactInfo: {
        primaryPhone: {
            type: String,
            required: [true, 'Phone number is required'],
            match: [/^(\+880|880|0)?1[3-9]\d{8}$/, 'Invalid Bangladesh phone number']
        },
        secondaryPhone: {
            type: String,
            match: [/^(\+880|880|0)?1[3-9]\d{8}$/, 'Invalid Bangladesh phone number']
        },
        presentAddress: {
            division: {
                type: String,
                enum: ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'],
                required: true
            },
            district: { type: String, required: true },
            upazila: { type: String, required: true },
            postCode: { type: String, match: [/^\d{4}$/, 'Post code must be 4 digits'] },
            addressLine: { type: String, required: true }
        },
        permanentAddress: {
            division: {
                type: String,
                enum: ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'],
                required: true
            },
            district: { type: String, required: true },
            upazila: { type: String, required: true },
            postCode: { type: String, match: [/^\d{4}$/, 'Post code must be 4 digits'] },
            addressLine: { type: String, required: true }
        },
        sameAsPresentAddress: {
            type: Boolean,
            default: false
        }
    },

    // Blockchain Integration
    walletAddress: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'],
        index: true
    },

    // Bank Officer Specific
    bankOfficerInfo: {
        employeeId: {
            type: String,
            unique: true,
            sparse: true
        },
        bankId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bank'
        },
        branchCode: String,
        designation: String,
        permissions: [{
            type: String,
            enum: ['view_kyc', 'approve_kyc', 'reject_kyc', 'request_documents', 'manage_customers']
        }]
    },

    // KYC Status
    kycStatus: {
        type: String,
        enum: ['not_started', 'pending', 'under_review', 'approved', 'rejected', 'expired'],
        default: 'not_started',
        index: true
    },

    kycLevel: {
        type: Number,
        enum: [0, 1, 2, 3],
        default: 0
    },

    kycCompletedAt: Date,
    kycExpiresAt: Date,

    // Account Status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    isEmailVerified: {
        type: Boolean,
        default: false
    },

    isPhoneVerified: {
        type: Boolean,
        default: false
    },

    // Security
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },

    twoFactorSecret: {
        type: String,
        select: false
    },

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Login Tracking
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,

    // Consent Management
    consentGiven: {
        dataProcessing: {
            granted: { type: Boolean, default: false },
            grantedAt: Date
        },
        dataSharing: {
            granted: { type: Boolean, default: false },
            grantedAt: Date
        },
        blockchainStorage: {
            granted: { type: Boolean, default: false },
            grantedAt: Date
        }
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

// Indexes for Performance
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ 'personalInfo.nid': 1 }, { sparse: true });
userSchema.index({ 'contactInfo.primaryPhone': 1 });
userSchema.index({ kycStatus: 1, role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'bankOfficerInfo.bankId': 1 }, { sparse: true });

// Virtual: Full Name
userSchema.virtual('fullName').get(function() {
    return this.personalInfo?.fullName || 'N/A';
});

// Virtual: Age
userSchema.virtual('age').get(function() {
    if (!this.personalInfo?.dateOfBirth) return null;
    const age = Math.floor((Date.now() - this.personalInfo.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
    return age;
});

// Virtual: Account Locked
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual: KYC Expired
userSchema.virtual('isKycExpired').get(function() {
    if (!this.kycExpiresAt) return false;
    return this.kycExpiresAt < Date.now();
});

// Pre-save Middleware: Hash Password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Pre-save Middleware: Update passwordChangedAt
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// Instance Method: Compare Password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance Method: Check if password changed after JWT issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Instance Method: Create Password Reset Token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Instance Method: Increment Login Attempts
userSchema.methods.incLoginAttempts = function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000;

    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + lockTime };
    }

    return this.updateOne(updates);
};

// Instance Method: Reset Login Attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

module.exports = mongoose.model('User', userSchema);
