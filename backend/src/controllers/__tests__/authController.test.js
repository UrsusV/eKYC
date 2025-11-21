const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Bank = require('../../models/Bank');
const {
    registerCustomer,
    registerBankOfficer,
    login,
    refreshToken,
    getMe,
    logout
} = require('../authController');
const { connect, closeDatabase, clearDatabase } = require('../../models/__tests__/testSetup');

// Set JWT secrets for tests
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_EXPIRE = '1h';
process.env.JWT_REFRESH_EXPIRE = '7d';

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

// Mock request and response objects
const mockRequest = (body = {}, user = null) => ({
    body,
    user
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Auth Controller', () => {
    describe('registerCustomer', () => {
        const validCustomerData = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'SecurePass123',
            nid_number: '1234567890'
        };

        it('should register a new customer successfully', async () => {
            const req = mockRequest(validCustomerData);
            const res = mockResponse();

            await registerCustomer(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Customer registered successfully',
                    data: expect.objectContaining({
                        user: expect.objectContaining({
                            email: 'john@example.com',
                            role: 'customer'
                        }),
                        accessToken: expect.any(String),
                        refreshToken: expect.any(String)
                    })
                })
            );

            // Verify user was created in database
            const user = await User.findOne({ email: 'john@example.com' });
            expect(user).toBeDefined();
            expect(user.personalInfo.fullName).toBe('John Doe');
            expect(user.personalInfo.nid).toBe('1234567890');
        });

        it('should hash the password', async () => {
            const req = mockRequest(validCustomerData);
            const res = mockResponse();

            await registerCustomer(req, res);

            const user = await User.findOne({ email: 'john@example.com' }).select('+password');
            expect(user.password).not.toBe('SecurePass123');
            expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
        });

        it('should convert email to lowercase', async () => {
            const data = { ...validCustomerData, email: 'JOHN@EXAMPLE.COM' };
            const req = mockRequest(data);
            const res = mockResponse();

            await registerCustomer(req, res);

            const user = await User.findOne({ email: 'john@example.com' });
            expect(user).toBeDefined();
        });

        it('should reject duplicate email', async () => {
            // Create first user
            await User.create({
                email: 'john@example.com',
                password: 'Test@1234',
                role: 'customer',
                personalInfo: {
                    fullName: 'Existing User',
                    fatherName: 'Test Father',
                    motherName: 'Test Mother',
                    dateOfBirth: new Date('1990-01-01'),
                    gender: 'male',
                    nid: '9999999999'
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

            const req = mockRequest(validCustomerData);
            const res = mockResponse();

            await registerCustomer(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('email already exists')
                })
            );
        });

        it('should reject duplicate NID', async () => {
            // Create first user
            await User.create({
                email: 'existing@example.com',
                password: 'Test@1234',
                role: 'customer',
                personalInfo: {
                    fullName: 'Existing User',
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

            const req = mockRequest(validCustomerData);
            const res = mockResponse();

            await registerCustomer(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('NID number already exists')
                })
            );
        });

        it('should reject invalid data', async () => {
            const invalidData = {
                name: 'J', // Too short
                email: 'invalid-email',
                password: 'weak',
                nid_number: '123' // Too short
            };

            const req = mockRequest(invalidData);
            const res = mockResponse();

            await registerCustomer(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Validation error',
                    errors: expect.any(Array)
                })
            );
        });
    });

    describe('registerBankOfficer', () => {
        let testBank;

        beforeEach(async () => {
            // Create a test bank
            testBank = await Bank.create({
                bankName: 'Test Bank',
                bankCode: 'TSTB',
                routingNumber: '123456789',
                licenseNumber: 'LIC123',
                licenseIssueDate: new Date('2020-01-01'),
                licenseExpiryDate: new Date('2030-01-01'),
                bankType: 'private_commercial',
                headOffice: {
                    addressLine: '123 Test Street',
                    division: 'Dhaka',
                    district: 'Dhaka',
                    postCode: '1212',
                    phone: '01712345678',
                    email: 'info@testbank.com'
                }
            });
        });

        const validOfficerData = {
            name: 'Jane Smith',
            email: 'jane@bank.com',
            password: 'BankPass123',
            officer_id: 'OFF12345'
        };

        it('should register a new bank officer successfully', async () => {
            const data = { ...validOfficerData, bank_id: testBank._id.toString() };
            const req = mockRequest(data);
            const res = mockResponse();

            await registerBankOfficer(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Bank officer registered successfully',
                    data: expect.objectContaining({
                        user: expect.objectContaining({
                            email: 'jane@bank.com',
                            role: 'bank_officer'
                        }),
                        accessToken: expect.any(String),
                        refreshToken: expect.any(String)
                    })
                })
            );

            // Verify user was created in database
            const user = await User.findOne({ email: 'jane@bank.com' });
            expect(user).toBeDefined();
            expect(user.role).toBe('bank_officer');
            expect(user.bankOfficerInfo.employeeId).toBe('OFF12345');
            expect(user.bankOfficerInfo.bankId.toString()).toBe(testBank._id.toString());
            expect(user.kycStatus).toBe('approved'); // Bank officers are pre-approved
        });

        it('should assign default permissions', async () => {
            const data = { ...validOfficerData, bank_id: testBank._id.toString() };
            const req = mockRequest(data);
            const res = mockResponse();

            await registerBankOfficer(req, res);

            const user = await User.findOne({ email: 'jane@bank.com' });
            expect(user.bankOfficerInfo.permissions).toEqual(
                expect.arrayContaining(['view_kyc', 'approve_kyc', 'reject_kyc', 'request_documents'])
            );
        });

        it('should reject duplicate officer ID', async () => {
            // Create first officer
            await User.create({
                email: 'existing@bank.com',
                password: 'Test@1234',
                role: 'bank_officer',
                personalInfo: {
                    fullName: 'Existing Officer',
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
                    employeeId: 'OFF12345',
                    bankId: testBank._id
                }
            });

            const data = { ...validOfficerData, bank_id: testBank._id.toString() };
            const req = mockRequest(data);
            const res = mockResponse();

            await registerBankOfficer(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Officer ID already exists')
                })
            );
        });

        it('should reject invalid bank ID', async () => {
            const data = { ...validOfficerData, bank_id: new mongoose.Types.ObjectId().toString() };
            const req = mockRequest(data);
            const res = mockResponse();

            await registerBankOfficer(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Bank not found'
                })
            );
        });

        it('should reject inactive bank', async () => {
            testBank.isActive = false;
            await testBank.save();

            const data = { ...validOfficerData, bank_id: testBank._id.toString() };
            const req = mockRequest(data);
            const res = mockResponse();

            await registerBankOfficer(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('bank is not active')
                })
            );
        });
    });

    describe('login', () => {
        let testUser;

        beforeEach(async () => {
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
        });

        it('should login successfully with correct credentials', async () => {
            const req = mockRequest({
                email: 'test@example.com',
                password: 'Test@1234'
            });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Login successful',
                    data: expect.objectContaining({
                        user: expect.objectContaining({
                            email: 'test@example.com'
                        }),
                        accessToken: expect.any(String),
                        refreshToken: expect.any(String)
                    })
                })
            );
        });

        it('should update last login timestamp', async () => {
            const req = mockRequest({
                email: 'test@example.com',
                password: 'Test@1234'
            });
            const res = mockResponse();

            await login(req, res);

            const user = await User.findById(testUser._id);
            expect(user.lastLogin).toBeDefined();
        });

        it('should reset login attempts on successful login', async () => {
            // Set login attempts
            testUser.loginAttempts = 3;
            await testUser.save();

            const req = mockRequest({
                email: 'test@example.com',
                password: 'Test@1234'
            });
            const res = mockResponse();

            await login(req, res);

            const user = await User.findById(testUser._id);
            expect(user.loginAttempts).toBe(0);
        });

        it('should reject login with incorrect password', async () => {
            const req = mockRequest({
                email: 'test@example.com',
                password: 'WrongPassword123'
            });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Invalid email or password'
                })
            );
        });

        it('should increment login attempts on failed login', async () => {
            const req = mockRequest({
                email: 'test@example.com',
                password: 'WrongPassword123'
            });
            const res = mockResponse();

            await login(req, res);

            const user = await User.findById(testUser._id);
            expect(user.loginAttempts).toBe(1);
        });

        it('should reject login with non-existent email', async () => {
            const req = mockRequest({
                email: 'nonexistent@example.com',
                password: 'Test@1234'
            });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Invalid email or password'
                })
            );
        });

        it('should reject login for inactive user', async () => {
            testUser.isActive = false;
            await testUser.save();

            const req = mockRequest({
                email: 'test@example.com',
                password: 'Test@1234'
            });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('deactivated')
                })
            );
        });

        it('should reject login for locked user', async () => {
            testUser.lockUntil = Date.now() + 10000;
            await testUser.save();

            const req = mockRequest({
                email: 'test@example.com',
                password: 'Test@1234'
            });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('locked')
                })
            );
        });

        it('should be case-insensitive for email', async () => {
            const req = mockRequest({
                email: 'TEST@EXAMPLE.COM',
                password: 'Test@1234'
            });
            const res = mockResponse();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('refreshToken', () => {
        let testUser;
        let validRefreshToken;

        beforeEach(async () => {
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

            validRefreshToken = jwt.sign(
                { id: testUser._id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );
        });

        it('should generate new tokens with valid refresh token', async () => {
            const req = mockRequest({ refreshToken: validRefreshToken });
            const res = mockResponse();

            await refreshToken(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Token refreshed successfully',
                    data: expect.objectContaining({
                        accessToken: expect.any(String),
                        refreshToken: expect.any(String)
                    })
                })
            );
        });

        it('should reject missing refresh token', async () => {
            const req = mockRequest({});
            const res = mockResponse();

            await refreshToken(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Refresh token is required'
                })
            );
        });

        it('should reject invalid refresh token', async () => {
            const req = mockRequest({ refreshToken: 'invalid.token.here' });
            const res = mockResponse();

            await refreshToken(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Invalid refresh token')
                })
            );
        });

        it('should reject expired refresh token', async () => {
            const expiredToken = jwt.sign(
                { id: testUser._id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '0s' }
            );

            await new Promise(resolve => setTimeout(resolve, 100));

            const req = mockRequest({ refreshToken: expiredToken });
            const res = mockResponse();

            await refreshToken(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('expired')
                })
            );
        });

        it('should reject refresh token for non-existent user', async () => {
            const fakeUserId = new mongoose.Types.ObjectId();
            const fakeToken = jwt.sign(
                { id: fakeUserId },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            const req = mockRequest({ refreshToken: fakeToken });
            const res = mockResponse();

            await refreshToken(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('no longer exists')
                })
            );
        });

        it('should reject refresh token for inactive user', async () => {
            testUser.isActive = false;
            await testUser.save();

            const req = mockRequest({ refreshToken: validRefreshToken });
            const res = mockResponse();

            await refreshToken(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('deactivated')
                })
            );
        });
    });

    describe('getMe', () => {
        let testUser;

        beforeEach(async () => {
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
        });

        it('should return current user data', async () => {
            const req = mockRequest({}, { id: testUser._id });
            const res = mockResponse();

            await getMe(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        email: 'test@example.com',
                        role: 'customer'
                    })
                })
            );
        });
    });

    describe('logout', () => {
        it('should logout successfully', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await logout(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Logged out successfully'
                })
            );
        });
    });
});
