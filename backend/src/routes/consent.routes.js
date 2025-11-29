const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    createConsent,
    grantConsent,
    denyConsent,
    revokeConsent,
    getMyConsents,
    getConsentDetails,
    bulkGrantConsents
} = require('../controllers/consentController');
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
 * Rate limiter for consent operations
 */
const consentRateLimiter = conditionalMiddleware(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: 'Too many consent requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
}));

// Apply rate limiter to all consent routes
router.use(consentRateLimiter);

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/consent/create
 * @desc    Create a new consent request
 * @access  Private
 */
router.post('/create', createConsent);

/**
 * @route   POST /api/v1/consent/bulk-grant
 * @desc    Grant multiple consents at once (for KYC submission)
 * @access  Private
 */
router.post('/bulk-grant', bulkGrantConsents);

/**
 * @route   GET /api/v1/consent/my-consents
 * @desc    Get all consents for the current user
 * @access  Private
 */
router.get('/my-consents', getMyConsents);

/**
 * @route   GET /api/v1/consent/:consentId
 * @desc    Get details of a specific consent
 * @access  Private (Consent owner or bank officer)
 */
router.get('/:consentId', getConsentDetails);

/**
 * @route   POST /api/v1/consent/:consentId/grant
 * @desc    Grant a pending consent
 * @access  Private (Consent owner only)
 */
router.post('/:consentId/grant', grantConsent);

/**
 * @route   POST /api/v1/consent/:consentId/deny
 * @desc    Deny a pending consent (non-mandatory only)
 * @access  Private (Consent owner only)
 */
router.post('/:consentId/deny', denyConsent);

/**
 * @route   POST /api/v1/consent/:consentId/revoke
 * @desc    Revoke a granted consent
 * @access  Private (Consent owner only)
 */
router.post('/:consentId/revoke', revokeConsent);

module.exports = router;
