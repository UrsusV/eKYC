const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    registerCustomer,
    registerBankOfficer,
    login,
    refreshToken,
    getMe,
    logout,
    getBanks
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

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
 * Rate limiter for authentication routes
 * 30 requests per minute per IP (increased for development)
 */
const authRateLimiter = conditionalMiddleware(rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute (increased from 10)
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after a minute.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for successful requests (optional)
    skipSuccessfulRequests: false,
    // Skip rate limiting for failed requests (optional)
    skipFailedRequests: false
}));

/**
 * Stricter rate limiter for login attempts
 * 20 requests per 5 minutes per IP (increased for development)
 */
const loginRateLimiter = conditionalMiddleware(rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 requests per 5 minutes (increased from 5)
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 5 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false
}));

/**
 * @route   GET /api/v1/auth
 * @desc    Get authentication endpoints information
 * @access  Public
 */
router.get('/', (req, res) => {
    res.json({
        message: 'Authentication API',
        endpoints: {
            getBanks: 'GET /api/v1/auth/banks',
            registerCustomer: 'POST /api/v1/auth/register/customer',
            registerBankOfficer: 'POST /api/v1/auth/register/bank-officer',
            login: 'POST /api/v1/auth/login',
            refresh: 'POST /api/v1/auth/refresh',
            me: 'GET /api/v1/auth/me',
            logout: 'POST /api/v1/auth/logout'
        }
    });
});

/**
 * @route   GET /api/v1/auth/banks
 * @desc    Get list of active banks (for bank officer registration)
 * @access  Public
 */
router.get('/banks', getBanks);

/**
 * @route   POST /api/v1/auth/register/customer
 * @desc    Register a new customer
 * @access  Public
 */
router.post('/register/customer', authRateLimiter, registerCustomer);

/**
 * @route   POST /api/v1/auth/register/bank-officer
 * @desc    Register a new bank officer
 * @access  Public (Should be restricted in production)
 */
router.post('/register/bank-officer', authRateLimiter, registerBankOfficer);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user (customer, bank_officer, or admin)
 * @access  Public
 */
router.post('/login', loginRateLimiter, login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', authRateLimiter, refreshToken);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

module.exports = router;
