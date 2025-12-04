const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Bank = require('../models/Bank');
const { registerCustomerSchema, registerBankOfficerSchema, loginSchema } = require('../validators/authValidators');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '24h'
    });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });
};

/**
 * Send token response
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        success: true,
        message,
        data: {
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                personalInfo: {
                    fullName: user.personalInfo?.fullName || '',
                    firstName: user.personalInfo?.firstName,
                    lastName: user.personalInfo?.lastName,
                    dateOfBirth: user.personalInfo?.dateOfBirth,
                    gender: user.personalInfo?.gender,
                    nationality: user.personalInfo?.nationality,
                    nid: user.personalInfo?.nid,
                    passport: user.personalInfo?.passport
                },
                contactInfo: {
                    phoneNumber: user.contactInfo?.primaryPhone || '',
                    address: {
                        street: user.contactInfo?.presentAddress?.addressLine,
                        city: user.contactInfo?.presentAddress?.district,
                        state: user.contactInfo?.presentAddress?.division,
                        zipCode: user.contactInfo?.presentAddress?.postCode,
                        country: 'Bangladesh'
                    }
                },
                bankOfficerInfo: user.bankOfficerInfo,
                walletAddress: user.walletAddress,
                isActive: user.isActive !== undefined ? user.isActive : true,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            accessToken: token,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRE || '24h'
        }
    });
};

/**
 * @desc    Register a new customer
 * @route   POST /api/v1/auth/register/customer
 * @access  Public
 */
exports.registerCustomer = async (req, res) => {
    try {
        // Validate input
        const { error, value } = registerCustomerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        const { name, email, password, nid_number } = value;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { 'personalInfo.nid': nid_number }]
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
            if (existingUser.personalInfo?.nid === nid_number) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this NID number already exists'
                });
            }
        }

        // Create user
        const user = await User.create({
            email: email.toLowerCase(),
            password,
            role: 'customer',
            personalInfo: {
                fullName: name,
                nid: nid_number,
                // Default values for required fields
                fatherName: 'N/A',
                motherName: 'N/A',
                dateOfBirth: new Date('2000-01-01'),
                gender: 'other',
                nationality: 'Bangladeshi'
            },
            contactInfo: {
                primaryPhone: '01700000000', // Temporary
                presentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'N/A',
                    addressLine: 'N/A'
                },
                permanentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'N/A',
                    addressLine: 'N/A'
                }
            }
        });

        sendTokenResponse(user, 201, res, 'Customer registered successfully');
    } catch (error) {
        console.error('Register customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering customer',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Register a new bank officer
 * @route   POST /api/v1/auth/register/bank-officer
 * @access  Public (In production, this should be restricted)
 */
exports.registerBankOfficer = async (req, res) => {
    try {
        // Validate input
        const { error, value } = registerBankOfficerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        const { name, email, password, bank_id, officer_id } = value;

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Check if officer_id already exists
        const existingOfficer = await User.findOne({
            'bankOfficerInfo.employeeId': officer_id
        });
        if (existingOfficer) {
            return res.status(400).json({
                success: false,
                message: 'Officer ID already exists'
            });
        }

        // Verify bank exists
        const bank = await Bank.findById(bank_id);
        if (!bank) {
            return res.status(404).json({
                success: false,
                message: 'Bank not found'
            });
        }

        if (!bank.isActive) {
            return res.status(400).json({
                success: false,
                message: 'This bank is not active'
            });
        }

        // Create bank officer user
        const user = await User.create({
            email: email.toLowerCase(),
            password,
            role: 'bank_officer',
            personalInfo: {
                fullName: name,
                // Default values for required fields
                fatherName: 'N/A',
                motherName: 'N/A',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'other',
                nationality: 'Bangladeshi'
            },
            contactInfo: {
                primaryPhone: '01700000000', // Temporary
                presentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'N/A',
                    addressLine: 'N/A'
                },
                permanentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'N/A',
                    addressLine: 'N/A'
                }
            },
            bankOfficerInfo: {
                employeeId: officer_id,
                bankId: bank_id,
                designation: 'Officer',
                permissions: ['view_kyc', 'approve_kyc', 'reject_kyc', 'request_documents']
            },
            kycStatus: 'approved' // Bank officers are pre-approved
        });

        sendTokenResponse(user, 201, res, 'Bank officer registered successfully');
    } catch (error) {
        console.error('Register bank officer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering bank officer',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        // Validate input
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        const { email, password } = value;

        // Check if user exists and select password
        const user = await User.findOne({
            email: email.toLowerCase()
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            return res.status(401).json({
                success: false,
                message: `Account is locked due to too many failed login attempts. Please try again later.`,
                lockUntil: user.lockUntil
            });
        }

        // Check password
        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            // Increment login attempts
            await user.incLoginAttempts();

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0 || user.lockUntil) {
            await user.resetLoginAttempts();
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });

        sendTokenResponse(user, 200, res, 'Login successful');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

            // Check if user still exists
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User no longer exists'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account has been deactivated'
                });
            }

            // Generate new tokens
            const newAccessToken = generateToken(user._id);
            const newRefreshToken = generateRefreshToken(user._id);

            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                    expiresIn: process.env.JWT_EXPIRE || '24h'
                }
            });
        } catch (err) {
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token has expired. Please log in again.'
                });
            }
            throw err;
        }
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Error refreshing token',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get list of active banks (for bank officer registration)
 * @route   GET /api/v1/auth/banks
 * @access  Public
 */
exports.getBanks = async (req, res) => {
    try {
        const banks = await Bank.find({ isActive: true })
            .select('_id bankName bankCode bankType')
            .sort({ bankName: 1 });

        res.status(200).json({
            success: true,
            message: 'Banks retrieved successfully',
            data: banks.map(bank => ({
                id: bank._id,
                name: bank.bankName,
                code: bank.bankCode,
                type: bank.bankType
            }))
        });
    } catch (error) {
        console.error('Get banks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving banks',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
    try {
        // In a stateless JWT system, logout is handled client-side by removing the token
        // However, we can perform any cleanup needed here

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
