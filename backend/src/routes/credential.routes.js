const express = require('express');
const {
    revokeCredential,
    getRevocationStatus,
    getCredentialDetails
} = require('../controllers/credentialController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/credentials/:credentialId/revoke
 * @desc    Revoke a credential (issuer only)
 * @access  Private (Bank Officer - Issuer only)
 */
router.post(
    '/:credentialId/revoke',
    authorize('bank_officer'),
    revokeCredential
);

/**
 * @route   GET /api/v1/credentials/:credentialId/revocation-status
 * @desc    Check revocation status of a credential from blockchain
 * @access  Private (Bank Officer with consent)
 */
router.get(
    '/:credentialId/revocation-status',
    authorize('bank_officer', 'admin'),
    getRevocationStatus
);

/**
 * @route   GET /api/v1/credentials/:credentialId
 * @desc    Get credential details
 * @access  Private (Owner or authorized officer)
 */
router.get(
    '/:credentialId',
    getCredentialDetails
);

module.exports = router;
