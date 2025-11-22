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

describe('KYC Controller Tests', () => {
    let customerToken;
    let customerId;
    let customerUser;
    let bankOfficerToken;
    let bankOfficerId;
    let bankId;
    let kycRequestId;

    beforeAll(async () => {
        // Connect to in-memory database
        await connect();
    });

    beforeEach(async () => {
        // Clear collections
        await clearDatabase();

        // Create a bank
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

        // Create customer user
        customerUser = await User.create({
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
                primaryPhone: '01700000001',
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
            }
        });
        customerId = customerUser._id;
        customerToken = jwt.sign({ id: customerId }, process.env.JWT_SECRET);

        // Create bank officer user
        const bankOfficer = await User.create({
            email: 'officer@test.com',
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
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('POST /api/v1/kyc/submit', () => {
        it('should create a new KYC request successfully', async () => {
            const res = await request(app)
                .post('/api/v1/kyc/submit')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    nid_number: '1234567890',
                    full_name: 'Test Customer',
                    date_of_birth: '1990-01-01',
                    address: 'Test Address, Dhaka'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('requestId');
            expect(res.body.data.status).toBe('submitted');
        });

        it('should fail when missing required fields', async () => {
            const res = await request(app)
                .post('/api/v1/kyc/submit')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    nid_number: '1234567890'
                    // Missing other required fields
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Validation error');
        });

        it('should fail when invalid NID format', async () => {
            const res = await request(app)
                .post('/api/v1/kyc/submit')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    nid_number: '123',
                    full_name: 'Test Customer',
                    date_of_birth: '1990-01-01',
                    address: 'Test Address'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should fail when user already has pending KYC', async () => {
            // Create first KYC request
            await KycRequest.create({
                userId: customerId,
                bankId: bankId,
                requestType: 'new',
                kycLevel: 1,
                status: 'pending'
            });

            const res = await request(app)
                .post('/api/v1/kyc/submit')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    nid_number: '1234567890',
                    full_name: 'Test Customer',
                    date_of_birth: '1990-01-01',
                    address: 'Test Address'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('pending');
        });

        it('should fail when not authenticated', async () => {
            const res = await request(app)
                .post('/api/v1/kyc/submit')
                .send({
                    nid_number: '1234567890',
                    full_name: 'Test Customer',
                    date_of_birth: '1990-01-01',
                    address: 'Test Address'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/kyc/status/:requestId', () => {
        beforeEach(async () => {
            // Create a KYC request
            const kycRequest = await KycRequest.create({
                userId: customerId,
                bankId: bankId,
                requestType: 'new',
                kycLevel: 1,
                status: 'pending'
            });
            kycRequestId = kycRequest._id;
        });

        it('should get KYC request status successfully', async () => {
            const res = await request(app)
                .get(`/api/v1/kyc/status/${kycRequestId}`)
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('status');
            expect(res.body.data._id.toString()).toBe(kycRequestId.toString());
        });

        it('should fail when accessing another user\'s KYC request', async () => {
            // Create another user
            const anotherUser = await User.create({
                email: 'another@test.com',
                password: 'Test1234',
                role: 'customer',
                personalInfo: {
                    fullName: 'Another User',
                    fatherName: 'Father',
                    motherName: 'Mother',
                    dateOfBirth: new Date('1990-01-01'),
                    gender: 'male',
                    nid: '9876543210'
                },
                contactInfo: {
                    primaryPhone: '01700000003',
                    presentAddress: {
                        division: 'Dhaka',
                        district: 'Dhaka',
                        upazila: 'Test',
                        addressLine: 'Test'
                    },
                    permanentAddress: {
                        division: 'Dhaka',
                        district: 'Dhaka',
                        upazila: 'Test',
                        addressLine: 'Test'
                    }
                }
            });
            const anotherToken = jwt.sign({ id: anotherUser._id }, process.env.JWT_SECRET);

            const res = await request(app)
                .get(`/api/v1/kyc/status/${kycRequestId}`)
                .set('Authorization', `Bearer ${anotherToken}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should fail when KYC request not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/v1/kyc/status/${fakeId}`)
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/kyc/history', () => {
        beforeEach(async () => {
            // Create multiple KYC requests
            await KycRequest.create([
                {
                    userId: customerId,
                    bankId: bankId,
                    requestType: 'new',
                    kycLevel: 1,
                    status: 'approved'
                },
                {
                    userId: customerId,
                    bankId: bankId,
                    requestType: 'update',
                    kycLevel: 2,
                    status: 'pending'
                },
                {
                    userId: customerId,
                    bankId: bankId,
                    requestType: 'renewal',
                    kycLevel: 2,
                    status: 'rejected'
                }
            ]);
        });

        it('should get user KYC history successfully', async () => {
            const res = await request(app)
                .get('/api/v1/kyc/history')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.requests).toHaveLength(3);
            expect(res.body.data.pagination).toBeDefined();
            expect(res.body.data.pagination.total).toBe(3);
        });

        it('should support pagination', async () => {
            const res = await request(app)
                .get('/api/v1/kyc/history?page=1&limit=2')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.requests.length).toBeLessThanOrEqual(2);
        });

        it('should return empty array when no KYC requests', async () => {
            await KycRequest.deleteMany({ userId: customerId });

            const res = await request(app)
                .get('/api/v1/kyc/history')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.requests).toHaveLength(0);
        });
    });

    describe('GET /api/v1/kyc/credentials', () => {
        beforeEach(async () => {
            // Create KYC requests with blockchain credentials
            await KycRequest.create([
                {
                    userId: customerId,
                    bankId: bankId,
                    requestType: 'new',
                    kycLevel: 1,
                    status: 'approved',
                    blockchain: {
                        credentialHash: '0x1234567890abcdef',
                        transactionHash: '0xabcdef1234567890',
                        issuedOnChain: true,
                        issuedAt: new Date()
                    }
                },
                {
                    userId: customerId,
                    bankId: bankId,
                    requestType: 'update',
                    kycLevel: 2,
                    status: 'approved',
                    blockchain: {
                        credentialHash: '0xfedcba0987654321',
                        transactionHash: '0x0987654321fedcba',
                        issuedOnChain: true,
                        issuedAt: new Date()
                    }
                }
            ]);
        });

        it('should get user blockchain credentials successfully', async () => {
            const res = await request(app)
                .get('/api/v1/kyc/credentials')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('should filter credentials by status', async () => {
            const res = await request(app)
                .get('/api/v1/kyc/credentials?status=active')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return empty array when no credentials found', async () => {
            await KycRequest.deleteMany({ userId: customerId });

            const res = await request(app)
                .get('/api/v1/kyc/credentials')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(0);
        });
    });
});
