const mongoose = require('mongoose');
const AuditLog = require('../AuditLog');
const { connect, closeDatabase, clearDatabase } = require('./testSetup');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('AuditLog Model', () => {
    const validLogData = {
        actor: {
            userId: new mongoose.Types.ObjectId(),
            userEmail: 'test@example.com',
            userRole: 'customer'
        },
        action: {
            type: 'user_login',
            category: 'authentication',
            description: 'User logged in',
            severity: 'info'
        },
        status: 'success',
        request: {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            deviceType: 'web'
        }
    };

    describe('Schema Validation', () => {
        it('should create a valid audit log', async () => {
            const log = await AuditLog.create(validLogData);

            expect(log._id).toBeDefined();
            expect(log.logId).toBeDefined();
            expect(log.logId).toMatch(/^LOG\d{6}/);
        });

        it('should require actor userId', async () => {
            const log = new AuditLog({
                ...validLogData,
                actor: { ...validLogData.actor, userId: undefined }
            });
            await expect(log.save()).rejects.toThrow(/User ID is required/);
        });

        it('should require action type', async () => {
            const log = new AuditLog({
                ...validLogData,
                action: { ...validLogData.action, type: undefined }
            });
            await expect(log.save()).rejects.toThrow(/Action type is required/);
        });

        it('should require IP address', async () => {
            const log = new AuditLog({
                ...validLogData,
                request: { ...validLogData.request, ipAddress: undefined }
            });
            await expect(log.save()).rejects.toThrow();
        });
    });

    describe('Log ID Generation', () => {
        it('should auto-generate logId', async () => {
            const log = await AuditLog.create(validLogData);
            expect(log.logId).toBeDefined();
            expect(log.logId).toMatch(/^LOG\d{6}[A-Z0-9]{8}$/);
        });

        it('should not override provided logId', async () => {
            const log = await AuditLog.create({
                ...validLogData,
                logId: 'LOG2510TEST1'
            });
            expect(log.logId).toBe('LOG2510TEST1');
        });

        it('should generate unique logIds', async () => {
            const log1 = await AuditLog.create(validLogData);
            const log2 = await AuditLog.create({
                ...validLogData,
                actor: {
                    ...validLogData.actor,
                    userId: new mongoose.Types.ObjectId()
                }
            });
            expect(log1.logId).not.toBe(log2.logId);
        });
    });

    describe('Immutability', () => {
        it('should prevent modification after creation', async () => {
            const log = await AuditLog.create(validLogData);

            log.action.description = 'Modified description';
            await expect(log.save()).rejects.toThrow(/cannot be modified after creation/);
        });

        it('should allow reading after creation', async () => {
            const log = await AuditLog.create(validLogData);
            const found = await AuditLog.findById(log._id);

            expect(found.action.description).toBe('User logged in');
        });
    });

    describe('Actor Information', () => {
        it('should store actor details', async () => {
            const log = await AuditLog.create(validLogData);

            expect(log.actor.userEmail).toBe('test@example.com');
            expect(log.actor.userRole).toBe('customer');
        });

        it('should accept all valid roles', async () => {
            const roles = ['customer', 'bank_officer', 'admin'];

            for (const role of roles) {
                const log = await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId: new mongoose.Types.ObjectId(),
                        userRole: role
                    }
                });
                expect(log.actor.userRole).toBe(role);
            }
        });

        it('should store optional bankId', async () => {
            const bankId = new mongoose.Types.ObjectId();
            const log = await AuditLog.create({
                ...validLogData,
                actor: {
                    ...validLogData.actor,
                    bankId
                }
            });
            expect(log.actor.bankId.toString()).toBe(bankId.toString());
        });
    });

    describe('Action Types', () => {
        it('should accept valid action types', async () => {
            const types = [
                'user_login',
                'user_register',
                'kyc_submit',
                'kyc_approve',
                'document_upload',
                'credential_issue',
                'login_failed'
            ];

            for (const type of types) {
                const log = await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId: new mongoose.Types.ObjectId()
                    },
                    action: {
                        ...validLogData.action,
                        type
                    }
                });
                expect(log.action.type).toBe(type);
            }
        });

        it('should reject invalid action type', async () => {
            const log = new AuditLog({
                ...validLogData,
                action: {
                    ...validLogData.action,
                    type: 'invalid_action'
                }
            });
            await expect(log.save()).rejects.toThrow(/not a valid action type/);
        });
    });

    describe('Action Categories', () => {
        it('should accept valid categories', async () => {
            const categories = [
                'authentication',
                'kyc',
                'document',
                'credential',
                'security',
                'compliance'
            ];

            for (const category of categories) {
                const log = await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId: new mongoose.Types.ObjectId()
                    },
                    action: {
                        ...validLogData.action,
                        category
                    }
                });
                expect(log.action.category).toBe(category);
            }
        });
    });

    describe('Severity Levels', () => {
        it('should accept all severity levels', async () => {
            const severities = ['info', 'low', 'medium', 'high', 'critical'];

            for (const severity of severities) {
                const log = await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId: new mongoose.Types.ObjectId()
                    },
                    action: {
                        ...validLogData.action,
                        severity
                    }
                });
                expect(log.action.severity).toBe(severity);
            }
        });

        it('should default severity to info', async () => {
            const logData = { ...validLogData };
            delete logData.action.severity;
            const log = await AuditLog.create(logData);
            expect(log.action.severity).toBe('info');
        });
    });

    describe('Status', () => {
        it('should accept valid statuses', async () => {
            const statuses = ['success', 'failure', 'partial', 'pending'];

            for (const status of statuses) {
                const log = await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId: new mongoose.Types.ObjectId()
                    },
                    status
                });
                expect(log.status).toBe(status);
            }
        });

        it('should default status to success', async () => {
            const logData = { ...validLogData };
            delete logData.status;
            const log = await AuditLog.create(logData);
            expect(log.status).toBe('success');
        });
    });

    describe('Auto-flagging for Review', () => {
        it('should flag critical severity for review', async () => {
            const log = await AuditLog.create({
                ...validLogData,
                action: {
                    ...validLogData.action,
                    severity: 'critical'
                }
            });
            expect(log.requiresReview).toBe(true);
        });

        it('should flag failures for review', async () => {
            const log = await AuditLog.create({
                ...validLogData,
                status: 'failure'
            });
            expect(log.requiresReview).toBe(true);
        });

        it('should flag suspicious activities', async () => {
            const suspiciousActions = [
                'login_failed',
                'security_breach_attempt',
                'admin_user_impersonate',
                'suspicious_activity'
            ];

            for (const type of suspiciousActions) {
                const log = await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId: new mongoose.Types.ObjectId()
                    },
                    action: {
                        ...validLogData.action,
                        type
                    }
                });
                expect(log.requiresReview).toBe(true);
                expect(log.alertTriggered).toBe(true);
                expect(log.alertType).toBe('security');
            }
        });
    });

    describe('Compliance', () => {
        it('should set default retention to 5 years', async () => {
            const log = await AuditLog.create(validLogData);
            const fiveYearsFromNow = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);
            const diff = Math.abs(log.compliance.retainUntil - fiveYearsFromNow);
            expect(diff).toBeLessThan(2000); // Within 2 seconds
        });

        it('should default canDelete to false', async () => {
            const log = await AuditLog.create(validLogData);
            expect(log.compliance.canDelete).toBe(false);
        });

        it('should accept valid regulatory requirements', async () => {
            const requirements = [
                'bangladesh_bank_kyc',
                'aml_cft_act_2012',
                'data_protection',
                'audit_trail'
            ];

            for (const req of requirements) {
                const log = await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId: new mongoose.Types.ObjectId()
                    },
                    compliance: {
                        regulatoryRequirement: req
                    }
                });
                expect(log.compliance.regulatoryRequirement).toBe(req);
            }
        });
    });

    describe('Timestamp', () => {
        it('should automatically set timestamp', async () => {
            const log = await AuditLog.create(validLogData);
            expect(log.timestamp).toBeInstanceOf(Date);
        });

        it('should make timestamp immutable', async () => {
            const log = await AuditLog.create(validLogData);
            const originalTimestamp = log.timestamp;

            log.timestamp = new Date();
            await expect(log.save()).rejects.toThrow();
        });
    });

    describe('Virtual Fields', () => {
        it('should calculate age in days', async () => {
            const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
            const log = await AuditLog.create({
                ...validLogData,
                timestamp: twoDaysAgo
            });
            expect(log.ageInDays).toBe(2);
        });

        it('should calculate days until deletion', async () => {
            const log = await AuditLog.create(validLogData);
            const days = log.daysUntilDeletion;
            expect(days).toBeGreaterThan(1800); // ~5 years
        });

        it('should identify critical logs', async () => {
            const criticalLog = await AuditLog.create({
                ...validLogData,
                action: {
                    ...validLogData.action,
                    severity: 'critical'
                }
            });
            expect(criticalLog.isCritical).toBe(true);

            const infoLog = await AuditLog.create({
                ...validLogData,
                actor: {
                    ...validLogData.actor,
                    userId: new mongoose.Types.ObjectId()
                },
                action: {
                    ...validLogData.action,
                    severity: 'info'
                }
            });
            expect(infoLog.isCritical).toBe(false);
        });
    });

    describe('Static Methods', () => {
        describe('createLog', () => {
            it('should create audit log', async () => {
                const log = await AuditLog.createLog(validLogData);
                expect(log._id).toBeDefined();
                expect(log.logId).toBeDefined();
            });

            it('should throw error on invalid data', async () => {
                await expect(AuditLog.createLog({})).rejects.toThrow();
            });
        });

        describe('findByUser', () => {
            it('should find logs by user', async () => {
                const userId = new mongoose.Types.ObjectId();

                await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId
                    }
                });

                await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId: new mongoose.Types.ObjectId()
                    }
                });

                const logs = await AuditLog.findByUser(userId);
                expect(logs.length).toBe(1);
                expect(logs[0].actor.userId.toString()).toBe(userId.toString());
            });

            it('should filter by date range', async () => {
                const userId = new mongoose.Types.ObjectId();
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

                await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId
                    },
                    timestamp: yesterday
                });

                const logs = await AuditLog.findByUser(userId, new Date(), tomorrow);
                expect(logs.length).toBe(0);
            });
        });

        describe('findByAction', () => {
            it('should find logs by action type', async () => {
                await AuditLog.create({
                    ...validLogData,
                    action: {
                        ...validLogData.action,
                        type: 'kyc_approve'
                    }
                });

                await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId: new mongoose.Types.ObjectId()
                    },
                    action: {
                        ...validLogData.action,
                        type: 'user_login'
                    }
                });

                const logs = await AuditLog.findByAction('kyc_approve');
                expect(logs.length).toBe(1);
                expect(logs[0].action.type).toBe('kyc_approve');
            });
        });

        describe('findSuspicious', () => {
            it('should find suspicious activities', async () => {
                await AuditLog.create({
                    ...validLogData,
                    action: {
                        ...validLogData.action,
                        severity: 'critical'
                    }
                });

                await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId: new mongoose.Types.ObjectId()
                    },
                    status: 'failure'
                });

                const suspicious = await AuditLog.findSuspicious();
                expect(suspicious.length).toBeGreaterThanOrEqual(2);
            });

            it('should limit results', async () => {
                for (let i = 0; i < 5; i++) {
                    await AuditLog.create({
                        ...validLogData,
                        actor: {
                            ...validLogData.actor,
                            userId: new mongoose.Types.ObjectId()
                        },
                        action: {
                            ...validLogData.action,
                            severity: 'critical'
                        }
                    });
                }

                const suspicious = await AuditLog.findSuspicious(3);
                expect(suspicious.length).toBe(3);
            });
        });

        describe('findFailedLogins', () => {
            it('should find failed login attempts', async () => {
                const userId = new mongoose.Types.ObjectId();

                await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId
                    },
                    action: {
                        ...validLogData.action,
                        type: 'login_failed'
                    }
                });

                const failed = await AuditLog.findFailedLogins(userId, 24);
                expect(failed.length).toBe(1);
            });

            it('should filter by time window', async () => {
                const userId = new mongoose.Types.ObjectId();
                const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

                await AuditLog.create({
                    ...validLogData,
                    actor: {
                        ...validLogData.actor,
                        userId
                    },
                    action: {
                        ...validLogData.action,
                        type: 'login_failed'
                    },
                    timestamp: twoDaysAgo
                });

                const failed = await AuditLog.findFailedLogins(userId, 24);
                expect(failed.length).toBe(0);
            });
        });
    });

    describe('Instance Methods', () => {
        describe('anonymize', () => {
            it('should anonymize PII', async () => {
                const log = await AuditLog.create(validLogData);
                const originalEmail = log.actor.userEmail;

                await log.anonymize();

                expect(log.actor.userEmail).not.toBe(originalEmail);
                expect(log.actor.userEmail).toContain('anonymized_');
                expect(log.isAnonymized).toBe(true);
                expect(log.anonymizedAt).toBeInstanceOf(Date);
            });

            it('should not anonymize twice', async () => {
                const log = await AuditLog.create(validLogData);
                await log.anonymize();
                const email = log.actor.userEmail;

                await log.anonymize();
                expect(log.actor.userEmail).toBe(email);
            });
        });
    });

    describe('Target Resource', () => {
        it('should store target resource information', async () => {
            const resourceId = new mongoose.Types.ObjectId();
            const log = await AuditLog.create({
                ...validLogData,
                target: {
                    resourceType: 'kyc_request',
                    resourceId,
                    resourceIdentifier: 'KYC2024001'
                }
            });

            expect(log.target.resourceType).toBe('kyc_request');
            expect(log.target.resourceId.toString()).toBe(resourceId.toString());
            expect(log.target.resourceIdentifier).toBe('KYC2024001');
        });
    });

    describe('Request Details', () => {
        it('should store request metadata', async () => {
            const log = await AuditLog.create({
                ...validLogData,
                request: {
                    ipAddress: '192.168.1.100',
                    userAgent: 'Chrome/90.0',
                    deviceType: 'mobile',
                    method: 'POST',
                    endpoint: '/api/v1/kyc/submit'
                }
            });

            expect(log.request.ipAddress).toBe('192.168.1.100');
            expect(log.request.method).toBe('POST');
        });
    });

    describe('Blockchain Verification', () => {
        it('should default isVerified to false', async () => {
            const log = await AuditLog.create(validLogData);
            expect(log.blockchain.isVerified).toBe(false);
        });

        it('should store blockchain verification data', async () => {
            const log = await AuditLog.create({
                ...validLogData,
                blockchain: {
                    isVerified: true,
                    transactionHash: '0xabc123',
                    blockNumber: 12345
                }
            });

            expect(log.blockchain.isVerified).toBe(true);
            expect(log.blockchain.transactionHash).toBe('0xabc123');
        });
    });
});
