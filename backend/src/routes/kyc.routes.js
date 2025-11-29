const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    submitKycRequest,
    getKycStatus,
    getKycHistory,
    getCredentials
} = require('../controllers/kycController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * Utility to conditionally apply middleware
 * Skips rate limiting in test environment
 */
const conditionalMiddleware = (middleware) => {
    return process.env.NODE_ENV === 'test'
        ? (req, res, next) => next()
        : middleware;
};

/**
 * Rate limiter for KYC submission
 * 5 requests per hour per user to prevent abuse
 */
const kycSubmitRateLimiter = conditionalMiddleware(rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour
    message: {
        success: false,
        message: 'Too many KYC submission attempts. Please try again after an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
}));

/**
 * General rate limiter for KYC routes
 * 100 requests per 15 minutes per IP
 */
const kycRateLimiter = conditionalMiddleware(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
}));

// Apply rate limiter to all KYC routes
router.use(kycRateLimiter);

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/kyc/submit
 * @desc    Submit a new KYC request
 * @access  Private (Customer only)
 */
router.post(
    '/submit',
    authorize('customer'),
    kycSubmitRateLimiter,
    submitKycRequest
);

/**
 * @route   GET /api/v1/kyc/status/:requestId
 * @desc    Get KYC request status by ID
 * @access  Private (Request owner only)
 */
router.get(
    '/status/:requestId',
    getKycStatus
);

/**
 * @route   GET /api/v1/kyc/history
 * @desc    Get user's KYC history (paginated)
 * @access  Private (Customer only)
 */
router.get(
    '/history',
    authorize('customer'),
    getKycHistory
);

/**
 * @route   GET /api/v1/kyc/credentials
 * @desc    Get user's blockchain credentials
 * @access  Private (Customer only)
 */
router.get(
    '/credentials',
    authorize('customer'),
    getCredentials
);

module.exports = router;
