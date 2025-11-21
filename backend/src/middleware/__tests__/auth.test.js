const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');
const {
    authenticate,
    authorize,
    optionalAuth,
    checkPermissions,
    requireEmailVerification,
    requireKycApproval
} = require('../auth');
const { connect, closeDatabase, clearDatabase } = require('../../models/__tests__/testSetup');

// Set JWT_SECRET for tests
process.env.JWT_SECRET = 'test-secret-key';

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

// Mock request and response objects
const mockRequest = (overrides = {}) => ({
    headers: {},
    user: null,
    ...overrides
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
        // Clear mock calls
        mockNext.mockClear();

        // Create a test user
        testUser = await User.create({
            email: 'test@example.com',
            password: 'Test@1234',
            role: 'customer',
            personalInfo: {
                fullName: 'Test User',
                fatherName: 'Test Father',
                motherName: 'Test Mother',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'male',
                nid: '1234567890'
            },
            contactInfo: {
                primaryPhone: '01712345678',
                presentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'Gulshan',
                    addressLine: 'Test Address'
                },
                permanentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'Gulshan',
                    addressLine: 'Test Address'
                }
            }
        });

        // Generate valid token
        validToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });
    });

    describe('authenticate', () => {
        it('should authenticate user with valid token', async () => {
            const req = mockRequest({
                headers: { authorization: `Bearer ${validToken}` }
            });
            const res = mockResponse();

            await authenticate(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user.email).toBe('test@example.com');
        });

        it('should reject request without token', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await authenticate(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('No token')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject request with invalid token', async () => {
            const req = mockRequest({
                headers: { authorization: 'Bearer invalid.token.here' }
            });
            const res = mockResponse();

            await authenticate(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Invalid token')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject request with expired token', async () => {
            const expiredToken = jwt.sign(
                { id: testUser._id },
                process.env.JWT_SECRET,
                { expiresIn: '0s' }
            );

            const req = mockRequest({
                headers: { authorization: `Bearer ${expiredToken}` }
            });
            const res = mockResponse();

            // Wait a bit to ensure token expires
            await new Promise(resolve => setTimeout(resolve, 100));

            await authenticate(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('expired')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject request for non-existent user', async () => {
            const fakeUserId = new mongoose.Types.ObjectId();
            const fakeToken = jwt.sign({ id: fakeUserId }, process.env.JWT_SECRET, {
                expiresIn: '1h'
            });

            const req = mockRequest({
                headers: { authorization: `Bearer ${fakeToken}` }
            });
            const res = mockResponse();

            await authenticate(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('no longer exists')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject request for inactive user', async () => {
            testUser.isActive = false;
            await testUser.save();

            const req = mockRequest({
                headers: { authorization: `Bearer ${validToken}` }
            });
            const res = mockResponse();

            await authenticate(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('deactivated')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject request for locked user', async () => {
            testUser.lockUntil = Date.now() + 10000; // Locked for 10 seconds
            await testUser.save();

            const req = mockRequest({
                headers: { authorization: `Bearer ${validToken}` }
            });
            const res = mockResponse();

            await authenticate(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('locked')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject if password changed after token issued', async () => {
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Change password
            testUser.password = 'NewPassword@123';
            await testUser.save();

            const req = mockRequest({
                headers: { authorization: `Bearer ${validToken}` }
            });
            const res = mockResponse();

            await authenticate(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('changed password')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('authorize', () => {
        it('should allow access for authorized role', async () => {
            const req = mockRequest({ user: testUser });
            const res = mockResponse();

            const middleware = authorize('customer', 'admin');
            middleware(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should deny access for unauthorized role', async () => {
            const req = mockRequest({ user: testUser });
            const res = mockResponse();

            const middleware = authorize('bank_officer', 'admin');
            middleware(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('not authorized')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should deny access if user not authenticated', async () => {
            const req = mockRequest();
            const res = mockResponse();

            const middleware = authorize('customer');
            middleware(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Not authenticated')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should work with single role', async () => {
            const req = mockRequest({ user: testUser });
            const res = mockResponse();

            const middleware = authorize('customer');
            middleware(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('optionalAuth', () => {
        it('should attach user if valid token provided', async () => {
            const req = mockRequest({
                headers: { authorization: `Bearer ${validToken}` }
            });
            const res = mockResponse();

            await optionalAuth(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user.email).toBe('test@example.com');
        });

        it('should continue without user if no token provided', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await optionalAuth(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(req.user).toBeNull();
        });

        it('should continue without user if invalid token provided', async () => {
            const req = mockRequest({
                headers: { authorization: 'Bearer invalid.token' }
            });
            const res = mockResponse();

            await optionalAuth(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(req.user).toBeNull();
        });

        it('should not attach inactive user', async () => {
            testUser.isActive = false;
            await testUser.save();

            const req = mockRequest({
                headers: { authorization: `Bearer ${validToken}` }
            });
            const res = mockResponse();

            await optionalAuth(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(req.user).toBeNull();
        });
    });

    describe('checkPermissions', () => {
        let bankOfficer;

        beforeEach(async () => {
            bankOfficer = await User.create({
                email: 'officer@bank.com',
                password: 'Test@1234',
                role: 'bank_officer',
                personalInfo: {
                    fullName: 'Bank Officer',
                    fatherName: 'Test Father',
                    motherName: 'Test Mother',
                    dateOfBirth: new Date('1990-01-01'),
                    gender: 'male'
                },
                contactInfo: {
                    primaryPhone: '01712345678',
                    presentAddress: {
                        division: 'Dhaka',
                        district: 'Dhaka',
                        upazila: 'Gulshan',
                        addressLine: 'Test Address'
                    },
                    permanentAddress: {
                        division: 'Dhaka',
                        district: 'Dhaka',
                        upazila: 'Gulshan',
                        addressLine: 'Test Address'
                    }
                },
                bankOfficerInfo: {
                    employeeId: 'OFF123',
                    permissions: ['view_kyc', 'approve_kyc']
                }
            });
        });

        it('should allow admin access regardless of permissions', async () => {
            const admin = await User.create({
                email: 'admin@system.com',
                password: 'Test@1234',
                role: 'admin',
                personalInfo: {
                    fullName: 'Admin User',
                    fatherName: 'Test Father',
                    motherName: 'Test Mother',
                    dateOfBirth: new Date('1990-01-01'),
                    gender: 'male'
                },
                contactInfo: {
                    primaryPhone: '01712345678',
                    presentAddress: {
                        division: 'Dhaka',
                        district: 'Dhaka',
                        upazila: 'Gulshan',
                        addressLine: 'Test Address'
                    },
                    permanentAddress: {
                        division: 'Dhaka',
                        district: 'Dhaka',
                        upazila: 'Gulshan',
                        addressLine: 'Test Address'
                    }
                }
            });

            const req = mockRequest({ user: admin });
            const res = mockResponse();

            const middleware = checkPermissions('view_kyc');
            middleware(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should allow bank officer with required permission', async () => {
            const req = mockRequest({ user: bankOfficer });
            const res = mockResponse();

            const middleware = checkPermissions('view_kyc');
            middleware(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should deny bank officer without required permission', async () => {
            const req = mockRequest({ user: bankOfficer });
            const res = mockResponse();

            const middleware = checkPermissions('manage_customers');
            middleware(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('do not have the required permissions')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should deny non-bank-officer users', async () => {
            const req = mockRequest({ user: testUser });
            const res = mockResponse();

            const middleware = checkPermissions('view_kyc');
            middleware(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('only accessible to bank officers')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should work with multiple permissions (OR logic)', async () => {
            const req = mockRequest({ user: bankOfficer });
            const res = mockResponse();

            const middleware = checkPermissions('view_kyc', 'reject_kyc', 'manage_customers');
            middleware(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should deny if user not authenticated', async () => {
            const req = mockRequest();
            const res = mockResponse();

            const middleware = checkPermissions('view_kyc');
            middleware(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requireEmailVerification', () => {
        it('should allow access for verified email', async () => {
            testUser.isEmailVerified = true;
            await testUser.save();

            const req = mockRequest({ user: testUser });
            const res = mockResponse();

            requireEmailVerification(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should deny access for unverified email', async () => {
            const req = mockRequest({ user: testUser });
            const res = mockResponse();

            requireEmailVerification(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('verify your email')
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should deny if user not authenticated', async () => {
            const req = mockRequest();
            const res = mockResponse();

            requireEmailVerification(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requireKycApproval', () => {
        it('should allow access for approved KYC', async () => {
            testUser.kycStatus = 'approved';
            await testUser.save();

            const req = mockRequest({ user: testUser });
            const res = mockResponse();

            requireKycApproval(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should deny access for pending KYC', async () => {
            testUser.kycStatus = 'pending';
            await testUser.save();

            const req = mockRequest({ user: testUser });
            const res = mockResponse();

            requireKycApproval(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('KYC verification required'),
                    kycStatus: 'pending'
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should deny access for rejected KYC', async () => {
            testUser.kycStatus = 'rejected';
            await testUser.save();

            const req = mockRequest({ user: testUser });
            const res = mockResponse();

            requireKycApproval(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should deny if user not authenticated', async () => {
            const req = mockRequest();
            const res = mockResponse();

            requireKycApproval(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});
