/**
 * Integration Tests for eKYC API
 * Tests complete workflow from registration to credential issuance
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../../models/User');
const Bank = require('../../models/Bank');
const KYCRequest = require('../../models/KycRequest');
const Credential = require('../../models/Credential');
const Consent = require('../../models/Consent');

// MongoDB Memory Server
let mongoServer;

// Test data
let customerData = {
    name: 'John Doe',
    email: 'testcustomer@example.com',
    password: 'Customer@123',
    nid_number: '1234567890'
};

let bankOfficerData = {
    name: 'Jane Smith',
    email: 'testofficer@example.com',
    password: 'Officer@123',
    bank_id: '507f1f77bcf86cd799439011', // Default test bank ID
    officer_id: 'OFF123456'
};

// Store tokens and IDs
let customerToken;
let bankOfficerToken;
let kycRequestId;
let credentialId;

// Helper function to create a test bank
async function createTestBank() {
    const Bank = require('../../models/Bank');
    return await Bank.create({
        bankName: 'Test Bank Limited',
        bankNameBangla: 'টেস্ট ব্যাংক লিমিটেড',
        bankCode: 'TSTB',
        swiftCode: 'TSTBBD2D',
        routingNumber: '123456789',
        licenseNumber: 'BB-TEST-2025-001',
        licenseIssueDate: new Date('2020-01-01'),
        licenseExpiryDate: new Date('2030-12-31'),
        bankType: 'private_commercial',
        headOffice: {
            addressLine: '123 Test Street, Motijheel',
            division: 'Dhaka',
            district: 'Dhaka',
            postCode: '1000',
            phone: '+8801234567890',
            email: 'contact@testbank.bd'
        },
        isActive: true,
        status: 'active'
    });
}

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
    await Bank.deleteMany({});
    await KYCRequest.deleteMany({});
    await Credential.deleteMany({});
    await Consent.deleteMany({});
});

describe('Authentication API Integration Tests', () => {
    describe('POST /api/v1/auth/register/customer', () => {
        it('should register a new customer', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register/customer')
                .send(customerData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('id');
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
            // Create a test bank first
            const testBank = await createTestBank();

            const response = await request(app)
                .post('/api/v1/auth/register/bank-officer')
                .send({
                    ...bankOfficerData,
                    bank_id: testBank._id.toString()
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('id');
            expect(response.body.data.user.email).toBe(bankOfficerData.email);
            expect(response.body.data.user.role).toBe('bank_officer');
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
    let testBank;

    beforeEach(async () => {
        // Create a test bank
        testBank = await createTestBank();

        // Register and login customer
        const response = await request(app)
            .post('/api/v1/auth/register/customer')
            .send(customerData);
        customerToken = response.body.data.accessToken;
        customerId = response.body.data.user.id;
    });

    describe('POST /api/v1/kyc/submit', () => {
        const kycData = {
            nid_number: '1234567890',
            full_name: 'John Doe',
            date_of_birth: '1990-01-15',
            address: '123 Main Street, Dhaka-1215, Bangladesh',
            father_name: 'Robert Doe',
            mother_name: 'Mary Doe',
            phone: '01712345678'
        };

        it('should submit KYC request with valid data', async () => {
            const response = await request(app)
                .post('/api/v1/kyc/submit')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(kycData);

            // Log the error if not 201
            if (response.status !== 201) {
                console.log('KYC Submit Error:', JSON.stringify(response.body, null, 2));
            }

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.status).toBe('submitted');

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
                nid_number: '1234567890',
                full_name: 'John Doe',
                date_of_birth: '1990-01-15',
                address: '123 Main Street, Dhaka-1215, Bangladesh',
                father_name: 'Robert Doe',
                mother_name: 'Mary Doe',
                phone: '01712345678'
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
            expect(response.body.data.status).toBe('submitted');
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
    let testBank;

    beforeEach(async () => {
        // Create a test bank
        testBank = await createTestBank();

        // Register customer
        const customerResponse = await request(app)
            .post('/api/v1/auth/register/customer')
            .send(customerData);
        customerToken = customerResponse.body.data.accessToken;
        customerId = customerResponse.body.data.user.id;

        // Register bank officer
        const officerResponse = await request(app)
            .post('/api/v1/auth/register/bank-officer')
            .send({
                ...bankOfficerData,
                bank_id: testBank._id.toString()
            });
        bankOfficerToken = officerResponse.body.data.accessToken;
        bankOfficerId = officerResponse.body.data.user.id;

        // Submit KYC request
        const kycData = {
            nid_number: '1234567890',
            full_name: 'John Doe',
            date_of_birth: '1990-01-15',
            address: '123 Main Street, Dhaka-1215, Bangladesh',
            father_name: 'Robert Doe',
            mother_name: 'Mary Doe',
            phone: '01712345678'
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
                    approved: true,
                    comments: 'All documents verified and customer identity confirmed'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('approved');
            expect(response.body.data.workflow.approvedBy).toBe(bankOfficerId);
        });

        it('should reject KYC request', async () => {
            const response = await request(app)
                .post(`/api/v1/bank/verify/${kycRequestId}`)
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({
                    approved: false,
                    comments: 'Invalid documents provided',
                    rejectionCategory: 'invalid_documents'
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
                    approved: 'not_a_boolean',
                    comments: 'short'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});

describe('Consent API Integration Tests', () => {
    let customerId;
    let consentId;
    let testBank;

    beforeEach(async () => {
        // Create a test bank
        testBank = await createTestBank();

        // Register customer
        const customerResponse = await request(app)
            .post('/api/v1/auth/register/customer')
            .send(customerData);
        customerToken = customerResponse.body.data.accessToken;
        customerId = customerResponse.body.data.user.id;

        // Submit KYC request
        const kycData = {
            nid_number: '1234567890',
            full_name: 'John Doe',
            date_of_birth: '1990-01-15',
            address: '123 Main Street, Dhaka-1215, Bangladesh',
            father_name: 'Robert Doe',
            mother_name: 'Mary Doe',
            phone: '01712345678'
        };

        const kycResponse = await request(app)
            .post('/api/v1/kyc/submit')
            .set('Authorization', `Bearer ${customerToken}`)
            .send(kycData);
        kycRequestId = kycResponse.body.data._id;
    });

    describe('POST /api/v1/consent/create', () => {
        it('should create a new consent request', async () => {
            const consentData = {
                kycRequestId: kycRequestId,
                consentType: 'data_collection',
                purpose: 'To collect and verify personal information for KYC compliance',
                dataCategories: ['personal_info', 'contact_info', 'identification']
            };

            const response = await request(app)
                .post('/api/v1/consent/create')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(consentData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('consentId');
            expect(response.body.data.consentType).toBe(consentData.consentType);
            expect(response.body.data.status).toBe('pending');
            expect(response.body.data.purpose).toBe(consentData.purpose);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data).toHaveProperty('consentText');

            consentId = response.body.data._id;
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/v1/consent/create')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ consentType: 'data_collection' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should validate consent type', async () => {
            const response = await request(app)
                .post('/api/v1/consent/create')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    kycRequestId: kycRequestId,
                    consentType: 'invalid_type',
                    purpose: 'Test purpose'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should not create consent without authentication', async () => {
            await request(app)
                .post('/api/v1/consent/create')
                .send({
                    kycRequestId: kycRequestId,
                    consentType: 'data_collection',
                    purpose: 'Test purpose'
                })
                .expect(401);
        });
    });

    describe('POST /api/v1/consent/:consentId/grant', () => {
        beforeEach(async () => {
            const consentData = {
                kycRequestId: kycRequestId,
                consentType: 'data_processing',
                purpose: 'To process personal data for identity verification',
                dataCategories: ['personal_info']
            };

            const response = await request(app)
                .post('/api/v1/consent/create')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(consentData);

            if (response.status !== 201 || !response.body.data) {
                console.error('Consent creation failed:', JSON.stringify(response.body, null, 2));
                throw new Error('Failed to create consent in beforeEach');
            }
            consentId = response.body.data._id;
        });

        it('should grant consent', async () => {
            const response = await request(app)
                .post(`/api/v1/consent/${consentId}/grant`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ agreed: true })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('granted');
            expect(response.body.data).toHaveProperty('grantedAt');
            expect(response.body.data).toHaveProperty('expiresAt');
        });

        it('should not grant consent without agreement', async () => {
            const response = await request(app)
                .post(`/api/v1/consent/${consentId}/grant`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ agreed: false })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should not grant consent without authentication', async () => {
            await request(app)
                .post(`/api/v1/consent/${consentId}/grant`)
                .send({ agreed: true })
                .expect(401);
        });
    });

    describe('POST /api/v1/consent/:consentId/deny', () => {
        beforeEach(async () => {
            const consentData = {
                kycRequestId: kycRequestId,
                consentType: 'blockchain_storage',
                purpose: 'To store credentials on blockchain',
                dataCategories: ['identification']
            };

            const response = await request(app)
                .post('/api/v1/consent/create')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(consentData);

            if (response.status !== 201 || !response.body.data) {
                console.error('Consent creation failed:', JSON.stringify(response.body, null, 2));
                throw new Error('Failed to create consent in beforeEach');
            }
            consentId = response.body.data._id;
        });

        it('should deny consent', async () => {
            const response = await request(app)
                .post(`/api/v1/consent/${consentId}/deny`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ reason: 'I do not agree with blockchain storage' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('denied');
        });
    });

    describe('POST /api/v1/consent/:consentId/revoke', () => {
        beforeEach(async () => {
            const consentData = {
                kycRequestId: kycRequestId,
                consentType: 'data_sharing',
                purpose: 'To share data with third parties',
                dataCategories: ['personal_info'],
                // canBeWithdrawn removed (not part of validation schema)
            };

            const createResponse = await request(app)
                .post('/api/v1/consent/create')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(consentData);

            if (createResponse.status !== 201 || !createResponse.body.data) {
                console.error('Consent creation failed:', JSON.stringify(createResponse.body, null, 2));
                throw new Error('Failed to create consent in beforeEach');
            }
            consentId = createResponse.body.data._id;

            // Grant the consent first
            await request(app)
                .post(`/api/v1/consent/${consentId}/grant`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ agreed: true });
        });

        it('should revoke granted consent', async () => {
            const response = await request(app)
                .post(`/api/v1/consent/${consentId}/revoke`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ reason: 'I no longer wish to share my data' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('revoked');
            expect(response.body.data).toHaveProperty('revokedAt');
            expect(response.body.data.revocationReason).toBe('I no longer wish to share my data');
        });

        it('should validate revocation reason', async () => {
            const response = await request(app)
                .post(`/api/v1/consent/${consentId}/revoke`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/consent/my-consents', () => {
        beforeEach(async () => {
            // Create multiple consents
            const consentTypes = ['data_collection', 'data_processing', 'blockchain_storage'];

            for (const type of consentTypes) {
                const createRes = await request(app)
                    .post('/api/v1/consent/create')
                    .set('Authorization', `Bearer ${customerToken}`)
                    .send({
                        kycRequestId: kycRequestId,
                        consentType: type,
                        purpose: `Purpose for ${type} and KYC processing validation flow`,
                        dataCategories: ['personal_info']
                    });
                if (createRes.status !== 201) {
                    // Log error details to help debug
                    console.error('Consent create failed for type', type, JSON.stringify(createRes.body, null, 2));
                }
                expect(createRes.status).toBe(201);
            }
        });

        it('should get all user consents', async () => {
            const response = await request(app)
                .get('/api/v1/consent/my-consents')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.consents.length).toBe(3);
            expect(response.body.data.pagination).toHaveProperty('total');
            expect(response.body.data.pagination).toHaveProperty('page');
        });

        it('should filter consents by status', async () => {
            const response = await request(app)
                .get('/api/v1/consent/my-consents?status=pending')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.consents.forEach(consent => {
                expect(consent.status).toBe('pending');
            });
        });

        it('should filter consents by type', async () => {
            const response = await request(app)
                .get('/api/v1/consent/my-consents?consentType=data_collection')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.consents.forEach(consent => {
                expect(consent.consentType).toBe('data_collection');
            });
        });

        it('should not get consents without authentication', async () => {
            await request(app)
                .get('/api/v1/consent/my-consents')
                .expect(401);
        });
    });

    describe('GET /api/v1/consent/:consentId', () => {
        beforeEach(async () => {
            const consentData = {
                kycRequestId: kycRequestId,
                consentType: 'data_collection',
                purpose: 'Test consent',
                dataCategories: ['personal_info']
            };

            const response = await request(app)
                .post('/api/v1/consent/create')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(consentData);

            if (response.status !== 201 || !response.body.data) {
                console.error('Consent creation failed:', JSON.stringify(response.body, null, 2));
                throw new Error('Failed to create consent in beforeEach');
            }
            consentId = response.body.data._id;
        });

        it('should get consent details', async () => {
            const response = await request(app)
                .get(`/api/v1/consent/${consentId}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data._id.toString()).toBe(consentId);
            expect(response.body.data.consentType).toBe('data_collection');
        });

        it('should not get consent details without authentication', async () => {
            await request(app)
                .get(`/api/v1/consent/${consentId}`)
                .expect(401);
        });
    });

    describe('POST /api/v1/consent/bulk-grant', () => {
        let consentIds;

        beforeEach(async () => {
            const consentTypes = ['data_collection', 'data_processing'];
            consentIds = [];

            for (const type of consentTypes) {
                const response = await request(app)
                    .post('/api/v1/consent/create')
                    .set('Authorization', `Bearer ${customerToken}`)
                    .send({
                        kycRequestId: kycRequestId,
                        consentType: type,
                        purpose: `Purpose for ${type}`,
                        dataCategories: ['personal_info']
                    });

                if (response.status !== 201 || !response.body.data) {
                    console.error('Consent creation failed:', JSON.stringify(response.body, null, 2));
                    throw new Error('Failed to create consent in beforeEach');
                }
                consentIds.push(response.body.data._id);
            }
        });

        it('should grant multiple consents at once', async () => {
            const response = await request(app)
                .post('/api/v1/consent/bulk-grant')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    consentIds: consentIds,
                    agreed: true
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.grantedCount).toBe(2);
            expect(response.body.data.consents.length).toBe(2);
            response.body.data.consents.forEach(consent => {
                expect(consent.status).toBe('granted');
            });
        });

        it('should validate bulk grant agreement', async () => {
            const response = await request(app)
                .post('/api/v1/consent/bulk-grant')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    consentIds: consentIds,
                    agreed: false
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should validate consent IDs array', async () => {
            const response = await request(app)
                .post('/api/v1/consent/bulk-grant')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    consentIds: [],
                    agreed: true
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});

describe('Complete Workflow Integration Test', () => {
    it('should complete full KYC flow from registration to credential issuance', async () => {
        // 0. Create a test bank
        const testBank = await createTestBank();

        // 1. Register customer
        const customerResponse = await request(app)
            .post('/api/v1/auth/register/customer')
            .send(customerData)
            .expect(201);
        customerToken = customerResponse.body.data.accessToken;

        // 2. Submit KYC request
        const kycData = {
            nid_number: '9876543210',
            full_name: 'John Doe',
            date_of_birth: '1990-01-15',
            address: '123 Main Street, Dhaka-1215, Bangladesh',
            father_name: 'Robert Doe',
            mother_name: 'Mary Doe',
            phone: '01712345678'
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
            .send({
                ...bankOfficerData,
                bank_id: testBank._id.toString()
            })
            .expect(201);
        bankOfficerToken = officerResponse.body.data.accessToken;
        const bankOfficerId = officerResponse.body.data.user.id;

        // 4. Bank officer gets KYC requests
        const requestsResponse = await request(app)
            .get('/api/v1/bank/kyc-requests?status=all')
            .set('Authorization', `Bearer ${bankOfficerToken}`)
            .expect(200);
        expect(requestsResponse.body.data.requests.length).toBeGreaterThan(0);

        // 5. Bank officer approves KYC
        const verifyResponse = await request(app)
            .post(`/api/v1/bank/verify/${kycRequestId}`)
            .set('Authorization', `Bearer ${bankOfficerToken}`)
            .send({
                approved: true,
                comments: 'All documents verified successfully'
            })
            .expect(200);
        expect(verifyResponse.body.data.status).toBe('approved');
        expect(verifyResponse.body.data.workflow.approvedBy).toBe(bankOfficerId);

        // 6. Customer checks status
        const statusResponse = await request(app)
            .get(`/api/v1/kyc/status/${kycRequestId}`)
            .set('Authorization', `Bearer ${customerToken}`)
            .expect(200);
        expect(statusResponse.body.data.status).toBe('approved');
        expect(statusResponse.body.data.workflow.approvedAt).toBeTruthy();
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
