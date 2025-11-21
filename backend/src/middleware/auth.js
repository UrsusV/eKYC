const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route. No token provided.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if user still exists
            const user = await User.findById(decoded.id).select('+password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'The user belonging to this token no longer exists.'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Your account has been deactivated. Please contact support.'
                });
            }

            // Check if user is locked
            if (user.isLocked) {
                return res.status(401).json({
                    success: false,
                    message: 'Your account has been locked due to multiple failed login attempts. Please try again later.'
                });
            }

            // Check if user changed password after token was issued
            if (user.changedPasswordAfter(decoded.iat)) {
                return res.status(401).json({
                    success: false,
                    message: 'User recently changed password. Please log in again.'
                });
            }

            // Attach user to request object
            req.user = user;
            next();

        } catch (err) {
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please log in again.'
                });
            }
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Your token has expired. Please log in again.'
                });
            }
            throw err;
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Role-based access control middleware
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }

        next();
    };
};

/**
 * Optional authentication - attaches user if token is valid, but doesn't fail if missing
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (user && user.isActive && !user.isLocked) {
                req.user = user;
            }
        } catch (err) {
            // Invalid token, but we don't fail - just continue without user
        }

        next();
    } catch (error) {
        next();
    }
};

/**
 * Check specific permissions for bank officers
 * @param {...string} permissions - Required permissions
 */
const checkPermissions = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        // Admin has all permissions
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user is bank officer
        if (req.user.role !== 'bank_officer') {
            return res.status(403).json({
                success: false,
                message: 'This route is only accessible to bank officers'
            });
        }

        // Check if bank officer has required permissions
        const userPermissions = req.user.bankOfficerInfo?.permissions || [];
        const hasPermission = permissions.some(permission =>
            userPermissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have the required permissions to access this route',
                requiredPermissions: permissions,
                userPermissions
            });
        }

        next();
    };
};

/**
 * Verify email is verified
 */
const requireEmailVerification = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }

    if (!req.user.isEmailVerified) {
        return res.status(403).json({
            success: false,
            message: 'Please verify your email address to access this resource'
        });
    }

    next();
};

/**
 * Verify KYC is completed
 */
const requireKycApproval = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }

    if (req.user.kycStatus !== 'approved') {
        return res.status(403).json({
            success: false,
            message: 'KYC verification required to access this resource',
            kycStatus: req.user.kycStatus
        });
    }

    next();
};

module.exports = {
    authenticate,
    authorize,
    optionalAuth,
    checkPermissions,
    requireEmailVerification,
    requireKycApproval
};
