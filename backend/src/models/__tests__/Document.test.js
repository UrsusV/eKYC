const mongoose = require('mongoose');
const Document = require('../Document');
const { connect, closeDatabase, clearDatabase } = require('./testSetup');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Document Model', () => {
    const validDocumentData = {
        userId: new mongoose.Types.ObjectId(),
        documentType: 'nid_front',
        documentCategory: 'identity',
        file: {
            originalName: 'nid.jpg',
            fileName: 'nid_123456.jpg',
            filePath: '/uploads/nid_123456.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1048576,
            fileExtension: 'jpg'
        },
        encryption: {
            isEncrypted: true,
            algorithm: 'aes-256-cbc',
            iv: 'abc123def456',
            encryptionKeyId: 'key_001'
        },
        hash: {
            algorithm: 'sha256',
            value: 'abc123def456hash'
        }
    };

    describe('Schema Validation', () => {
        it('should create a valid document', async () => {
            const doc = await Document.create(validDocumentData);

            expect(doc._id).toBeDefined();
            expect(doc.documentId).toBeDefined();
            expect(doc.documentId).toMatch(/^DOC\d{4}/);
        });

        it('should require userId', async () => {
            const doc = new Document({ ...validDocumentData, userId: undefined });
            await expect(doc.save()).rejects.toThrow(/User ID is required/);
        });

        it('should require documentType', async () => {
            const doc = new Document({ ...validDocumentData, documentType: undefined });
            await expect(doc.save()).rejects.toThrow(/Document type is required/);
        });

        it('should require documentCategory', async () => {
            const doc = new Document({ ...validDocumentData, documentCategory: undefined });
            await expect(doc.save()).rejects.toThrow();
        });
    });

    describe('Document ID Generation', () => {
        it('should auto-generate documentId', async () => {
            const doc = await Document.create(validDocumentData);
            expect(doc.documentId).toBeDefined();
            expect(doc.documentId).toMatch(/^DOC\d{4}[A-Z0-9]{8}$/);
        });

        it('should not override provided documentId', async () => {
            const doc = await Document.create({
                ...validDocumentData,
                documentId: 'DOC2510TEST1'
            });
            expect(doc.documentId).toBe('DOC2510TEST1');
        });
    });

    describe('Document Type Validation', () => {
        it('should accept valid document types', async () => {
            const types = [
                'nid_front', 'nid_back', 'passport', 'birth_certificate',
                'utility_bill', 'bank_statement', 'photograph', 'signature'
            ];

            for (const type of types) {
                const doc = await Document.create({
                    ...validDocumentData,
                    file: {
                        ...validDocumentData.file,
                        fileName: `file_${type}.jpg`
                    },
                    hash: {
                        ...validDocumentData.hash,
                        value: `hash_${type}`
                    },
                    documentType: type
                });
                expect(doc.documentType).toBe(type);
            }
        });

        it('should reject invalid document type', async () => {
            const doc = new Document({ ...validDocumentData, documentType: 'invalid_type' });
            await expect(doc.save()).rejects.toThrow(/not a valid document type/);
        });
    });

    describe('Document Category Validation', () => {
        it('should accept valid categories', async () => {
            const categories = ['identity', 'address', 'financial', 'biometric', 'other'];

            for (const category of categories) {
                const doc = await Document.create({
                    ...validDocumentData,
                    file: {
                        ...validDocumentData.file,
                        fileName: `file_${category}.jpg`
                    },
                    hash: {
                        ...validDocumentData.hash,
                        value: `hash_${category}`
                    },
                    documentCategory: category
                });
                expect(doc.documentCategory).toBe(category);
            }
        });
    });

    describe('File Information', () => {
        it('should require file information', async () => {
            const doc = new Document({ ...validDocumentData, file: undefined });
            await expect(doc.save()).rejects.toThrow();
        });

        it('should validate mime type', async () => {
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

            for (const mimeType of validTypes) {
                const doc = await Document.create({
                    ...validDocumentData,
                    file: {
                        ...validDocumentData.file,
                        fileName: `file_${mimeType.replace('/', '_')}.jpg`,
                        mimeType
                    },
                    hash: {
                        ...validDocumentData.hash,
                        value: `hash_${mimeType}`
                    }
                });
                expect(doc.file.mimeType).toBe(mimeType);
            }
        });

        it('should reject invalid mime type', async () => {
            const doc = new Document({
                ...validDocumentData,
                file: {
                    ...validDocumentData.file,
                    mimeType: 'text/plain'
                }
            });
            await expect(doc.save()).rejects.toThrow(/File type not allowed/);
        });

        it('should enforce max file size of 10MB', async () => {
            const doc = new Document({
                ...validDocumentData,
                file: {
                    ...validDocumentData.file,
                    fileSize: 11 * 1024 * 1024 // 11MB
                }
            });
            await expect(doc.save()).rejects.toThrow(/cannot exceed 10MB/);
        });

        it('should enforce unique file name', async () => {
            await Document.create(validDocumentData);
            const duplicate = new Document(validDocumentData);
            await expect(duplicate.save()).rejects.toThrow(/duplicate key/);
        });
    });

    describe('Encryption Metadata', () => {
        it('should default isEncrypted to true', async () => {
            const docData = { ...validDocumentData };
            delete docData.encryption.isEncrypted;
            const doc = await Document.create(docData);
            expect(doc.encryption.isEncrypted).toBe(true);
        });

        it('should require encryption fields when encrypted', async () => {
            const doc = new Document({
                ...validDocumentData,
                encryption: {
                    isEncrypted: true,
                    algorithm: 'aes-256-cbc'
                    // Missing iv and encryptionKeyId
                }
            });
            await expect(doc.save()).rejects.toThrow();
        });

        it('should accept valid encryption algorithms', async () => {
            const algorithms = ['aes-256-cbc', 'aes-256-gcm'];

            for (const algorithm of algorithms) {
                const doc = await Document.create({
                    ...validDocumentData,
                    file: {
                        ...validDocumentData.file,
                        fileName: `file_${algorithm}.jpg`
                    },
                    hash: {
                        ...validDocumentData.hash,
                        value: `hash_${algorithm}`
                    },
                    encryption: {
                        ...validDocumentData.encryption,
                        algorithm
                    }
                });
                expect(doc.encryption.algorithm).toBe(algorithm);
            }
        });

        it('should default algorithm to aes-256-cbc', async () => {
            const docData = { ...validDocumentData };
            delete docData.encryption.algorithm;
            const doc = await Document.create(docData);
            expect(doc.encryption.algorithm).toBe('aes-256-cbc');
        });
    });

    describe('Hash for Integrity', () => {
        it('should require hash value', async () => {
            const doc = new Document({
                ...validDocumentData,
                hash: { algorithm: 'sha256' }
            });
            await expect(doc.save()).rejects.toThrow();
        });

        it('should enforce unique hash value', async () => {
            await Document.create(validDocumentData);
            const duplicate = new Document({
                ...validDocumentData,
                file: {
                    ...validDocumentData.file,
                    fileName: 'different.jpg'
                }
            });
            await expect(duplicate.save()).rejects.toThrow(/duplicate key/);
        });

        it('should accept valid hash algorithms', async () => {
            const algorithms = ['sha256', 'sha512'];

            for (const algorithm of algorithms) {
                const doc = await Document.create({
                    ...validDocumentData,
                    file: {
                        ...validDocumentData.file,
                        fileName: `file_${algorithm}.jpg`
                    },
                    hash: {
                        algorithm,
                        value: `hash_${algorithm}`
                    }
                });
                expect(doc.hash.algorithm).toBe(algorithm);
            }
        });
    });

    describe('Verification Status', () => {
        it('should default verification status to pending', async () => {
            const doc = await Document.create(validDocumentData);
            expect(doc.verification.status).toBe('pending');
        });

        it('should accept valid verification statuses', async () => {
            const statuses = ['pending', 'in_progress', 'verified', 'rejected', 'expired'];

            for (const status of statuses) {
                const doc = await Document.create({
                    ...validDocumentData,
                    file: {
                        ...validDocumentData.file,
                        fileName: `file_${status}.jpg`
                    },
                    hash: {
                        ...validDocumentData.hash,
                        value: `hash_${status}`
                    },
                    verification: { status }
                });
                expect(doc.verification.status).toBe(status);
            }
        });
    });

    describe('Access Control', () => {
        it('should default isPublic to false', async () => {
            const doc = await Document.create(validDocumentData);
            expect(doc.accessControl.isPublic).toBe(false);
        });

        it('should store allowed roles', async () => {
            const doc = await Document.create({
                ...validDocumentData,
                accessControl: {
                    allowedRoles: ['admin', 'bank_officer']
                }
            });
            expect(doc.accessControl.allowedRoles).toContain('admin');
            expect(doc.accessControl.allowedRoles).toContain('bank_officer');
        });
    });

    describe('Status Management', () => {
        it('should default status to active', async () => {
            const doc = await Document.create(validDocumentData);
            expect(doc.status).toBe('active');
        });

        it('should accept valid statuses', async () => {
            const statuses = ['active', 'archived', 'deleted', 'quarantined'];

            for (const status of statuses) {
                const doc = await Document.create({
                    ...validDocumentData,
                    file: {
                        ...validDocumentData.file,
                        fileName: `file_${status}.jpg`
                    },
                    hash: {
                        ...validDocumentData.hash,
                        value: `hash_${status}`
                    },
                    status
                });
                expect(doc.status).toBe(status);
            }
        });

        it('should default isDeleted to false', async () => {
            const doc = await Document.create(validDocumentData);
            expect(doc.isDeleted).toBe(false);
        });
    });

    describe('Retention Policy', () => {
        it('should set default retention to 5 years', async () => {
            const doc = await Document.create(validDocumentData);
            const fiveYearsFromNow = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);
            const diff = Math.abs(doc.retentionPolicy.retainUntil - fiveYearsFromNow);
            expect(diff).toBeLessThan(1000); // Within 1 second
        });

        it('should default canDelete to false', async () => {
            const doc = await Document.create(validDocumentData);
            expect(doc.retentionPolicy.canDelete).toBe(false);
        });
    });

    describe('Version Control', () => {
        it('should default version to 1', async () => {
            const doc = await Document.create(validDocumentData);
            expect(doc.version).toBe(1);
        });

        it('should increment version on file change', async () => {
            const doc = await Document.create(validDocumentData);
            expect(doc.version).toBe(1);

            doc.file.fileName = 'updated.jpg';
            await doc.save();

            expect(doc.version).toBe(2);
            expect(doc.previousVersions.length).toBe(1);
        });
    });

    describe('Expiry Management', () => {
        it('should mark as expired when expiry date passed', async () => {
            const doc = await Document.create({
                ...validDocumentData,
                expiryDate: new Date(Date.now() - 1000)
            });

            await doc.save();
            expect(doc.isExpired).toBe(true);
            expect(doc.verification.status).toBe('expired');
        });

        it('should not mark as expired if date is in future', async () => {
            const doc = await Document.create({
                ...validDocumentData,
                expiryDate: new Date(Date.now() + 1000000)
            });

            expect(doc.isExpired).toBe(false);
        });
    });

    describe('Virtual Fields', () => {
        it('should calculate file size in MB', async () => {
            const doc = await Document.create({
                ...validDocumentData,
                file: {
                    ...validDocumentData.file,
                    fileSize: 2097152 // 2MB
                }
            });
            expect(doc.fileSizeMB).toBe('2.00');
        });

        it('should calculate days until expiry', async () => {
            const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            const doc = await Document.create({
                ...validDocumentData,
                expiryDate: threeDaysFromNow
            });
            expect(doc.daysUntilExpiry).toBe(3);
        });

        it('should check if accessible', async () => {
            const doc = await Document.create({
                ...validDocumentData,
                status: 'active',
                isDeleted: false,
                isExpired: false
            });
            expect(doc.isAccessible).toBe(true);
        });
    });

    describe('Static Methods', () => {
        describe('generateHash', () => {
            it('should generate hash from buffer', () => {
                const buffer = Buffer.from('test data');
                const hash = Document.generateHash(buffer);
                expect(hash).toBeDefined();
                expect(typeof hash).toBe('string');
            });

            it('should support different algorithms', () => {
                const buffer = Buffer.from('test data');
                const sha256 = Document.generateHash(buffer, 'sha256');
                const sha512 = Document.generateHash(buffer, 'sha512');
                expect(sha256).not.toBe(sha512);
                expect(sha512.length).toBeGreaterThan(sha256.length);
            });
        });

        describe('findExpired', () => {
            it('should find expired documents', async () => {
                const doc = await Document.create({
                    ...validDocumentData,
                    expiryDate: new Date(Date.now() + 60000)
                });

                await Document.updateOne(
                    { _id: doc._id },
                    {
                        $set: {
                            expiryDate: new Date(Date.now() - 1000),
                            isExpired: false
                        }
                    }
                );

                const expired = await Document.findExpired();
                expect(expired.length).toBe(1);
                expect(expired[0]._id.toString()).toBe(doc._id.toString());
            });
        });

        describe('findPendingVerification', () => {
            it('should find pending documents', async () => {
                await Document.create({
                    ...validDocumentData,
                    verification: { status: 'pending' }
                });

                const pending = await Document.findPendingVerification();
                expect(pending.length).toBe(1);
            });

            it('should filter by userId', async () => {
                const user1 = new mongoose.Types.ObjectId();
                const user2 = new mongoose.Types.ObjectId();

                await Document.create({
                    ...validDocumentData,
                    userId: user1,
                    verification: { status: 'pending' }
                });

                await Document.create({
                    ...validDocumentData,
                    file: {
                        ...validDocumentData.file,
                        fileName: 'file2.jpg'
                    },
                    hash: {
                        ...validDocumentData.hash,
                        value: 'hash2'
                    },
                    userId: user2,
                    verification: { status: 'pending' }
                });

                const pending = await Document.findPendingVerification(user1);
                expect(pending.length).toBe(1);
                expect(pending[0].userId.toString()).toBe(user1.toString());
            });
        });
    });

    describe('Instance Methods', () => {
        describe('logAccess', () => {
            it('should log document access', async () => {
                const doc = await Document.create(validDocumentData);
                const userId = new mongoose.Types.ObjectId();

                await doc.logAccess(userId, 'view', '192.168.1.1', 'KYC verification');

                expect(doc.accessLog.length).toBe(1);
                expect(doc.accessLog[0].action).toBe('view');
                expect(doc.accessLog[0].ipAddress).toBe('192.168.1.1');
            });
        });

        describe('softDelete', () => {
            it('should soft delete document', async () => {
                const doc = await Document.create(validDocumentData);
                const userId = new mongoose.Types.ObjectId();

                await doc.softDelete(userId, 'User requested deletion');

                expect(doc.isDeleted).toBe(true);
                expect(doc.deletedAt).toBeInstanceOf(Date);
                expect(doc.deletedBy.toString()).toBe(userId.toString());
                expect(doc.deletionReason).toBe('User requested deletion');
                expect(doc.status).toBe('deleted');
            });
        });

        describe('canAccess', () => {
            it('should allow owner to access', async () => {
                const userId = new mongoose.Types.ObjectId();
                const doc = await Document.create({
                    ...validDocumentData,
                    userId
                });

                expect(doc.canAccess(userId, 'customer')).toBe(true);
            });

            it('should allow access if public', async () => {
                const doc = await Document.create({
                    ...validDocumentData,
                    accessControl: { isPublic: true }
                });

                expect(doc.canAccess(new mongoose.Types.ObjectId(), 'customer')).toBe(true);
            });

            it('should allow access for allowed roles', async () => {
                const doc = await Document.create({
                    ...validDocumentData,
                    accessControl: {
                        allowedRoles: ['admin', 'bank_officer']
                    }
                });

                expect(doc.canAccess(new mongoose.Types.ObjectId(), 'admin')).toBe(true);
                expect(doc.canAccess(new mongoose.Types.ObjectId(), 'customer')).toBe(false);
            });

            it('should allow access for allowed users', async () => {
                const allowedUser = new mongoose.Types.ObjectId();
                const doc = await Document.create({
                    ...validDocumentData,
                    accessControl: {
                        allowedUsers: [allowedUser]
                    }
                });

                expect(doc.canAccess(allowedUser, 'customer')).toBe(true);
                expect(doc.canAccess(new mongoose.Types.ObjectId(), 'customer')).toBe(false);
            });
        });

        describe('encryptMetadata', () => {
            it('should set IV when encrypted', async () => {
                const doc = await Document.create({
                    ...validDocumentData,
                    encryption: {
                        isEncrypted: true,
                        algorithm: 'aes-256-cbc',
                        iv: 'existingivvalue123',
                        encryptionKeyId: 'key_001'
                    }
                });

                const previousIv = doc.encryption.iv;
                doc.encryptMetadata('test-key');
                expect(doc.encryption.iv).toBeDefined();
                expect(doc.encryption.iv.length).toBeGreaterThan(0);
                expect(doc.encryption.iv).not.toBe(previousIv);
            });
        });
    });

    describe('Blockchain Storage', () => {
        it('should default isStoredOnChain to false', async () => {
            const doc = await Document.create(validDocumentData);
            expect(doc.blockchain.isStoredOnChain).toBe(false);
        });

        it('should store blockchain metadata', async () => {
            const doc = await Document.create({
                ...validDocumentData,
                blockchain: {
                    isStoredOnChain: true,
                    documentHash: 'abc123',
                    transactionHash: '0x123456',
                    blockNumber: 12345
                }
            });

            expect(doc.blockchain.isStoredOnChain).toBe(true);
            expect(doc.blockchain.documentHash).toBe('abc123');
        });
    });

    describe('Timestamps', () => {
        it('should add createdAt and updatedAt', async () => {
            const doc = await Document.create(validDocumentData);
            expect(doc.createdAt).toBeInstanceOf(Date);
            expect(doc.updatedAt).toBeInstanceOf(Date);
        });
    });
});
