const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Bank = require('../../models/Bank');
const KycRequest = require('../../models/KycRequest');
const jwt = require('jsonwebtoken');
const { connect, closeDatabase, clearDatabase } = require('../../models/__tests__/testSetup');

// Set JWT_SECRET for tests
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';

// Mock the blockchain service
jest.mock('../../services/blockchain', () => ({
    getCredentialService: jest.fn(() => ({
        isInitialized: false,
        initialize: jest.fn().mockResolvedValue(true),
        issueCredential: jest.fn((hash, holder, type) => Promise.resolve({
            success: true,
            transactionHash: '0xmockedtxhash123456789',
            credentialId: '0xmockedcredentialid123',
            blockNumber: 12345,
            gasUsed: '100000'
        })),
        shutdown: jest.fn().mockResolvedValue(true)
    }))
}));

describe('Bank Controller Tests', () => {
    let bankOfficerToken;
    let bankOfficerId;
    let bankId;
    let customerToken;
    let customerId;
    let kycRequestId;
    let anotherBankOfficerToken;
    let anotherBankId;

    beforeAll(async () => {
        await connect();
    });

    beforeEach(async () => {
        await clearDatabase();

        // Create first bank
        const bank = await Bank.create({
            bankName: 'Test Bank',
            bankCode: 'TBNK',
            swiftCode: 'TESTBD00',
            routingNumber: '123456789',
            licenseNumber: 'BB-LIC-001',
            licenseIssueDate: new Date('2020-01-01'),
            licenseExpiryDate: new Date('2030-01-01'),
            bankType: 'private_commercial',
            isActive: true,
            headOffice: {
                addressLine: 'Test Address Line 1',
                division: 'Dhaka',
                district: 'Dhaka',
                postCode: '1000',
                phone: '01700000000',
                email: 'test@testbank.com'
            }
        });
        bankId = bank._id;

        // Create second bank for cross-bank testing
        const anotherBank = await Bank.create({
            bankName: 'Another Bank',
            bankCode: 'ABNK',
            swiftCode: 'ANOTBD00',
            routingNumber: '987654321',
            licenseNumber: 'BB-LIC-002',
            licenseIssueDate: new Date('2020-01-01'),
            licenseExpiryDate: new Date('2030-01-01'),
            bankType: 'private_commercial',
            isActive: true,
            headOffice: {
                addressLine: 'Another Address',
                division: 'Dhaka',
                district: 'Dhaka',
                postCode: '1200',
                phone: '01700000001',
                email: 'test@anotherbank.com'
            }
        });
        anotherBankId = anotherBank._id;

        // Create bank officer for first bank
        const bankOfficer = await User.create({
            email: 'officer@testbank.com',
            password: 'Test1234',
            role: 'bank_officer',
            personalInfo: {
                fullName: 'Test Officer',
                fatherName: 'Father Name',
                motherName: 'Mother Name',
                dateOfBirth: new Date('1985-01-01'),
                gender: 'male'
            },
            contactInfo: {
                primaryPhone: '01700000002',
                presentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'Test',
                    addressLine: 'Test Address'
                },
                permanentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'Test',
                    addressLine: 'Test Address'
                }
            },
            bankOfficerInfo: {
                employeeId: 'OFF001',
                bankId: bankId,
                designation: 'Officer',
                permissions: ['view_kyc', 'approve_kyc', 'reject_kyc']
            }
        });
        bankOfficerId = bankOfficer._id;
        bankOfficerToken = jwt.sign({ id: bankOfficerId }, process.env.JWT_SECRET);

        // Create bank officer for second bank
        const anotherOfficer = await User.create({
            email: 'officer@anotherbank.com',
            password: 'Test1234',
            role: 'bank_officer',
            personalInfo: {
                fullName: 'Another Officer',
                fatherName: 'Father Name',
                motherName: 'Mother Name',
                dateOfBirth: new Date('1985-01-01'),
                gender: 'male'
            },
            contactInfo: {
                primaryPhone: '01700000003',
                presentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'Test',
                    addressLine: 'Test Address'
                },
                permanentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'Test',
                    addressLine: 'Test Address'
                }
            },
            bankOfficerInfo: {
                employeeId: 'OFF002',
                bankId: anotherBankId,
                designation: 'Officer',
                permissions: ['view_kyc', 'approve_kyc']
            }
        });
        anotherBankOfficerToken = jwt.sign({ id: anotherOfficer._id }, process.env.JWT_SECRET);

        // Create customer
        const customer = await User.create({
            email: 'customer@test.com',
            password: 'Test1234',
            role: 'customer',
            personalInfo: {
                fullName: 'Test Customer',
                fatherName: 'Father Name',
                motherName: 'Mother Name',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'male',
                nid: '1234567890'
            },
            contactInfo: {
                primaryPhone: '01700000004',
                presentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'Test',
                    addressLine: 'Test Address'
                },
                permanentAddress: {
                    division: 'Dhaka',
                    district: 'Dhaka',
                    upazila: 'Test',
                    addressLine: 'Test Address'
                }
            },
            walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
        });
        customerId = customer._id;
        customerToken = jwt.sign({ id: customerId }, process.env.JWT_SECRET);

        // Create KYC request (set to under_review so it can be approved/rejected)
        const kycRequest = await KycRequest.create({
            userId: customerId,
            bankId: bankId,
            requestType: 'new',
            kycLevel: 1,
            status: 'under_review',
            workflow: {
                reviewStartedAt: new Date(),
                assignedTo: bankOfficerId
            },
            submissionDetails: {
                nidData: {
                    nid_number: '1234567890',
                    full_name: 'Test Customer',
                    date_of_birth: '1990-01-01',
                    address: 'Test Address'
                }
            }
        });
        kycRequestId = kycRequest._id;
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('GET /api/v1/bank/kyc-requests', () => {
        it('should list KYC requests for officer\'s bank', async () => {
            const res = await request(app)
                .get('/api/v1/bank/kyc-requests')
                .set('Authorization', `Bearer ${bankOfficerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.requests).toBeInstanceOf(Array);
            expect(res.body.data.requests.length).toBeGreaterThan(0);
            expect(res.body.data.pagination).toBeDefined();
        });

        it('should filter KYC requests by status', async () => {
            const res = await request(app)
                .get('/api/v1/bank/kyc-requests?status=pending')
                .set('Authorization', `Bearer ${bankOfficerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.requests).toBeInstanceOf(Array);
            if (res.body.data.requests.length > 0) {
                expect(res.body.data.requests[0].status).toBe('pending');
            }
        });

        it('should support pagination', async () => {
            const res = await request(app)
                .get('/api/v1/bank/kyc-requests?page=1&limit=5')
                .set('Authorization', `Bearer ${bankOfficerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.pagination.page).toBe(1);
            expect(res.body.data.pagination.limit).toBe(5);
        });

        it('should only show requests from officer\'s bank', async () => {
            // Create request for another bank
            await KycRequest.create({
                userId: customerId,
                bankId: anotherBankId,
                requestType: 'new',
                kycLevel: 1,
                status: 'pending'
            });

            const res = await request(app)
                .get('/api/v1/bank/kyc-requests')
                .set('Authorization', `Bearer ${bankOfficerToken}`);

            expect(res.status).toBe(200);
            // Should only see requests from their bank
            const allFromOwnBank = res.body.data.requests.every(
                req => req.bankId === bankId.toString()
            );
            expect(allFromOwnBank).toBe(true);
        });

        it('should fail when not authenticated', async () => {
            const res = await request(app)
                .get('/api/v1/bank/kyc-requests');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should fail when user is not a bank officer', async () => {
            const res = await request(app)
                .get('/api/v1/bank/kyc-requests')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/bank/kyc-request/:id', () => {
        it('should get detailed KYC request', async () => {
            const res = await request(app)
                .get(`/api/v1/bank/kyc-request/${kycRequestId}`)
                .set('Authorization', `Bearer ${bankOfficerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('requestId');
            expect(res.body.data).toHaveProperty('userId');
            expect(res.body.data).toHaveProperty('status');
        });

        it('should fail when accessing request from another bank', async () => {
            const res = await request(app)
                .get(`/api/v1/bank/kyc-request/${kycRequestId}`)
                .set('Authorization', `Bearer ${anotherBankOfficerToken}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should fail when request not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/v1/bank/kyc-request/${fakeId}`)
                .set('Authorization', `Bearer ${bankOfficerToken}`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/bank/verify/:requestId', () => {
        it('should approve KYC request', async () => {
            const res = await request(app)
                .post(`/api/v1/bank/verify/${kycRequestId}`)
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({
                    approved: true,
                    comments: 'All documents verified successfully'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('approved');
            expect(res.body.data.workflow.approvedBy).toBeDefined();
        });

        it('should reject KYC request', async () => {
            const res = await request(app)
                .post(`/api/v1/bank/verify/${kycRequestId}`)
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({
                    approved: false,
                    comments: 'Documents are incomplete',
                    rejectionCategory: 'incomplete_documents'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('rejected');
        });

        it('should fail with missing comments', async () => {
            const res = await request(app)
                .post(`/api/v1/bank/verify/${kycRequestId}`)
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({
                    approved: true
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should fail when officer from another bank tries to verify', async () => {
            const res = await request(app)
                .post(`/api/v1/bank/verify/${kycRequestId}`)
                .set('Authorization', `Bearer ${anotherBankOfficerToken}`)
                .send({
                    approved: false,
                    comments: 'Cannot approve - not from my bank',
                    rejectionCategory: 'other'
                });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/bank/issue-credential', () => {
        beforeEach(async () => {
            // Approve the KYC request first
            await KycRequest.findByIdAndUpdate(kycRequestId, {
                status: 'approved',
                'workflow.approvedBy': bankOfficerId,
                'workflow.approvedAt': new Date()
            });
        });

        it('should issue blockchain credential successfully', async () => {
            const res = await request(app)
                .post('/api/v1/bank/issue-credential')
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({
                    requestId: kycRequestId.toString()
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('transactionHash');
            expect(res.body.data).toHaveProperty('credentialHash');
            expect(res.body.data.status).toBe('approved');
        }, 60000); // Increase timeout to 60 seconds for blockchain operations

        it('should fail when KYC request not approved', async () => {
            // Reset status to pending
            await KycRequest.findByIdAndUpdate(kycRequestId, {
                status: 'pending'
            });

            const res = await request(app)
                .post('/api/v1/bank/issue-credential')
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({
                    requestId: kycRequestId.toString()
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('approved');
        });

        it('should fail when user has no wallet address', async () => {
            // Remove wallet address
            await User.findByIdAndUpdate(customerId, {
                walletAddress: null
            });

            const res = await request(app)
                .post('/api/v1/bank/issue-credential')
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({
                    requestId: kycRequestId.toString()
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('wallet');
        });

        it('should fail when credential already issued', async () => {
            // Mark as already issued
            await KycRequest.findByIdAndUpdate(kycRequestId, {
                'blockchain.issuedOnChain': true,
                'blockchain.credentialHash': '0xalreadyissued'
            });

            const res = await request(app)
                .post('/api/v1/bank/issue-credential')
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({
                    requestId: kycRequestId.toString()
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('already');
        });

        it('should fail when missing requestId', async () => {
            const res = await request(app)
                .post('/api/v1/bank/issue-credential')
                .set('Authorization', `Bearer ${bankOfficerToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});
