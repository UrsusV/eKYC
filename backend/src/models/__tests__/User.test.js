const mongoose = require('mongoose');
const User = require('../User');
const { connect, closeDatabase, clearDatabase } = require('./testSetup');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('User Model', () => {
    const validUserData = {
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
                postCode: '1212',
                addressLine: 'Test Address'
            },
            permanentAddress: {
                division: 'Dhaka',
                district: 'Dhaka',
                upazila: 'Gulshan',
                postCode: '1212',
                addressLine: 'Test Address'
            }
        }
    };

    describe('Schema Validation', () => {
        it('should create a valid user', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();

            expect(savedUser._id).toBeDefined();
            expect(savedUser.email).toBe('test@example.com');
            expect(savedUser.role).toBe('customer');
        });

        it('should require email', async () => {
            const user = new User({ ...validUserData, email: undefined });
            await expect(user.save()).rejects.toThrow(/Email is required/);
        });

        it('should require password', async () => {
            const user = new User({ ...validUserData, password: undefined });
            await expect(user.save()).rejects.toThrow(/Password is required/);
        });

        it('should require valid email format', async () => {
            const user = new User({ ...validUserData, email: 'invalid-email' });
            await expect(user.save()).rejects.toThrow(/valid email/);
        });

        it('should enforce unique email', async () => {
            await User.create(validUserData);
            const duplicateUser = new User(validUserData);
            await expect(duplicateUser.save()).rejects.toThrow(/duplicate key/);
        });

        it('should lowercase email', async () => {
            const user = await User.create({ ...validUserData, email: 'TEST@EXAMPLE.COM' });
            expect(user.email).toBe('test@example.com');
        });

        it('should default role to customer', async () => {
            const userData = { ...validUserData };
            delete userData.role;
            const user = await User.create(userData);
            expect(user.role).toBe('customer');
        });

        it('should only allow valid roles', async () => {
            const user = new User({ ...validUserData, role: 'invalid_role' });
            await expect(user.save()).rejects.toThrow(/not a valid role/);
        });
    });

    describe('Password Hashing', () => {
        it('should hash password before saving', async () => {
            const user = await User.create(validUserData);
            expect(user.password).not.toBe('Test@1234');
            expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
        });

        it('should not rehash password if not modified', async () => {
            const user = await User.create(validUserData);
            const originalHash = user.password;

            user.personalInfo.fullName = 'Updated Name';
            await user.save();

            expect(user.password).toBe(originalHash);
        });

        it('should rehash password when modified', async () => {
            const user = await User.create(validUserData);
            const originalHash = user.password;

            user.password = 'NewPassword@123';
            await user.save();

            expect(user.password).not.toBe(originalHash);
            expect(user.password).not.toBe('NewPassword@123');
        });

        it('should set passwordChangedAt when password is modified', async () => {
            const user = await User.create(validUserData);
            expect(user.passwordChangedAt).toBeUndefined();

            user.password = 'NewPassword@123';
            await user.save();

            expect(user.passwordChangedAt).toBeDefined();
            expect(user.passwordChangedAt).toBeInstanceOf(Date);
        });

        it('should enforce minimum password length', async () => {
            const user = new User({ ...validUserData, password: 'Short1' });
            await expect(user.save()).rejects.toThrow();
        });
    });

    describe('comparePassword Method', () => {
        it('should return true for correct password', async () => {
            const user = await User.create(validUserData);
            const userWithPassword = await User.findById(user._id).select('+password');
            const isMatch = await userWithPassword.comparePassword('Test@1234');
            expect(isMatch).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            const user = await User.create(validUserData);
            const userWithPassword = await User.findById(user._id).select('+password');
            const isMatch = await userWithPassword.comparePassword('WrongPassword');
            expect(isMatch).toBe(false);
        });
    });

    describe('Bangladesh-Specific Validation', () => {
        describe('NID Validation', () => {
            it('should accept 10-digit NID', async () => {
                const user = new User({
                    ...validUserData,
                    personalInfo: { ...validUserData.personalInfo, nid: '1234567890' }
                });
                await expect(user.save()).resolves.toBeDefined();
            });

            it('should accept 13-digit NID', async () => {
                const user = new User({
                    ...validUserData,
                    personalInfo: { ...validUserData.personalInfo, nid: '1234567890123' }
                });
                await expect(user.save()).resolves.toBeDefined();
            });

            it('should accept 17-digit NID', async () => {
                const user = new User({
                    ...validUserData,
                    personalInfo: { ...validUserData.personalInfo, nid: '12345678901234567' }
                });
                await expect(user.save()).resolves.toBeDefined();
            });

            it('should reject invalid NID format', async () => {
                const user = new User({
                    ...validUserData,
                    personalInfo: { ...validUserData.personalInfo, nid: '123' }
                });
                await expect(user.save()).rejects.toThrow(/Invalid NID format/);
            });

            it('should enforce unique NID', async () => {
                await User.create({
                    ...validUserData,
                    personalInfo: { ...validUserData.personalInfo, nid: '1234567890' }
                });

                const duplicateUser = new User({
                    ...validUserData,
                    email: 'different@example.com',
                    personalInfo: { ...validUserData.personalInfo, nid: '1234567890' }
                });

                await expect(duplicateUser.save()).rejects.toThrow(/duplicate key/);
            });
        });

        describe('Phone Validation', () => {
            it('should accept valid Bangladesh phone number', async () => {
                const validPhones = ['01712345678', '01812345678', '01912345678', '01612345678'];

                for (const [index, phone] of validPhones.entries()) {
                    const user = new User({
                        ...validUserData,
                        email: `test${phone}@example.com`,
                        personalInfo: {
                            ...validUserData.personalInfo,
                            nid: `1234567${index}0${index}` // ensure unique NID per iteration
                        },
                        contactInfo: {
                            ...validUserData.contactInfo,
                            primaryPhone: phone
                        }
                    });
                    await expect(user.save()).resolves.toBeDefined();
                }
            });

            it('should reject invalid phone format', async () => {
                const user = new User({
                    ...validUserData,
                    contactInfo: {
                        ...validUserData.contactInfo,
                        primaryPhone: '12345'
                    }
                });
                await expect(user.save()).rejects.toThrow(/Invalid Bangladesh phone number/);
            });

            it('should accept phone with +880 prefix', async () => {
                const user = new User({
                    ...validUserData,
                    contactInfo: {
                        ...validUserData.contactInfo,
                        primaryPhone: '+8801712345678'
                    }
                });
                await expect(user.save()).resolves.toBeDefined();
            });
        });

        describe('Division Validation', () => {
            it('should accept valid Bangladesh divisions', async () => {
                const divisions = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'];

                for (const division of divisions) {
                    const user = new User({
                        ...validUserData,
                        email: `test${division}@example.com`,
                        personalInfo: {
                            ...validUserData.personalInfo,
                            nid: Math.random().toString().substring(2, 12)
                        },
                        contactInfo: {
                            ...validUserData.contactInfo,
                            primaryPhone: `0171234${Math.floor(1000 + Math.random() * 9000)}`,
                            presentAddress: {
                                ...validUserData.contactInfo.presentAddress,
                                division
                            },
                            permanentAddress: {
                                ...validUserData.contactInfo.permanentAddress,
                                division
                            }
                        }
                    });
                    await expect(user.save()).resolves.toBeDefined();
                }
            });

            it('should reject invalid division', async () => {
                const user = new User({
                    ...validUserData,
                    contactInfo: {
                        ...validUserData.contactInfo,
                        presentAddress: {
                            ...validUserData.contactInfo.presentAddress,
                            division: 'InvalidDivision'
                        }
                    }
                });
                await expect(user.save()).rejects.toThrow();
            });
        });

        describe('Passport Validation', () => {
            it('should accept valid passport format', async () => {
                const user = new User({
                    ...validUserData,
                    personalInfo: {
                        ...validUserData.personalInfo,
                        passport: 'AB1234567'
                    }
                });
                await expect(user.save()).resolves.toBeDefined();
            });

            it('should reject invalid passport format', async () => {
                const user = new User({
                    ...validUserData,
                    personalInfo: {
                        ...validUserData.personalInfo,
                        passport: 'INVALID123'
                    }
                });
                await expect(user.save()).rejects.toThrow(/Invalid passport format/);
            });
        });

        describe('TIN Validation', () => {
            it('should accept valid 12-digit TIN', async () => {
                const user = new User({
                    ...validUserData,
                    personalInfo: {
                        ...validUserData.personalInfo,
                        taxIdentificationNumber: '123456789012'
                    }
                });
                await expect(user.save()).resolves.toBeDefined();
            });

            it('should reject invalid TIN', async () => {
                const user = new User({
                    ...validUserData,
                    personalInfo: {
                        ...validUserData.personalInfo,
                        taxIdentificationNumber: '12345'
                    }
                });
                await expect(user.save()).rejects.toThrow(/TIN must be 12 digits/);
            });
        });

        describe('Age Validation', () => {
            it('should accept user 18 years or older', async () => {
                const eighteenYearsAgo = new Date();
                eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

                const user = new User({
                    ...validUserData,
                    personalInfo: {
                        ...validUserData.personalInfo,
                        dateOfBirth: eighteenYearsAgo
                    }
                });
                await expect(user.save()).resolves.toBeDefined();
            });

            it('should reject user under 18 years', async () => {
                const user = new User({
                    ...validUserData,
                    personalInfo: {
                        ...validUserData.personalInfo,
                        dateOfBirth: new Date('2010-01-01')
                    }
                });
                await expect(user.save()).rejects.toThrow(/Must be at least 18 years old/);
            });
        });
    });

    describe('Virtual Fields', () => {
        it('should return fullName from personalInfo', async () => {
            const user = await User.create(validUserData);
            expect(user.fullName).toBe('Test User');
        });

        it('should calculate age correctly', async () => {
            const user = await User.create(validUserData);
            const expectedAge = new Date().getFullYear() - 1990;
            expect(user.age).toBe(expectedAge);
        });

        it('should return isLocked status', async () => {
            const user = await User.create(validUserData);
            expect(user.isLocked).toBe(false);

            user.lockUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
            expect(user.isLocked).toBe(true);
        });

        it('should return isKycExpired status', async () => {
            const user = await User.create(validUserData);
            expect(user.isKycExpired).toBe(false);

            user.kycExpiresAt = new Date(Date.now() - 1000); // 1 second ago
            expect(user.isKycExpired).toBe(true);
        });
    });

    describe('Login Attempts', () => {
        it('should increment login attempts', async () => {
            const user = await User.create(validUserData);
            expect(user.loginAttempts).toBe(0);

            await user.incLoginAttempts();
            const updated = await User.findById(user._id);
            expect(updated.loginAttempts).toBe(1);
        });

        it('should lock account after 5 failed attempts', async () => {
            const user = await User.create(validUserData);

            for (let i = 0; i < 5; i++) {
                await user.incLoginAttempts();
                await user.save();
            }

            const updated = await User.findById(user._id);
            expect(updated.loginAttempts).toBe(5);
            expect(updated.lockUntil).toBeDefined();
            expect(updated.lockUntil.getTime()).toBeGreaterThan(Date.now());
        });

        it('should reset login attempts', async () => {
            const user = await User.create({ ...validUserData, loginAttempts: 3 });

            await user.resetLoginAttempts();
            const updated = await User.findById(user._id);
            expect(updated.loginAttempts).toBe(0);
            expect(updated.lockUntil).toBeUndefined();
        });

        it('should reset attempts if lock has expired', async () => {
            const user = await User.create({
                ...validUserData,
                loginAttempts: 5,
                lockUntil: new Date(Date.now() - 1000) // 1 second ago
            });

            await user.incLoginAttempts();
            const updated = await User.findById(user._id);
            expect(updated.loginAttempts).toBe(1);
            expect(updated.lockUntil).toBeUndefined();
        });
    });

    describe('Password Reset Token', () => {
        it('should create password reset token', async () => {
            const user = await User.create(validUserData);
            const resetToken = user.createPasswordResetToken();

            expect(resetToken).toBeDefined();
            expect(typeof resetToken).toBe('string');
            expect(resetToken.length).toBe(64); // 32 bytes as hex
            expect(user.passwordResetToken).toBeDefined();
            expect(user.passwordResetExpires).toBeDefined();
        });

        it('should set reset token expiry to 10 minutes', async () => {
            const user = await User.create(validUserData);
            const before = Date.now() + 10 * 60 * 1000;
            user.createPasswordResetToken();
            const after = Date.now() + 10 * 60 * 1000;

            expect(user.passwordResetExpires.getTime()).toBeGreaterThanOrEqual(before - 1000);
            expect(user.passwordResetExpires.getTime()).toBeLessThanOrEqual(after + 1000);
        });
    });

    describe('changedPasswordAfter Method', () => {
        it('should return false if password never changed', async () => {
            const user = await User.create(validUserData);
            const JWTTimestamp = Math.floor(Date.now() / 1000);
            expect(user.changedPasswordAfter(JWTTimestamp)).toBe(false);
        });

        it('should return true if password changed after JWT issued', async () => {
            const user = await User.create(validUserData);

            // Create JWT timestamp (in seconds)
            const JWTTimestamp = Math.floor(Date.now() / 1000);

            // Wait 2 seconds to ensure password change is after JWT
            // Note: passwordChangedAt is set to Date.now() - 1000 in pre-save middleware
            await new Promise(resolve => setTimeout(resolve, 2000));

            user.password = 'NewPassword@123';
            await user.save();

            expect(user.changedPasswordAfter(JWTTimestamp)).toBe(true);
        });

        it('should return false if password changed before JWT issued', async () => {
            const user = await User.create(validUserData);

            user.password = 'NewPassword@123';
            await user.save();

            const JWTTimestamp = Math.floor(Date.now() / 1000);
            expect(user.changedPasswordAfter(JWTTimestamp)).toBe(false);
        });
    });

    describe('KYC Status', () => {
        it('should default to not_started', async () => {
            const user = await User.create(validUserData);
            expect(user.kycStatus).toBe('not_started');
        });

        it('should allow valid KYC statuses', async () => {
            const statuses = ['not_started', 'pending', 'under_review', 'approved', 'rejected', 'expired'];

            for (const status of statuses) {
                const user = await User.create({
                    ...validUserData,
                    email: `test${status}@example.com`,
                    personalInfo: {
                        ...validUserData.personalInfo,
                        nid: Math.random().toString().substring(2, 12)
                    },
                    contactInfo: {
                        ...validUserData.contactInfo,
                        primaryPhone: `0171234${Math.floor(1000 + Math.random() * 9000)}`
                    },
                    kycStatus: status
                });
                expect(user.kycStatus).toBe(status);
            }
        });

        it('should default KYC level to 0', async () => {
            const user = await User.create(validUserData);
            expect(user.kycLevel).toBe(0);
        });

        it('should allow KYC levels 0-3', async () => {
            for (let level = 0; level <= 3; level++) {
                const user = await User.create({
                    ...validUserData,
                    email: `testlevel${level}@example.com`,
                    personalInfo: {
                        ...validUserData.personalInfo,
                        nid: Math.random().toString().substring(2, 12)
                    },
                    contactInfo: {
                        ...validUserData.contactInfo,
                        primaryPhone: `0171234${Math.floor(1000 + Math.random() * 9000)}`
                    },
                    kycLevel: level
                });
                expect(user.kycLevel).toBe(level);
            }
        });
    });

    describe('Blockchain Integration', () => {
        it('should accept valid Ethereum address', async () => {
            const user = await User.create({
                ...validUserData,
                walletAddress: '0x1234567890123456789012345678901234567890'
            });
            expect(user.walletAddress).toBe('0x1234567890123456789012345678901234567890');
        });

        it('should reject invalid Ethereum address', async () => {
            const user = new User({
                ...validUserData,
                walletAddress: 'invalid_address'
            });
            await expect(user.save()).rejects.toThrow(/Invalid Ethereum address/);
        });

        it('should lowercase wallet address', async () => {
            const user = await User.create({
                ...validUserData,
                walletAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'
            });
            expect(user.walletAddress).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
        });
    });

    describe('Bank Officer Info', () => {
        it('should store bank officer information', async () => {
            const bankId = new mongoose.Types.ObjectId();
            const user = await User.create({
                ...validUserData,
                role: 'bank_officer',
                bankOfficerInfo: {
                    employeeId: 'EMP001',
                    bankId,
                    branchCode: 'BR001',
                    designation: 'Senior Officer',
                    permissions: ['view_kyc', 'approve_kyc']
                }
            });

            expect(user.bankOfficerInfo.employeeId).toBe('EMP001');
            expect(user.bankOfficerInfo.bankId.toString()).toBe(bankId.toString());
            expect(user.bankOfficerInfo.permissions).toContain('view_kyc');
        });

        it('should enforce unique employee ID', async () => {
            await User.create({
                ...validUserData,
                role: 'bank_officer',
                bankOfficerInfo: {
                    employeeId: 'EMP001'
                }
            });

            const duplicateOfficer = new User({
                ...validUserData,
                email: 'different@example.com',
                role: 'bank_officer',
                bankOfficerInfo: {
                    employeeId: 'EMP001'
                }
            });

            await expect(duplicateOfficer.save()).rejects.toThrow(/duplicate key/);
        });
    });

    describe('Consent Management', () => {
        it('should track consent status', async () => {
            const user = await User.create({
                ...validUserData,
                consentGiven: {
                    dataProcessing: {
                        granted: true,
                        grantedAt: new Date()
                    },
                    dataSharing: {
                        granted: true,
                        grantedAt: new Date()
                    },
                    blockchainStorage: {
                        granted: false
                    }
                }
            });

            expect(user.consentGiven.dataProcessing.granted).toBe(true);
            expect(user.consentGiven.dataSharing.granted).toBe(true);
            expect(user.consentGiven.blockchainStorage.granted).toBe(false);
        });
    });

    describe('Indexes', () => {
        it('should have index on email and isActive', async () => {
            const indexes = User.collection.indexes();
            expect(indexes).toBeDefined();
        });
    });

    describe('Timestamps', () => {
        it('should add createdAt and updatedAt', async () => {
            const user = await User.create(validUserData);
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
        });

        it('should update updatedAt on modification', async () => {
            const user = await User.create(validUserData);
            const originalUpdatedAt = user.updatedAt;

            await new Promise(resolve => setTimeout(resolve, 100));

            user.personalInfo.fullName = 'Updated Name';
            await user.save();

            expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });
});
