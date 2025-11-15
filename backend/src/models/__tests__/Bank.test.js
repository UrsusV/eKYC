const mongoose = require('mongoose');
const Bank = require('../Bank');
const { connect, closeDatabase, clearDatabase } = require('./testSetup');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Bank Model', () => {
    const validBankData = {
        bankName: 'Test Bank Limited',
        bankNameBangla: 'টেস্ট ব্যাংক লিমিটেড',
        bankCode: 'TEST',
        swiftCode: 'TESTBDDH',
        routingNumber: '123456789',
        licenseNumber: 'BB/2024/001',
        licenseIssueDate: new Date('2020-01-01'),
        licenseExpiryDate: new Date('2030-01-01'),
        bankType: 'private_commercial',
        headOffice: {
            addressLine: 'Test Address, Dhaka',
            division: 'Dhaka',
            district: 'Dhaka',
            postCode: '1212',
            phone: '02-9566371',
            email: 'info@testbank.com',
            website: 'https://www.testbank.com'
        }
    };

    describe('Schema Validation', () => {
        it('should create a valid bank', async () => {
            const bank = await Bank.create(validBankData);

            expect(bank._id).toBeDefined();
            expect(bank.bankName).toBe('Test Bank Limited');
            expect(bank.bankCode).toBe('TEST');
        });

        it('should require bank name', async () => {
            const bank = new Bank({ ...validBankData, bankName: undefined });
            await expect(bank.save()).rejects.toThrow(/Bank name is required/);
        });

        it('should require bank code', async () => {
            const bank = new Bank({ ...validBankData, bankCode: undefined });
            await expect(bank.save()).rejects.toThrow(/Bank code is required/);
        });

        it('should require routing number', async () => {
            const bank = new Bank({ ...validBankData, routingNumber: undefined });
            await expect(bank.save()).rejects.toThrow(/Routing number is required/);
        });

        it('should enforce unique bank name', async () => {
            await Bank.create(validBankData);
            const duplicate = new Bank(validBankData);
            await expect(duplicate.save()).rejects.toThrow(/duplicate key/);
        });

        it('should enforce unique bank code', async () => {
            await Bank.create(validBankData);
            const duplicate = new Bank({
                ...validBankData,
                bankName: 'Different Bank',
                licenseNumber: 'BB/2024/002'
            });
            await expect(duplicate.save()).rejects.toThrow(/duplicate key/);
        });

        it('should uppercase bank code', async () => {
            const bank = await Bank.create({ ...validBankData, bankCode: 'dbbl' });
            expect(bank.bankCode).toBe('DBBL');
        });
    });

    describe('Bank Code Validation', () => {
        it('should accept 4-letter bank code', async () => {
            const bank = await Bank.create({ ...validBankData, bankCode: 'DBBL' });
            expect(bank.bankCode).toBe('DBBL');
        });

        it('should reject bank code not 4 letters', async () => {
            const bank = new Bank({ ...validBankData, bankCode: 'AB' });
            await expect(bank.save()).rejects.toThrow(/Bank code must be 4 uppercase letters/);
        });

        it('should reject bank code with numbers', async () => {
            const bank = new Bank({ ...validBankData, bankCode: 'AB12' });
            await expect(bank.save()).rejects.toThrow(/Bank code must be 4 uppercase letters/);
        });
    });

    describe('SWIFT Code Validation', () => {
        it('should accept valid 8-character SWIFT code', async () => {
            const bank = await Bank.create({
                ...validBankData,
                swiftCode: 'TESTBDDH'
            });
            expect(bank.swiftCode).toBe('TESTBDDH');
        });

        it('should accept valid 11-character SWIFT code', async () => {
            const bank = await Bank.create({
                ...validBankData,
                swiftCode: 'TESTBDDH001'
            });
            expect(bank.swiftCode).toBe('TESTBDDH001');
        });

        it('should reject invalid SWIFT code format', async () => {
            const bank = new Bank({
                ...validBankData,
                swiftCode: 'INVALID'
            });
            await expect(bank.save()).rejects.toThrow(/Invalid SWIFT code/);
        });

        it('should uppercase SWIFT code', async () => {
            const bank = await Bank.create({
                ...validBankData,
                swiftCode: 'testbddh'
            });
            expect(bank.swiftCode).toBe('TESTBDDH');
        });
    });

    describe('Routing Number Validation', () => {
        it('should accept 9-digit routing number', async () => {
            const bank = await Bank.create({ ...validBankData, routingNumber: '090271626' });
            expect(bank.routingNumber).toBe('090271626');
        });

        it('should reject routing number not 9 digits', async () => {
            const bank = new Bank({ ...validBankData, routingNumber: '12345' });
            await expect(bank.save()).rejects.toThrow(/Routing number must be 9 digits/);
        });

        it('should reject routing number with letters', async () => {
            const bank = new Bank({ ...validBankData, routingNumber: '12345678A' });
            await expect(bank.save()).rejects.toThrow(/Routing number must be 9 digits/);
        });

        it('should enforce unique routing number', async () => {
            await Bank.create(validBankData);
            const duplicate = new Bank({
                ...validBankData,
                bankName: 'Different Bank',
                bankCode: 'DIFF',
                licenseNumber: 'BB/2024/002'
            });
            await expect(duplicate.save()).rejects.toThrow(/duplicate key/);
        });
    });

    describe('License Validation', () => {
        it('should require license number', async () => {
            const bank = new Bank({ ...validBankData, licenseNumber: undefined });
            await expect(bank.save()).rejects.toThrow(/Bangladesh Bank license number is required/);
        });

        it('should require license issue date', async () => {
            const bank = new Bank({ ...validBankData, licenseIssueDate: undefined });
            await expect(bank.save()).rejects.toThrow(/required/);
        });

        it('should require license expiry date', async () => {
            const bank = new Bank({ ...validBankData, licenseExpiryDate: undefined });
            await expect(bank.save()).rejects.toThrow(/required/);
        });

        it('should reject expiry date before issue date', async () => {
            const bank = new Bank({
                ...validBankData,
                licenseIssueDate: new Date('2025-01-01'),
                licenseExpiryDate: new Date('2024-01-01')
            });
            await expect(bank.save()).rejects.toThrow(/License expiry date must be after issue date/);
        });
    });

    describe('Bank Type Validation', () => {
        it('should accept valid bank types', async () => {
            const types = [
                'state_owned_commercial',
                'specialized',
                'private_commercial',
                'foreign_commercial',
                'islamic_bank',
                'non_banking_financial'
            ];

            for (const type of types) {
                const bank = await Bank.create({
                    ...validBankData,
                    bankName: `Test ${type}`,
                    bankCode: type.substring(0, 4).toUpperCase(),
                    routingNumber: Math.random().toString().substring(2, 11),
                    licenseNumber: `BB/2024/${Math.floor(Math.random() * 1000)}`,
                    bankType: type
                });
                expect(bank.bankType).toBe(type);
            }
        });

        it('should reject invalid bank type', async () => {
            const bank = new Bank({ ...validBankData, bankType: 'invalid_type' });
            await expect(bank.save()).rejects.toThrow(/not a valid bank type/);
        });
    });

    describe('Head Office Information', () => {
        it('should require head office address', async () => {
            const bank = new Bank({
                ...validBankData,
                headOffice: { ...validBankData.headOffice, addressLine: undefined }
            });
            await expect(bank.save()).rejects.toThrow(/required/);
        });

        it('should require valid division', async () => {
            const divisions = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'];

            for (const division of divisions) {
                const bank = await Bank.create({
                    ...validBankData,
                    bankName: `Test ${division}`,
                    bankCode: division.substring(0, 4).toUpperCase(),
                    routingNumber: Math.random().toString().substring(2, 11),
                    licenseNumber: `BB/2024/${Math.floor(Math.random() * 1000)}`,
                    headOffice: {
                        ...validBankData.headOffice,
                        division
                    }
                });
                expect(bank.headOffice.division).toBe(division);
            }
        });

        it('should validate post code format', async () => {
            const bank = new Bank({
                ...validBankData,
                headOffice: {
                    ...validBankData.headOffice,
                    postCode: '123'
                }
            });
            await expect(bank.save()).rejects.toThrow(/Post code must be 4 digits/);
        });

        it('should validate phone number', async () => {
            const bank = new Bank({
                ...validBankData,
                headOffice: {
                    ...validBankData.headOffice,
                    phone: 'invalid'
                }
            });
            await expect(bank.save()).rejects.toThrow(/Invalid Bangladesh phone number/);
        });

        it('should validate email format', async () => {
            const bank = new Bank({
                ...validBankData,
                headOffice: {
                    ...validBankData.headOffice,
                    email: 'invalid-email'
                }
            });
            await expect(bank.save()).rejects.toThrow(/valid email/);
        });

        it('should validate website URL', async () => {
            const bank = new Bank({
                ...validBankData,
                headOffice: {
                    ...validBankData.headOffice,
                    website: 'not-a-url'
                }
            });
            await expect(bank.save()).rejects.toThrow(/Invalid URL/);
        });
    });

    describe('Branch Statistics', () => {
        it('should default statistics to 0', async () => {
            const bank = await Bank.create(validBankData);
            expect(bank.totalBranches).toBe(0);
            expect(bank.totalAgents).toBe(0);
            expect(bank.totalAtms).toBe(0);
        });

        it('should not accept negative values', async () => {
            const bank = new Bank({ ...validBankData, totalBranches: -5 });
            await expect(bank.save()).rejects.toThrow();
        });
    });

    describe('Blockchain Integration', () => {
        it('should accept valid Ethereum address', async () => {
            const bank = await Bank.create({
                ...validBankData,
                blockchainIntegration: {
                    walletAddress: '0x1234567890123456789012345678901234567890',
                    isAuthorizedIssuer: true
                }
            });
            expect(bank.blockchainIntegration.walletAddress).toBe('0x1234567890123456789012345678901234567890');
        });

        it('should reject invalid Ethereum address', async () => {
            const bank = new Bank({
                ...validBankData,
                blockchainIntegration: {
                    walletAddress: 'invalid'
                }
            });
            await expect(bank.save()).rejects.toThrow(/Invalid Ethereum address/);
        });

        it('should lowercase wallet address', async () => {
            const bank = await Bank.create({
                ...validBankData,
                blockchainIntegration: {
                    walletAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'
                }
            });
            expect(bank.blockchainIntegration.walletAddress).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
        });

        it('should default isAuthorizedIssuer to false', async () => {
            const bank = await Bank.create(validBankData);
            expect(bank.blockchainIntegration.isAuthorizedIssuer).toBe(false);
        });
    });

    describe('Regulatory Compliance', () => {
        it('should accept valid compliance status', async () => {
            const statuses = ['compliant', 'non_compliant', 'under_review', 'suspended'];

            for (const status of statuses) {
                const bank = await Bank.create({
                    ...validBankData,
                    bankName: `Test ${status}`,
                    bankCode: status.substring(0, 4).toUpperCase(),
                    routingNumber: Math.random().toString().substring(2, 11),
                    licenseNumber: `BB/2024/${Math.floor(Math.random() * 1000)}`,
                    regulatory: {
                        complianceStatus: status
                    }
                });
                expect(bank.regulatory.complianceStatus).toBe(status);
            }
        });

        it('should default compliance status to under_review', async () => {
            const bank = await Bank.create(validBankData);
            expect(bank.regulatory.complianceStatus).toBe('under_review');
        });

        it('should default compliance flags to false', async () => {
            const bank = await Bank.create(validBankData);
            expect(bank.regulatory.amlCompliant).toBe(false);
            expect(bank.regulatory.cftCompliant).toBe(false);
            expect(bank.regulatory.kycCompliant).toBe(false);
        });
    });

    describe('KYC Statistics', () => {
        it('should default all statistics to 0', async () => {
            const bank = await Bank.create(validBankData);
            expect(bank.statistics.totalCustomers).toBe(0);
            expect(bank.statistics.totalKycRequests).toBe(0);
            expect(bank.statistics.approvedKycRequests).toBe(0);
            expect(bank.statistics.rejectedKycRequests).toBe(0);
            expect(bank.statistics.pendingKycRequests).toBe(0);
        });

        it('should not accept negative statistics', async () => {
            const bank = new Bank({
                ...validBankData,
                statistics: {
                    totalKycRequests: -1
                }
            });
            await expect(bank.save()).rejects.toThrow();
        });
    });

    describe('Virtual Fields', () => {
        it('should return isLicenseValid as true for valid license', async () => {
            const bank = await Bank.create({
                ...validBankData,
                licenseExpiryDate: new Date('2030-12-31')
            });
            expect(bank.isLicenseValid).toBe(true);
        });

        it('should return isLicenseValid as false for expired license', async () => {
            const bank = await Bank.create({
                ...validBankData,
                licenseExpiryDate: new Date('2020-01-01')
            });
            expect(bank.isLicenseValid).toBe(false);
        });

        it('should calculate KYC approval rate correctly', async () => {
            const bank = await Bank.create({
                ...validBankData,
                statistics: {
                    totalKycRequests: 100,
                    approvedKycRequests: 85
                }
            });
            expect(bank.kycApprovalRate).toBe('85.00');
        });

        it('should return 0 approval rate when no requests', async () => {
            const bank = await Bank.create(validBankData);
            expect(bank.kycApprovalRate).toBe('0');
        });
    });

    describe('Static Methods', () => {
        describe('findActive', () => {
            it('should find active and verified banks', async () => {
                await Bank.create({ ...validBankData, isActive: true, isVerified: true });
                await Bank.create({
                    ...validBankData,
                    bankName: 'Inactive Bank',
                    bankCode: 'INAC',
                    routingNumber: '987654321',
                    licenseNumber: 'BB/2024/002',
                    isActive: false,
                    isVerified: true
                });
                await Bank.create({
                    ...validBankData,
                    bankName: 'Unverified Bank',
                    bankCode: 'UNVE',
                    routingNumber: '111111111',
                    licenseNumber: 'BB/2024/003',
                    isActive: true,
                    isVerified: false
                });

                const activeBanks = await Bank.findActive();
                expect(activeBanks.length).toBe(1);
                expect(activeBanks[0].bankName).toBe('Test Bank Limited');
            });
        });

        describe('findAuthorizedIssuers', () => {
            it('should find authorized blockchain issuers', async () => {
                await Bank.create({
                    ...validBankData,
                    isActive: true,
                    blockchainIntegration: {
                        isAuthorizedIssuer: true
                    }
                });
                await Bank.create({
                    ...validBankData,
                    bankName: 'Unauthorized Bank',
                    bankCode: 'UNAU',
                    routingNumber: '987654321',
                    licenseNumber: 'BB/2024/002',
                    isActive: true,
                    blockchainIntegration: {
                        isAuthorizedIssuer: false
                    }
                });

                const authorizedBanks = await Bank.findAuthorizedIssuers();
                expect(authorizedBanks.length).toBe(1);
                expect(authorizedBanks[0].blockchainIntegration.isAuthorizedIssuer).toBe(true);
            });
        });
    });

    describe('Instance Methods', () => {
        describe('updateKycStats', () => {
            it('should increment total KYC requests', async () => {
                const bank = await Bank.create(validBankData);
                await bank.updateKycStats('pending');

                const updated = await Bank.findById(bank._id);
                expect(updated.statistics.totalKycRequests).toBe(1);
            });

            it('should increment approved requests', async () => {
                const bank = await Bank.create(validBankData);
                await bank.updateKycStats('approved');

                const updated = await Bank.findById(bank._id);
                expect(updated.statistics.approvedKycRequests).toBe(1);
                expect(updated.statistics.totalKycRequests).toBe(1);
            });

            it('should increment rejected requests', async () => {
                const bank = await Bank.create(validBankData);
                await bank.updateKycStats('rejected');

                const updated = await Bank.findById(bank._id);
                expect(updated.statistics.rejectedKycRequests).toBe(1);
                expect(updated.statistics.totalKycRequests).toBe(1);
            });

            it('should increment pending requests', async () => {
                const bank = await Bank.create(validBankData);
                await bank.updateKycStats('pending');

                const updated = await Bank.findById(bank._id);
                expect(updated.statistics.pendingKycRequests).toBe(1);
                expect(updated.statistics.totalKycRequests).toBe(1);
            });
        });
    });

    describe('Status Flags', () => {
        it('should default isActive to true', async () => {
            const bank = await Bank.create(validBankData);
            expect(bank.isActive).toBe(true);
        });

        it('should default isVerified to false', async () => {
            const bank = await Bank.create(validBankData);
            expect(bank.isVerified).toBe(false);
        });

        it('should track verification timestamp', async () => {
            const bank = await Bank.create({
                ...validBankData,
                isVerified: true,
                verifiedAt: new Date()
            });
            expect(bank.verifiedAt).toBeInstanceOf(Date);
        });
    });

    describe('Timestamps', () => {
        it('should add createdAt and updatedAt', async () => {
            const bank = await Bank.create(validBankData);
            expect(bank.createdAt).toBeInstanceOf(Date);
            expect(bank.updatedAt).toBeInstanceOf(Date);
        });

        it('should update updatedAt on modification', async () => {
            const bank = await Bank.create(validBankData);
            const originalUpdatedAt = bank.updatedAt;

            await new Promise(resolve => setTimeout(resolve, 100));

            bank.bankName = 'Updated Bank Name';
            await bank.save();

            expect(bank.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });
});
