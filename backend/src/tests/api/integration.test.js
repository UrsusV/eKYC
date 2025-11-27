/**
 * Integration Tests for eKYC API
 * Tests complete workflow from registration to credential issuance
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../../models/User');
const KYCRequest = require('../../models/KYCRequest');
const Credential = require('../../models/Credential');

// MongoDB Memory Server
let mongoServer;

// Test data
let customerData = {
    email: 'testcustomer@example.com',
    password: 'Customer@123',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890'
};

let bankOfficerData = {
    email: 'testofficer@example.com',
    password: 'Officer@123',
    firstName: 'Jane',
    lastName: 'Smith',
    phoneNumber: '+1234567891',
    bankName: 'Test Bank',
    officerIdNumber: 'OFF123456',
    branch: 'Main Branch'
};

// Store tokens and IDs
let customerToken;
let bankOfficerToken;
let kycRequestId;
let credentialId;

// Setup and teardown
beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    // Connect to in-memory database
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    // Cleanup
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
    await KYCRequest.deleteMany({});
    await Credential.deleteMany({});
});

describe('Authentication API Integration Tests', () => {
    describe('POST /api/v1/auth/register/customer', () => {
        it('should register a new customer', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register/customer')
                .send(customerData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('_id');
            expect(response.body.data.user.email).toBe(customerData.email);
            expect(response.body.data.user.role).toBe('customer');
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');

            customerToken = response.body.data.accessToken;
        });

        it('should not register customer with duplicate email', async () => {
            // First registration
            await request(app)
                .post('/api/v1/auth/register/customer')
                .send(customerData)
                .expect(201);

            // Second registration with same email
            const response = await request(app)
                .post('/api/v1/auth/register/customer')
                .send(customerData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register/customer')
                .send({ email: 'invalid@example.com' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/register/bank-officer', () => {
        it('should register a new bank officer', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register/bank-officer')
                .send(bankOfficerData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('_id');
            expect(response.body.data.user.email).toBe(bankOfficerData.email);
            expect(response.body.data.user.role).toBe('bank_officer');
            expect(response.body.data.user.bankName).toBe(bankOfficerData.bankName);
            expect(response.body.data).toHaveProperty('accessToken');

            bankOfficerToken = response.body.data.accessToken;
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            // Register a customer first
            await request(app)
                .post('/api/v1/auth/register/customer')
                .send(customerData);
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: customerData.email,
                    password: customerData.password
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.data.user.email).toBe(customerData.email);
        });

        it('should not login with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: customerData.email,
                    password: 'WrongPassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/auth/me', () => {
        beforeEach(async () => {
            const response = await request(app)
                .post('/api/v1/auth/register/customer')
                .send(customerData);
            customerToken = response.body.data.accessToken;
        });

        it('should get current user with valid token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(customerData.email);
        });

        it('should not get user without token', async () => {
            await request(app)
                .get('/api/v1/auth/me')
                .expect(401);
        });
    });
});

describe('KYC API Integration Tests', () => {
    let customerId;

    beforeEach(async () => {
        // Register and login customer
        const response = await request(app)
            .post('/api/v1/auth/register/customer')
            .send(customerData);
        customerToken = response.body.data.accessToken;
        customerId = response.body.data.user._id;
    });

    describe('POST /api/v1/kyc/submit', () => {
        const kycData = {
            documentType: 'passport',
            documentNumber: 'P123456789',
            fullName: 'John Doe',
            dateOfBirth: '1990-01-15',
            nationality: 'US',
            address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'USA'
            },
            documentFrontImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            documentBackImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            selfieImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        };

        it('should submit KYC request with valid data', async () => {
            const response = await request(app)
                .post('/api/v1/kyc/submit')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(kycData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.status).toBe('pending');
            expect(response.body.data.documentType).toBe(kycData.documentType);
            expect(response.body.data.userId).toBe(customerId);

            kycRequestId = response.body.data._id;
        });

        it('should not submit KYC without authentication', async () => {
            await request(app)
                .post('/api/v1/kyc/submit')
                .send(kycData)
                .expect(401);
        });

        it('should validate required KYC fields', async () => {
            const response = await request(app)
                .post('/api/v1/kyc/submit')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ documentType: 'passport' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/kyc/status/:requestId', () => {
        beforeEach(async () => {
            const kycData = {
                documentType: 'passport',
                documentNumber: 'P123456789',
                fullName: 'John Doe',
                dateOfBirth: '1990-01-15',
                nationality: 'US',
                address: {
                    street: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001',
                    country: 'USA'
                },
                documentFrontImage: 'data:image/png;base64,test',
                documentBackImage: 'data:image/png;base64,test',
                selfieImage: 'data:image/png;base64,test'
            };

            const response = await request(app)
                .post('/api/v1/kyc/submit')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(kycData);
            kycRequestId = response.body.data._id;
        });

        it('should get KYC status with valid request ID', async () => {
            const response = await request(app)
                .get(`/api/v1/kyc/status/${kycRequestId}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(kycRequestId);
            expect(response.body.data.status).toBe('pending');
        });
    });

    describe('GET /api/v1/kyc/history', () => {
        it('should get KYC history for authenticated customer', async () => {
            const response = await request(app)
                .get('/api/v1/kyc/history')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('requests');
            expect(response.body.data).toHaveProperty('pagination');
        });

        it('should not get history without authentication', async () => {
            await request(app)
                .get('/api/v1/kyc/history')
                .expect(401);
        });
    });
});

describe('Bank API Integration Tests', () => {
    let customerId;
    let bankOfficerId;

    beforeEach(async () => {
        // Register customer
        const customerResponse = await request(app)
            .post('/api/v1/auth/register/customer')
            .send(customerData);
        customerToken = customerResponse.body.data.accessToken;
        customerId = customerResponse.body.data.user._id;

        // Register bank officer
        const officerResponse = await request(app)
            .post('/api/v1/auth/register/bank-officer')
            .send(bankOfficerData);
        bankOfficerToken = officerResponse.body.data.accessToken;
        bankOfficerId = officerResponse.body.data.user._id;

        // Submit KYC request
        const kycData = {
            documentType: 'passport',
            documentNumber: 'P123456789',
            fullName: 'John Doe',
            dateOfBirth: '1990-01-15',
            nationality: 'US',
            address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'USA'
            },
            documentFrontImage: 'data:image/png;base64,test',
            documentBackImage: 'data:image/png;base64,test',
            selfieImage: 'data:image/png;base64,test'
        };

        const kycResponse = await request(app)
            .post('/api/v1/kyc/submit')
            .set('Authorization', `Bearer ${customerToken}`)
            .send(kycData);
        kycRequestId = kycResponse.body.data._id;
    });

    describe('GET /api/v1/bank/kyc-requests', () => {
        it('should get KYC requests for bank officer', async () => {
            const response = await request(app)
                .get('/api/v1/bank/kyc-requests')
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('requests');
            expect(response.body.data).toHaveProperty('pagination');
        });

        it('should filter KYC requests by status', async () => {
            const response = await request(app)
                .get('/api/v1/bank/kyc-requests?status=pending')
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not allow customer to access bank routes', async () => {
            await request(app)
                .get('/api/v1/bank/kyc-requests')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });
    });

    describe('GET /api/v1/bank/kyc-request/:id', () => {
        it('should get KYC request details', async () => {
            const response = await request(app)
                .get(`/api/v1/bank/kyc-request/${kycRequestId}`)
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(kycRequestId);
        });
    });

    describe('POST /api/v1/bank/verify/:requestId', () => {
        it('should approve KYC request', async () => {
            const response = await request(app)
                .post(`/api/v1/bank/verify/${kycRequestId}`)
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({
                    action: 'approve',
                    verificationNotes: 'All documents verified'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('approved');
            expect(response.body.data.verifiedBy).toBe(bankOfficerId);
        });

        it('should reject KYC request', async () => {
            const response = await request(app)
                .post(`/api/v1/bank/verify/${kycRequestId}`)
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({
                    action: 'reject',
                    verificationNotes: 'Invalid documents'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('rejected');
        });

        it('should validate verification action', async () => {
            const response = await request(app)
                .post(`/api/v1/bank/verify/${kycRequestId}`)
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({
                    action: 'invalid_action'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});

describe('Complete Workflow Integration Test', () => {
    it('should complete full KYC flow from registration to credential issuance', async () => {
        // 1. Register customer
        const customerResponse = await request(app)
            .post('/api/v1/auth/register/customer')
            .send(customerData)
            .expect(201);
        customerToken = customerResponse.body.data.accessToken;

        // 2. Submit KYC request
        const kycData = {
            documentType: 'passport',
            documentNumber: 'P987654321',
            fullName: 'John Doe',
            dateOfBirth: '1990-01-15',
            nationality: 'US',
            address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'USA'
            },
            documentFrontImage: 'data:image/png;base64,test',
            documentBackImage: 'data:image/png;base64,test',
            selfieImage: 'data:image/png;base64,test'
        };

        const kycResponse = await request(app)
            .post('/api/v1/kyc/submit')
            .set('Authorization', `Bearer ${customerToken}`)
            .send(kycData)
            .expect(201);
        kycRequestId = kycResponse.body.data._id;

        // 3. Register bank officer
        const officerResponse = await request(app)
            .post('/api/v1/auth/register/bank-officer')
            .send(bankOfficerData)
            .expect(201);
        bankOfficerToken = officerResponse.body.data.accessToken;

        // 4. Bank officer gets KYC requests
        const requestsResponse = await request(app)
            .get('/api/v1/bank/kyc-requests?status=pending')
            .set('Authorization', `Bearer ${bankOfficerToken}`)
            .expect(200);
        expect(requestsResponse.body.data.requests.length).toBeGreaterThan(0);

        // 5. Bank officer approves KYC
        const verifyResponse = await request(app)
            .post(`/api/v1/bank/verify/${kycRequestId}`)
            .set('Authorization', `Bearer ${bankOfficerToken}`)
            .send({
                action: 'approve',
                verificationNotes: 'All documents verified successfully'
            })
            .expect(200);
        expect(verifyResponse.body.data.status).toBe('approved');

        // 6. Customer checks status
        const statusResponse = await request(app)
            .get(`/api/v1/kyc/status/${kycRequestId}`)
            .set('Authorization', `Bearer ${customerToken}`)
            .expect(200);
        expect(statusResponse.body.data.status).toBe('approved');

        // Full workflow completed successfully
        expect(statusResponse.body.data.verifiedAt).toBeTruthy();
    });
});

describe('Health Check', () => {
    it('should return healthy status', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);

        expect(response.body.status).toBe('healthy');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('uptime');
    });
});
