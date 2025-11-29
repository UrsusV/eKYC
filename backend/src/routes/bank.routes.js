const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    getKycRequests,
    getKycRequestDetails,
    verifyKycRequest,
    issueCredential
} = require('../controllers/bankController');
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
 * Rate limiter for credential issuance
 * 10 requests per hour to prevent abuse
 */
const credentialIssuanceRateLimiter = conditionalMiddleware(rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        success: false,
        message: 'Too many credential issuance attempts. Please try again after an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false
}));

/**
 * General rate limiter for bank routes
 * 200 requests per 15 minutes per IP
 */
const bankRateLimiter = conditionalMiddleware(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
}));

// Apply rate limiter to all bank routes
router.use(bankRateLimiter);

// All routes require authentication and bank_officer role
router.use(authenticate);
router.use(authorize('bank_officer'));

/**
 * @route   GET /api/v1/bank/kyc-requests
 * @desc    Get KYC requests for bank officer's bank (with filtering and pagination)
 * @access  Private (Bank Officer only)
 */
router.get('/kyc-requests', getKycRequests);

/**
 * @route   GET /api/v1/bank/kyc-request/:id
 * @desc    Get detailed KYC request by ID
 * @access  Private (Bank Officer only)
 */
router.get('/kyc-request/:id', getKycRequestDetails);

/**
 * @route   POST /api/v1/bank/verify/:requestId
 * @desc    Approve or reject KYC request
 * @access  Private (Bank Officer only)
 */
router.post('/verify/:requestId', verifyKycRequest);

/**
 * @route   POST /api/v1/bank/issue-credential
 * @desc    Issue blockchain credential for approved KYC
 * @access  Private (Bank Officer only)
 */
router.post('/issue-credential', credentialIssuanceRateLimiter, issueCredential);

module.exports = router;
