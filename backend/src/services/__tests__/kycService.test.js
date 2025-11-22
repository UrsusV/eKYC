const mongoose = require('mongoose');
const User = require('../../models/User');
const Bank = require('../../models/Bank');
const KycRequest = require('../../models/KycRequest');
const {
    createKYCRequest,
    updateKYCStatus,
    getKYCRequest,
    getUserKYCHistory,
    getPendingRequests,
    assignKYCRequest,
    verifyNIDFormat,
    validateStatusTransition,
    STATUS_TRANSITIONS
} = require('../kycService');
const { connect, closeDatabase, clearDatabase } = require('../../models/__tests__/testSetup');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('KYC Service', () => {
    let testUser;
    let testBank;
    let testOfficer;

    beforeEach(async () => {
        // Create test bank
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

        // Create test user (customer)
        testUser = await User.create({
            email: 'customer@example.com',
            password: 'Test@1234',
            role: 'customer',
            personalInfo: {
                fullName: 'Test Customer',
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

        // Create test bank officer
        testOfficer = await User.create({
            email: 'officer@bank.com',
            password: 'Test@1234',
            role: 'bank_officer',
            personalInfo: {
                fullName: 'Test Officer',
                fatherName: 'Test Father',
                motherName: 'Test Mother',
                dateOfBirth: new Date('1985-01-01'),
                gender: 'male'
            },
            contactInfo: {
                primaryPhone: '01712345679',
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
                bankId: testBank._id,
                permissions: ['view_kyc', 'approve_kyc', 'reject_kyc']
            }
        });
    });

    describe('verifyNIDFormat', () => {
        it('should validate 10-digit NID format', () => {
            const result = verifyNIDFormat('1234567890');
            expect(result.valid).toBe(true);
            expect(result.format).toBe('10-digit');
            expect(result.message).toContain('Valid 10-digit');
        });

        it('should validate 13-digit NID format', () => {
            const result = verifyNIDFormat('1234567890123');
            expect(result.valid).toBe(true);
            expect(result.format).toBe('13-digit');
        });

        it('should validate 17-digit Smart NID format', () => {
            const result = verifyNIDFormat('12345678901234567');
            expect(result.valid).toBe(true);
            expect(result.format).toBe('17-digit');
        });

        it('should reject invalid NID formats', () => {
            const invalidNIDs = ['123', '12345', '123456789012345', 'abcd123456', ''];

            invalidNIDs.forEach(nid => {
                const result = verifyNIDFormat(nid);
                expect(result.valid).toBe(false);
            });
        });

        it('should reject non-string input', () => {
            const result = verifyNIDFormat(123);
            expect(result.valid).toBe(false);
        });

        it('should reject null or undefined', () => {
            expect(verifyNIDFormat(null).valid).toBe(false);
            expect(verifyNIDFormat(undefined).valid).toBe(false);
        });

        it('should trim whitespace before validation', () => {
            const result = verifyNIDFormat('  1234567890  ');
            expect(result.valid).toBe(true);
        });
    });

    describe('validateStatusTransition', () => {
        it('should allow valid status transitions', () => {
            const validTransitions = [
                ['submitted', 'pending'],
                ['pending', 'under_review'],
                ['under_review', 'approved'],
                ['under_review', 'rejected'],
                ['approved', 'issued']
            ];

            validTransitions.forEach(([from, to]) => {
                const result = validateStatusTransition(from, to);
                expect(result.valid).toBe(true);
            });
        });

        it('should reject invalid status transitions', () => {
            const invalidTransitions = [
                ['approved', 'pending'],
                ['rejected', 'approved'],
                ['issued', 'pending']
            ];

            invalidTransitions.forEach(([from, to]) => {
                const result = validateStatusTransition(from, to);
                expect(result.valid).toBe(false);
                expect(result.message).toContain('Cannot transition');
            });
        });

        it('should reject invalid current status', () => {
            const result = validateStatusTransition('invalid_status', 'pending');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('Invalid current status');
        });
    });

    describe('createKYCRequest', () => {
        const validNIDData = {
            nid_number: '1234567890',
            full_name: 'Test Customer',
            date_of_birth: '1990-01-01',
            address: '123 Test Street, Dhaka'
        };

        it('should create a KYC request successfully', async () => {
            const result = await createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: validNIDData,
                requestType: 'new',
                kycLevel: 1
            });

            expect(result.success).toBe(true);
            expect(result.message).toContain('created successfully');
            expect(result.data).toBeDefined();
            expect(result.data.userId.toString()).toBe(testUser._id.toString());
            expect(result.data.bankId.toString()).toBe(testBank._id.toString());
            expect(result.data.status).toBe('submitted');
            expect(result.data.requestId).toBeDefined();
        });

        it('should update user KYC status to pending', async () => {
            await createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: validNIDData
            });

            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.kycStatus).toBe('pending');
        });

        it('should update user NID if not set', async () => {
            await createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: validNIDData
            });

            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.personalInfo.nid).toBe('1234567890');
        });

        it('should reject if user ID is missing', async () => {
            await expect(createKYCRequest({
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: validNIDData
            })).rejects.toThrow('User ID is required');
        });

        it('should reject if bank ID is missing', async () => {
            await expect(createKYCRequest({
                userId: testUser._id,
                nidNumber: '1234567890',
                nidData: validNIDData
            })).rejects.toThrow('Bank ID is required');
        });

        it('should reject if NID number is missing', async () => {
            await expect(createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidData: validNIDData
            })).rejects.toThrow('NID number is required');
        });

        it('should reject invalid NID format', async () => {
            await expect(createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '123',
                nidData: validNIDData
            })).rejects.toThrow('Invalid NID format');
        });

        it('should reject if user does not exist', async () => {
            const fakeUserId = new mongoose.Types.ObjectId();

            await expect(createKYCRequest({
                userId: fakeUserId,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: validNIDData
            })).rejects.toThrow('User not found');
        });

        it('should reject if bank does not exist', async () => {
            const fakeBankId = new mongoose.Types.ObjectId();

            await expect(createKYCRequest({
                userId: testUser._id,
                bankId: fakeBankId,
                nidNumber: '1234567890',
                nidData: validNIDData
            })).rejects.toThrow('Bank not found');
        });

        it('should reject if bank is not active', async () => {
            testBank.isActive = false;
            await testBank.save();

            await expect(createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: validNIDData
            })).rejects.toThrow('Bank is not active');
        });

        it('should reject if user has existing pending request', async () => {
            // Create first request
            await createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: validNIDData
            });

            // Try to create second request
            await expect(createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: validNIDData
            })).rejects.toThrow('already has a pending KYC request');
        });

        it('should reject if NID data is missing required fields', async () => {
            const incompleteNIDData = {
                nid_number: '1234567890',
                full_name: 'Test Customer'
                // Missing date_of_birth and address
            };

            await expect(createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: incompleteNIDData
            })).rejects.toThrow('Missing required NID fields');
        });

        it('should set verification checks appropriately', async () => {
            const result = await createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: validNIDData
            });

            expect(result.data.verificationChecks.nidVerification.status).toBe('pending');
            expect(result.data.verificationChecks.phoneVerification.status).toBe('pending');
        });
    });

    describe('updateKYCStatus', () => {
        let kycRequest;

        beforeEach(async () => {
            const result = await createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: {
                    nid_number: '1234567890',
                    full_name: 'Test Customer',
                    date_of_birth: '1990-01-01',
                    address: '123 Test Street'
                }
            });
            kycRequest = result.data;
        });

        it('should update status successfully', async () => {
            const result = await updateKYCStatus(
                kycRequest._id,
                'pending',
                testOfficer._id,
                { remarks: 'Moving to pending' }
            );

            expect(result.success).toBe(true);
            expect(result.data.status).toBe('pending');
        });

        it('should add entry to status history', async () => {
            await updateKYCStatus(
                kycRequest._id,
                'pending',
                testOfficer._id,
                { remarks: 'Test remark' }
            );

            const updated = await KycRequest.findById(kycRequest._id);
            const lastHistory = updated.statusHistory[updated.statusHistory.length - 1];

            expect(lastHistory.status).toBe('pending');
            expect(lastHistory.changedBy.toString()).toBe(testOfficer._id.toString());
            // Remarks added via internal notes, status history is auto-generated by pre-save hook
        });

        it('should update workflow timestamps for under_review', async () => {
            await updateKYCStatus(kycRequest._id, 'pending', testOfficer._id);
            const result = await updateKYCStatus(kycRequest._id, 'under_review', testOfficer._id);

            expect(result.data.workflow.reviewStartedAt).toBeDefined();
            expect(result.data.workflow.reviewedBy.toString()).toBe(testOfficer._id.toString());
        });

        it('should update workflow and user status for approved', async () => {
            await updateKYCStatus(kycRequest._id, 'pending', testOfficer._id);
            await updateKYCStatus(kycRequest._id, 'under_review', testOfficer._id);
            const result = await updateKYCStatus(kycRequest._id, 'approved', testOfficer._id);

            expect(result.data.workflow.approvedAt).toBeDefined();
            expect(result.data.workflow.approvedBy.toString()).toBe(testOfficer._id.toString());

            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.kycStatus).toBe('approved');
            expect(updatedUser.kycCompletedAt).toBeDefined();
            expect(updatedUser.kycExpiresAt).toBeDefined();
        });

        it('should handle rejection with details', async () => {
            await updateKYCStatus(kycRequest._id, 'pending', testOfficer._id);
            await updateKYCStatus(kycRequest._id, 'under_review', testOfficer._id);

            const result = await updateKYCStatus(
                kycRequest._id,
                'rejected',
                testOfficer._id,
                {
                    remarks: 'Documents invalid',
                    rejectionCategory: 'invalid_documents',
                    rejectionDetails: 'NID photo is unclear'
                }
            );

            expect(result.data.rejectionReason.category).toBe('invalid_documents');
            expect(result.data.rejectionReason.details).toBe('NID photo is unclear');

            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.kycStatus).toBe('rejected');
        });

        it('should reject invalid status transitions', async () => {
            await expect(updateKYCStatus(
                kycRequest._id,
                'approved',
                testOfficer._id
            )).rejects.toThrow('Cannot transition');
        });

        it('should reject if request not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            await expect(updateKYCStatus(
                fakeId,
                'pending',
                testOfficer._id
            )).rejects.toThrow('KYC request not found');
        });

        it('should reject if reviewer not found', async () => {
            const fakeReviewerId = new mongoose.Types.ObjectId();

            await expect(updateKYCStatus(
                kycRequest._id,
                'pending',
                fakeReviewerId
            )).rejects.toThrow('Reviewer not found');
        });

        it('should reject if reviewer is not bank officer or admin', async () => {
            await expect(updateKYCStatus(
                kycRequest._id,
                'pending',
                testUser._id
            )).rejects.toThrow('Only bank officers and admins');
        });

        it('should reject if bank officer not from same bank', async () => {
            // Create another bank
            const otherBank = await Bank.create({
                bankName: 'Other Bank',
                bankCode: 'OTHR',
                routingNumber: '987654321',
                licenseNumber: 'LIC456',
                licenseIssueDate: new Date('2020-01-01'),
                licenseExpiryDate: new Date('2030-01-01'),
                bankType: 'private_commercial',
                headOffice: {
                    addressLine: '456 Other Street',
                    division: 'Dhaka',
                    district: 'Dhaka',
                    postCode: '1213',
                    phone: '01712345680',
                    email: 'info@otherbank.com'
                }
            });

            // Create officer from other bank
            const otherOfficer = await User.create({
                email: 'other@bank.com',
                password: 'Test@1234',
                role: 'bank_officer',
                personalInfo: {
                    fullName: 'Other Officer',
                    fatherName: 'Test Father',
                    motherName: 'Test Mother',
                    dateOfBirth: new Date('1985-01-01'),
                    gender: 'male'
                },
                contactInfo: {
                    primaryPhone: '01712345681',
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
                    employeeId: 'OFF456',
                    bankId: otherBank._id
                }
            });

            await expect(updateKYCStatus(
                kycRequest._id,
                'pending',
                otherOfficer._id
            )).rejects.toThrow('can only review requests for their own bank');
        });

        it('should handle additional_info_required status', async () => {
            await updateKYCStatus(kycRequest._id, 'pending', testOfficer._id);
            await updateKYCStatus(kycRequest._id, 'under_review', testOfficer._id);

            const result = await updateKYCStatus(
                kycRequest._id,
                'additional_info_required',
                testOfficer._id,
                {
                    requiredFields: [
                        { field: 'address_proof', reason: 'Current address proof is outdated' },
                        { field: 'income_proof', reason: 'Income verification needed' }
                    ]
                }
            );

            expect(result.data.additionalInfoRequired).toHaveLength(2);
            expect(result.data.additionalInfoRequired[0].field).toBe('address_proof');
        });
    });

    describe('getKYCRequest', () => {
        let kycRequest;

        beforeEach(async () => {
            const result = await createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: {
                    nid_number: '1234567890',
                    full_name: 'Test Customer',
                    date_of_birth: '1990-01-01',
                    address: '123 Test Street'
                }
            });
            kycRequest = result.data;
        });

        it('should retrieve KYC request successfully', async () => {
            const result = await getKYCRequest(kycRequest._id, testUser._id);

            expect(result.success).toBe(true);
            expect(result.data._id.toString()).toBe(kycRequest._id.toString());
        });

        it('should populate user and bank information', async () => {
            const result = await getKYCRequest(kycRequest._id, testUser._id);

            expect(result.data.userId.email).toBeDefined();
            expect(result.data.bankId.bankName).toBeDefined();
        });

        it('should allow customer to view own request', async () => {
            const result = await getKYCRequest(kycRequest._id, testUser._id);
            expect(result.success).toBe(true);
        });

        it('should allow bank officer to view request from their bank', async () => {
            const result = await getKYCRequest(kycRequest._id, testOfficer._id);
            expect(result.success).toBe(true);
        });

        it('should reject customer viewing another user request', async () => {
            const otherUser = await User.create({
                email: 'other@example.com',
                password: 'Test@1234',
                role: 'customer',
                personalInfo: {
                    fullName: 'Other User',
                    fatherName: 'Test Father',
                    motherName: 'Test Mother',
                    dateOfBirth: new Date('1990-01-01'),
                    gender: 'male'
                },
                contactInfo: {
                    primaryPhone: '01712345682',
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

            await expect(getKYCRequest(
                kycRequest._id,
                otherUser._id
            )).rejects.toThrow('Unauthorized');
        });

        it('should reject if request not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await expect(getKYCRequest(fakeId, testUser._id)).rejects.toThrow('not found');
        });
    });

    describe('getUserKYCHistory', () => {
        it('should return user KYC history', async () => {
            // Create multiple KYC requests
            await createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: {
                    nid_number: '1234567890',
                    full_name: 'Test Customer',
                    date_of_birth: '1990-01-01',
                    address: '123 Test Street'
                }
            });

            const result = await getUserKYCHistory(testUser._id);

            expect(result.success).toBe(true);
            expect(result.data.requests).toHaveLength(1);
            expect(result.data.pagination.total).toBe(1);
        });

        it('should support pagination', async () => {
            const result = await getUserKYCHistory(testUser._id, { limit: 5, skip: 0 });

            expect(result.data.pagination.limit).toBe(5);
            expect(result.data.pagination.skip).toBe(0);
        });

        it('should filter by status', async () => {
            await createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: {
                    nid_number: '1234567890',
                    full_name: 'Test Customer',
                    date_of_birth: '1990-01-01',
                    address: '123 Test Street'
                }
            });

            const result = await getUserKYCHistory(testUser._id, { status: 'submitted' });

            expect(result.success).toBe(true);
            result.data.requests.forEach(req => {
                expect(req.status).toBe('submitted');
            });
        });

        it('should reject if user not found', async () => {
            const fakeUserId = new mongoose.Types.ObjectId();
            await expect(getUserKYCHistory(fakeUserId)).rejects.toThrow('User not found');
        });
    });

    describe('getPendingRequests', () => {
        it('should return pending requests for a bank', async () => {
            const createResult = await createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: {
                    nid_number: '1234567890',
                    full_name: 'Test Customer',
                    date_of_birth: '1990-01-01',
                    address: '123 Test Street'
                }
            });

            // Move to pending status
            await updateKYCStatus(createResult.data._id, 'pending', testOfficer._id);

            const result = await getPendingRequests(testBank._id);

            expect(result.success).toBe(true);
            expect(result.data.requests.length).toBeGreaterThan(0);
        });

        it('should only return requests for specified bank', async () => {
            const result = await getPendingRequests(testBank._id);

            result.data.requests.forEach(req => {
                expect(req.bankId.toString()).toBe(testBank._id.toString());
            });
        });

        it('should reject if bank ID not provided', async () => {
            await expect(getPendingRequests(null)).rejects.toThrow('Bank ID is required');
        });
    });

    describe('assignKYCRequest', () => {
        let kycRequest;

        beforeEach(async () => {
            const result = await createKYCRequest({
                userId: testUser._id,
                bankId: testBank._id,
                nidNumber: '1234567890',
                nidData: {
                    nid_number: '1234567890',
                    full_name: 'Test Customer',
                    date_of_birth: '1990-01-01',
                    address: '123 Test Street'
                }
            });
            kycRequest = result.data;
        });

        it('should assign request to officer', async () => {
            const result = await assignKYCRequest(
                kycRequest._id,
                testOfficer._id,
                testOfficer._id
            );

            expect(result.success).toBe(true);
            expect(result.data.workflow.assignedTo.toString()).toBe(testOfficer._id.toString());
        });

        it('should add note about assignment', async () => {
            await assignKYCRequest(kycRequest._id, testOfficer._id, testOfficer._id);

            const updated = await KycRequest.findById(kycRequest._id);
            const lastNote = updated.internalNotes[updated.internalNotes.length - 1];

            expect(lastNote.note).toContain('assigned to');
        });

        it('should reject if request not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await expect(assignKYCRequest(
                fakeId,
                testOfficer._id,
                testOfficer._id
            )).rejects.toThrow('not found');
        });

        it('should reject if officer not found or invalid role', async () => {
            await expect(assignKYCRequest(
                kycRequest._id,
                testUser._id,
                testOfficer._id
            )).rejects.toThrow('Officer not found or invalid role');
        });

        it('should reject if officer not from same bank', async () => {
            const otherBank = await Bank.create({
                bankName: 'Other Bank',
                bankCode: 'OTHR',
                routingNumber: '987654321',
                licenseNumber: 'LIC456',
                licenseIssueDate: new Date('2020-01-01'),
                licenseExpiryDate: new Date('2030-01-01'),
                bankType: 'private_commercial',
                headOffice: {
                    addressLine: '456 Other Street',
                    division: 'Dhaka',
                    district: 'Dhaka',
                    postCode: '1213',
                    phone: '01712345680',
                    email: 'info@otherbank.com'
                }
            });

            const otherOfficer = await User.create({
                email: 'other@bank.com',
                password: 'Test@1234',
                role: 'bank_officer',
                personalInfo: {
                    fullName: 'Other Officer',
                    fatherName: 'Test Father',
                    motherName: 'Test Mother',
                    dateOfBirth: new Date('1985-01-01'),
                    gender: 'male'
                },
                contactInfo: {
                    primaryPhone: '01712345681',
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
                    employeeId: 'OFF456',
                    bankId: otherBank._id
                }
            });

            await expect(assignKYCRequest(
                kycRequest._id,
                otherOfficer._id,
                testOfficer._id
            )).rejects.toThrow('must belong to the same bank');
        });
    });
});
