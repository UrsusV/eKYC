const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    registerCustomer,
    registerBankOfficer,
    login,
    refreshToken,
    getMe,
    logout
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Rate limiter for authentication routes
 * 10 requests per minute per IP
 */
const authRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
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
});

/**
 * Stricter rate limiter for login attempts
 * 5 requests per 5 minutes per IP
 */
const loginRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 requests per 5 minutes
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 5 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false
});

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
