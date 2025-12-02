const mongoose = require('mongoose');
const KycRequest = require('../KycRequest');
const { connect, closeDatabase, clearDatabase } = require('./testSetup');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('KycRequest Model', () => {
    const validKycData = {
        userId: new mongoose.Types.ObjectId(),
        bankId: new mongoose.Types.ObjectId(),
        requestType: 'new',
        kycLevel: 1,
        status: 'draft'
    };

    describe('Schema Validation', () => {
        it('should create a valid KYC request', async () => {
            const kyc = await KycRequest.create(validKycData);

            expect(kyc._id).toBeDefined();
            expect(kyc.requestId).toBeDefined();
            expect(kyc.requestId).toMatch(/^KYC\d{4}/);
        });

        it('should require userId', async () => {
            const kyc = new KycRequest({ ...validKycData, userId: undefined });
            await expect(kyc.save()).rejects.toThrow(/User ID is required/);
        });

        it('should require bankId', async () => {
            const kyc = new KycRequest({ ...validKycData, bankId: undefined });
            await expect(kyc.save()).rejects.toThrow(/Bank ID is required/);
        });

        it('should require request type', async () => {
            const kyc = new KycRequest({ ...validKycData, requestType: undefined });
            await expect(kyc.save()).rejects.toThrow();
        });

        it('should default status to draft', async () => {
            const kycData = { ...validKycData };
            delete kycData.status;
            const kyc = await KycRequest.create(kycData);
            expect(kyc.status).toBe('draft');
        });

        it('should default kycLevel to 1', async () => {
            const kycData = { ...validKycData };
            delete kycData.kycLevel;
            const kyc = await KycRequest.create(kycData);
            expect(kyc.kycLevel).toBe(1);
        });
    });

    describe('Request ID Generation', () => {
        it('should auto-generate requestId on creation', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.requestId).toBeDefined();
            expect(kyc.requestId).toMatch(/^KYC\d{4}[A-Z0-9]{6}$/);
        });

        it('should not override provided requestId', async () => {
            const kyc = await KycRequest.create({
                ...validKycData,
                requestId: 'KYC2510TEST1'
            });
            expect(kyc.requestId).toBe('KYC2510TEST1');
        });

        it('should generate unique requestIds', async () => {
            const kyc1 = await KycRequest.create(validKycData);
            const kyc2 = await KycRequest.create({
                ...validKycData,
                userId: new mongoose.Types.ObjectId()
            });
            expect(kyc1.requestId).not.toBe(kyc2.requestId);
        });
    });

    describe('Request Type Validation', () => {
        it('should accept valid request types', async () => {
            const types = ['new', 'update', 'renewal', 'upgrade'];

            for (const type of types) {
                const kyc = await KycRequest.create({
                    ...validKycData,
                    userId: new mongoose.Types.ObjectId(),
                    requestType: type
                });
                expect(kyc.requestType).toBe(type);
            }
        });

        it('should reject invalid request type', async () => {
            const kyc = new KycRequest({ ...validKycData, requestType: 'invalid' });
            await expect(kyc.save()).rejects.toThrow(/not a valid request type/);
        });
    });

    describe('KYC Level Validation', () => {
        it('should accept KYC levels 1, 2, 3', async () => {
            for (let level = 1; level <= 3; level++) {
                const kyc = await KycRequest.create({
                    ...validKycData,
                    userId: new mongoose.Types.ObjectId(),
                    kycLevel: level
                });
                expect(kyc.kycLevel).toBe(level);
            }
        });

        it('should reject invalid KYC level', async () => {
            const kyc = new KycRequest({ ...validKycData, kycLevel: 4 });
            await expect(kyc.save()).rejects.toThrow();
        });
    });

    describe('Status Workflow', () => {
        it('should accept all valid statuses', async () => {
            const statuses = [
                'draft',
                'submitted',
                'pending',
                'document_verification',
                'under_review',
                'additional_info_required',
                'approved',
                'rejected',
                'expired',
                'cancelled'
            ];

            for (const status of statuses) {
                const kyc = await KycRequest.create({
                    ...validKycData,
                    userId: new mongoose.Types.ObjectId(),
                    status
                });
                expect(kyc.status).toBe(status);
            }
        });

        it('should reject invalid status', async () => {
            const kyc = new KycRequest({ ...validKycData, status: 'invalid_status' });
            await expect(kyc.save()).rejects.toThrow(/not a valid status/);
        });
    });

    describe('Status History Tracking', () => {
        it('should add to status history on status change', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.statusHistory.length).toBe(1);

            kyc.status = 'submitted';
            await kyc.save();
            expect(kyc.statusHistory.length).toBe(2);

            expect(kyc.statusHistory[0].status).toBe('draft');
            expect(kyc.statusHistory[1].status).toBe('submitted');
        });

        it('should record timestamp in status history', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.statusHistory[0].changedAt).toBeInstanceOf(Date);
        });

        it('should not add to history if status unchanged', async () => {
            const kyc = await KycRequest.create(validKycData);
            const historyLength = kyc.statusHistory.length;

            kyc.requestType = 'update';
            await kyc.save();

            expect(kyc.statusHistory.length).toBe(historyLength);
        });
    });

    describe('Workflow Timestamps', () => {
        it('should set submittedAt when status changes to submitted', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.workflow.submittedAt).toBeUndefined();

            kyc.status = 'submitted';
            await kyc.save();

            expect(kyc.workflow.submittedAt).toBeInstanceOf(Date);
        });

        it('should set expiresAt when submitted', async () => {
            const kyc = await KycRequest.create(validKycData);
            kyc.status = 'submitted';
            await kyc.save();

            expect(kyc.workflow.expiresAt).toBeInstanceOf(Date);
            expect(kyc.workflow.expiresAt.getTime()).toBeGreaterThan(Date.now());
        });

        it('should set reviewStartedAt when status changes to under_review', async () => {
            const kyc = await KycRequest.create({ ...validKycData, status: 'submitted' });
            kyc.status = 'under_review';
            await kyc.save();

            expect(kyc.workflow.reviewStartedAt).toBeInstanceOf(Date);
        });

        it('should set approvedAt when status changes to approved', async () => {
            const kyc = await KycRequest.create({ ...validKycData, status: 'under_review' });
            kyc.status = 'approved';
            await kyc.save();

            expect(kyc.workflow.approvedAt).toBeInstanceOf(Date);
            expect(kyc.workflow.reviewCompletedAt).toBeInstanceOf(Date);
        });

        it('should set rejectedAt when status changes to rejected', async () => {
            const kyc = await KycRequest.create({ ...validKycData, status: 'under_review' });
            kyc.status = 'rejected';
            await kyc.save();

            expect(kyc.workflow.rejectedAt).toBeInstanceOf(Date);
            expect(kyc.workflow.reviewCompletedAt).toBeInstanceOf(Date);
        });
    });

    describe('Processing Metrics', () => {
        it('should calculate totalProcessingTime on approval', async () => {
            const kyc = await KycRequest.create({ ...validKycData, status: 'submitted' });
            kyc.workflow.submittedAt = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago

            kyc.status = 'approved';
            await kyc.save();

            expect(kyc.metrics.totalProcessingTime).toBeGreaterThan(0);
        });

        it('should calculate reviewDuration', async () => {
            const kyc = await KycRequest.create({ ...validKycData, status: 'under_review' });
            kyc.workflow.submittedAt = new Date(Date.now() - 1000 * 60 * 60);
            kyc.workflow.reviewStartedAt = new Date(Date.now() - 1000 * 60 * 30); // 30 min ago

            kyc.status = 'approved';
            await kyc.save();

            expect(kyc.metrics.reviewDuration).toBeGreaterThan(0);
        });

        it('should default numberOfRevisions to 0', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.metrics.numberOfRevisions).toBe(0);
        });

        it('should default officerChanges to 0', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.metrics.officerChanges).toBe(0);
        });
    });

    describe('Document Tracking', () => {
        it('should store document references', async () => {
            const kyc = await KycRequest.create({
                ...validKycData,
                documents: [{
                    documentId: new mongoose.Types.ObjectId(),
                    documentType: 'nid_front',
                    status: 'pending'
                }]
            });

            expect(kyc.documents.length).toBe(1);
            expect(kyc.documents[0].documentType).toBe('nid_front');
            expect(kyc.documents[0].status).toBe('pending');
        });

        it('should accept valid document types', async () => {
            const types = [
                'nid_front', 'nid_back', 'passport', 'birth_certificate',
                'utility_bill', 'bank_statement', 'photograph', 'signature'
            ];

            for (const type of types) {
                const kyc = await KycRequest.create({
                    ...validKycData,
                    userId: new mongoose.Types.ObjectId(),
                    documents: [{
                        documentId: new mongoose.Types.ObjectId(),
                        documentType: type,
                        status: 'pending'
                    }]
                });
                expect(kyc.documents[0].documentType).toBe(type);
            }
        });
    });

    describe('Risk Assessment', () => {
        it('should default risk level to low', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.riskAssessment.riskLevel).toBe('low');
        });

        it('should accept valid risk levels', async () => {
            const levels = ['low', 'medium', 'high', 'very_high'];

            for (const level of levels) {
                const kyc = await KycRequest.create({
                    ...validKycData,
                    userId: new mongoose.Types.ObjectId(),
                    riskAssessment: { riskLevel: level }
                });
                expect(kyc.riskAssessment.riskLevel).toBe(level);
            }
        });

        it('should default totalRiskScore to 0', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.riskAssessment.totalRiskScore).toBe(0);
        });

        it('should enforce risk score range 0-100', async () => {
            const kyc = new KycRequest({
                ...validKycData,
                riskAssessment: { totalRiskScore: 150 }
            });
            await expect(kyc.save()).rejects.toThrow();
        });
    });

    describe('AML Screening', () => {
        it('should default AML status to pending', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.amlScreening.status).toBe('pending');
        });

        it('should accept valid AML statuses', async () => {
            const statuses = ['pending', 'clear', 'flagged', 'blocked'];

            for (const status of statuses) {
                const kyc = await KycRequest.create({
                    ...validKycData,
                    userId: new mongoose.Types.ObjectId(),
                    amlScreening: { status }
                });
                expect(kyc.amlScreening.status).toBe(status);
            }
        });

        it('should track PEP status', async () => {
            const kyc = await KycRequest.create({
                ...validKycData,
                amlScreening: {
                    pep: true,
                    watchlistMatch: false,
                    sanctionsList: false
                }
            });

            expect(kyc.amlScreening.pep).toBe(true);
            expect(kyc.amlScreening.watchlistMatch).toBe(false);
        });
    });

    describe('Verification Checks', () => {
        it('should default all verification statuses to pending', async () => {
            const kyc = await KycRequest.create(validKycData);

            expect(kyc.verificationChecks.nidVerification.status).toBe('pending');
            expect(kyc.verificationChecks.faceMatch.status).toBe('pending');
            expect(kyc.verificationChecks.addressVerification.status).toBe('pending');
            expect(kyc.verificationChecks.phoneVerification.status).toBe('pending');
            expect(kyc.verificationChecks.emailVerification.status).toBe('pending');
        });

        it('should default biometric verification to not_required', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.verificationChecks.biometricVerification.status).toBe('not_required');
        });
    });

    describe('Priority', () => {
        it('should default priority to normal', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.priority).toBe('normal');
        });

        it('should accept valid priority levels', async () => {
            const priorities = ['low', 'normal', 'high', 'urgent'];

            for (const priority of priorities) {
                const kyc = await KycRequest.create({
                    ...validKycData,
                    userId: new mongoose.Types.ObjectId(),
                    priority
                });
                expect(kyc.priority).toBe(priority);
            }
        });
    });

    describe('Virtual Fields', () => {
        it('should calculate daysSinceSubmission', async () => {
            const submittedDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
            const kyc = await KycRequest.create({
                ...validKycData,
                workflow: { submittedAt: submittedDate }
            });

            expect(kyc.daysSinceSubmission).toBe(2);
        });

        it('should return null for daysSinceSubmission if not submitted', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.daysSinceSubmission).toBeNull();
        });

        it('should check if expired', async () => {
            const kyc = await KycRequest.create({
                ...validKycData,
                workflow: { expiresAt: new Date(Date.now() - 1000) }
            });
            expect(kyc.isExpired).toBe(true);
        });

        it('should check all documents verified', async () => {
            const kyc = await KycRequest.create({
                ...validKycData,
                documents: [
                    { documentId: new mongoose.Types.ObjectId(), documentType: 'nid_front', status: 'verified' },
                    { documentId: new mongoose.Types.ObjectId(), documentType: 'nid_back', status: 'verified' }
                ]
            });
            expect(kyc.allDocumentsVerified).toBe(true);
        });

        it('should calculate verification progress', async () => {
            const kyc = await KycRequest.create({
                ...validKycData,
                verificationChecks: {
                    nidVerification: { status: 'success' },
                    faceMatch: { status: 'success' },
                    addressVerification: { status: 'pending' },
                    phoneVerification: { status: 'pending' },
                    emailVerification: { status: 'pending' }
                }
            });
            expect(kyc.verificationProgress).toBe(40); // 2 out of 5 = 40%
        });
    });

    describe('Static Methods', () => {
        describe('findPending', () => {
            it('should find pending KYC requests', async () => {
                await KycRequest.create({ ...validKycData, status: 'pending' });
                await KycRequest.create({ ...validKycData, userId: new mongoose.Types.ObjectId(), status: 'under_review' });
                await KycRequest.create({ ...validKycData, userId: new mongoose.Types.ObjectId(), status: 'approved' });

                const pending = await KycRequest.findPending();
                expect(pending.length).toBe(2);
            });

            it('should filter by bankId', async () => {
                const bank1 = new mongoose.Types.ObjectId();
                const bank2 = new mongoose.Types.ObjectId();

                await KycRequest.create({ ...validKycData, bankId: bank1, status: 'pending' });
                await KycRequest.create({ ...validKycData, userId: new mongoose.Types.ObjectId(), bankId: bank2, status: 'pending' });

                const pending = await KycRequest.findPending(bank1);
                expect(pending.length).toBe(1);
                expect(pending[0].bankId.toString()).toBe(bank1.toString());
            });
        });

        describe('findOverdue', () => {
            it('should find overdue requests', async () => {
                const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

                await KycRequest.create({
                    ...validKycData,
                    status: 'pending',
                    workflow: { submittedAt: threeDaysAgo }
                });

                const overdue = await KycRequest.findOverdue();
                expect(overdue.length).toBe(1);
            });

            it('should not include recent requests', async () => {
                await KycRequest.create({
                    ...validKycData,
                    status: 'pending',
                    workflow: { submittedAt: new Date() }
                });

                const overdue = await KycRequest.findOverdue();
                expect(overdue.length).toBe(0);
            });
        });
    });

    describe('Instance Methods', () => {
        describe('assignTo', () => {
            it('should assign KYC to officer', async () => {
                const kyc = await KycRequest.create(validKycData);
                const officerId = new mongoose.Types.ObjectId();

                await kyc.assignTo(officerId);
                expect(kyc.workflow.assignedTo.toString()).toBe(officerId.toString());
            });

            it('should increment officerChanges on reassignment', async () => {
                const kyc = await KycRequest.create(validKycData);
                const officer1 = new mongoose.Types.ObjectId();
                const officer2 = new mongoose.Types.ObjectId();

                await kyc.assignTo(officer1);
                expect(kyc.metrics.officerChanges).toBe(0);

                await kyc.assignTo(officer2);
                expect(kyc.metrics.officerChanges).toBe(1);
            });
        });

        describe('addNote', () => {
            it('should add internal note', async () => {
                const kyc = await KycRequest.create(validKycData);
                const userId = new mongoose.Types.ObjectId();

                await kyc.addNote('Test note', userId);
                expect(kyc.internalNotes.length).toBe(1);
                expect(kyc.internalNotes[0].note).toBe('Test note');
                expect(kyc.internalNotes[0].addedBy.toString()).toBe(userId.toString());
            });

            it('should default note as private', async () => {
                const kyc = await KycRequest.create(validKycData);
                await kyc.addNote('Test note', new mongoose.Types.ObjectId());
                expect(kyc.internalNotes[0].isPrivate).toBe(true);
            });

            it('should allow public notes', async () => {
                const kyc = await KycRequest.create(validKycData);
                await kyc.addNote('Public note', new mongoose.Types.ObjectId(), false);
                expect(kyc.internalNotes[0].isPrivate).toBe(false);
            });
        });

        describe('updateDocumentStatus', () => {
            it('should update document status', async () => {
                const docId = new mongoose.Types.ObjectId();
                const kyc = await KycRequest.create({
                    ...validKycData,
                    documents: [{
                        documentId: docId,
                        documentType: 'nid_front',
                        status: 'pending'
                    }]
                });

                await kyc.updateDocumentStatus(docId, 'verified', 'Looks good', new mongoose.Types.ObjectId());

                expect(kyc.documents[0].status).toBe('verified');
                expect(kyc.documents[0].remarks).toBe('Looks good');
                expect(kyc.documents[0].verifiedAt).toBeInstanceOf(Date);
            });
        });
    });

    describe('Blockchain Integration', () => {
        it('should store blockchain credential hash', async () => {
            const kyc = await KycRequest.create({
                ...validKycData,
                blockchain: {
                    credentialHash: 'abc123def456',
                    transactionHash: '0x123456',
                    blockNumber: 12345,
                    issuedOnChain: true
                }
            });

            expect(kyc.blockchain.credentialHash).toBe('abc123def456');
            expect(kyc.blockchain.issuedOnChain).toBe(true);
        });
    });

    describe('Timestamps', () => {
        it('should add createdAt and updatedAt', async () => {
            const kyc = await KycRequest.create(validKycData);
            expect(kyc.createdAt).toBeInstanceOf(Date);
            expect(kyc.updatedAt).toBeInstanceOf(Date);
        });
    });
});
