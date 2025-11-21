const {
    registerCustomerSchema,
    registerBankOfficerSchema,
    loginSchema,
    refreshTokenSchema
} = require('../authValidators');

describe('Auth Validators', () => {
    describe('registerCustomerSchema', () => {
        const validData = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'SecurePass123',
            nid_number: '1234567890'
        };

        it('should validate correct customer registration data', () => {
            const { error, value } = registerCustomerSchema.validate(validData);
            expect(error).toBeUndefined();
            expect(value.email).toBe('john@example.com');
            expect(value.name).toBe('John Doe');
        });

        it('should convert email to lowercase', () => {
            const data = { ...validData, email: 'JOHN@EXAMPLE.COM' };
            const { error, value } = registerCustomerSchema.validate(data);
            expect(error).toBeUndefined();
            expect(value.email).toBe('john@example.com');
        });

        describe('name validation', () => {
            it('should reject name shorter than 2 characters', () => {
                const data = { ...validData, name: 'J' };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('at least 2 characters');
            });

            it('should reject name longer than 100 characters', () => {
                const data = { ...validData, name: 'a'.repeat(101) };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('cannot exceed 100 characters');
            });

            it('should reject missing name', () => {
                const data = { ...validData };
                delete data.name;
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('Name is required');
            });

            it('should trim whitespace from name', () => {
                const data = { ...validData, name: '  John Doe  ' };
                const { error, value } = registerCustomerSchema.validate(data);
                expect(error).toBeUndefined();
                expect(value.name).toBe('John Doe');
            });
        });

        describe('email validation', () => {
            it('should reject invalid email format', () => {
                const data = { ...validData, email: 'invalid-email' };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('valid email');
            });

            it('should reject missing email', () => {
                const data = { ...validData };
                delete data.email;
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('Email is required');
            });

            it('should accept valid email formats', () => {
                const validEmails = [
                    'test@example.com',
                    'user.name@example.com',
                    'user+tag@example.co.uk'
                ];

                validEmails.forEach(email => {
                    const data = { ...validData, email };
                    const { error } = registerCustomerSchema.validate(data);
                    expect(error).toBeUndefined();
                });
            });
        });

        describe('password validation', () => {
            it('should reject password shorter than 8 characters', () => {
                const data = { ...validData, password: 'Pass1' };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('at least 8 characters');
            });

            it('should reject password without uppercase letter', () => {
                const data = { ...validData, password: 'password123' };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('uppercase letter');
            });

            it('should reject password without lowercase letter', () => {
                const data = { ...validData, password: 'PASSWORD123' };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('lowercase letter');
            });

            it('should reject password without number', () => {
                const data = { ...validData, password: 'PasswordOnly' };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('number');
            });

            it('should reject password longer than 128 characters', () => {
                const data = { ...validData, password: 'A1' + 'a'.repeat(127) };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('cannot exceed 128 characters');
            });

            it('should accept valid strong passwords', () => {
                const validPasswords = [
                    'SecurePass123',
                    'MyP@ssw0rd',
                    'Test1234Password'
                ];

                validPasswords.forEach(password => {
                    const data = { ...validData, password };
                    const { error } = registerCustomerSchema.validate(data);
                    expect(error).toBeUndefined();
                });
            });
        });

        describe('nid_number validation', () => {
            it('should accept 10 digit NID', () => {
                const data = { ...validData, nid_number: '1234567890' };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeUndefined();
            });

            it('should accept 13 digit NID', () => {
                const data = { ...validData, nid_number: '1234567890123' };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeUndefined();
            });

            it('should accept 17 digit NID', () => {
                const data = { ...validData, nid_number: '12345678901234567' };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeUndefined();
            });

            it('should reject NID with invalid length', () => {
                const invalidNIDs = ['123', '12345', '12345678901', '123456789012345'];

                invalidNIDs.forEach(nid_number => {
                    const data = { ...validData, nid_number };
                    const { error } = registerCustomerSchema.validate(data);
                    expect(error).toBeDefined();
                    expect(error.details[0].message).toContain('10, 13, or 17 digits');
                });
            });

            it('should reject NID with non-numeric characters', () => {
                const data = { ...validData, nid_number: '123456789A' };
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
            });

            it('should reject missing NID', () => {
                const data = { ...validData };
                delete data.nid_number;
                const { error } = registerCustomerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('NID number is required');
            });
        });
    });

    describe('registerBankOfficerSchema', () => {
        const validData = {
            name: 'Jane Smith',
            email: 'jane@bank.com',
            password: 'BankPass123',
            bank_id: '507f1f77bcf86cd799439011',
            officer_id: 'OFF12345'
        };

        it('should validate correct bank officer registration data', () => {
            const { error, value } = registerBankOfficerSchema.validate(validData);
            expect(error).toBeUndefined();
            expect(value.email).toBe('jane@bank.com');
        });

        describe('bank_id validation', () => {
            it('should accept valid MongoDB ObjectId', () => {
                const validIds = [
                    '507f1f77bcf86cd799439011',
                    '507f191e810c19729de860ea',
                    '000000000000000000000000'
                ];

                validIds.forEach(bank_id => {
                    const data = { ...validData, bank_id };
                    const { error } = registerBankOfficerSchema.validate(data);
                    expect(error).toBeUndefined();
                });
            });

            it('should reject invalid MongoDB ObjectId', () => {
                const invalidIds = [
                    'invalid-id',
                    '12345',
                    'not-a-valid-objectid',
                    '507f1f77bcf86cd79943901' // too short
                ];

                invalidIds.forEach(bank_id => {
                    const data = { ...validData, bank_id };
                    const { error } = registerBankOfficerSchema.validate(data);
                    expect(error).toBeDefined();
                    expect(error.details[0].message).toContain('Invalid Bank ID');
                });
            });

            it('should reject missing bank_id', () => {
                const data = { ...validData };
                delete data.bank_id;
                const { error } = registerBankOfficerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('Bank ID is required');
            });
        });

        describe('officer_id validation', () => {
            it('should accept valid alphanumeric officer IDs', () => {
                const validIds = ['OFF123', 'BANK001', 'Officer2024'];

                validIds.forEach(officer_id => {
                    const data = { ...validData, officer_id };
                    const { error } = registerBankOfficerSchema.validate(data);
                    expect(error).toBeUndefined();
                });
            });

            it('should reject officer_id shorter than 3 characters', () => {
                const data = { ...validData, officer_id: 'AB' };
                const { error } = registerBankOfficerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('at least 3 characters');
            });

            it('should reject officer_id longer than 50 characters', () => {
                const data = { ...validData, officer_id: 'A'.repeat(51) };
                const { error } = registerBankOfficerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('cannot exceed 50 characters');
            });

            it('should reject officer_id with special characters', () => {
                const invalidIds = ['OFF-123', 'BANK@001', 'Officer#2024'];

                invalidIds.forEach(officer_id => {
                    const data = { ...validData, officer_id };
                    const { error } = registerBankOfficerSchema.validate(data);
                    expect(error).toBeDefined();
                    expect(error.details[0].message).toContain('alphanumeric');
                });
            });

            it('should reject missing officer_id', () => {
                const data = { ...validData };
                delete data.officer_id;
                const { error } = registerBankOfficerSchema.validate(data);
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('Officer ID is required');
            });
        });
    });

    describe('loginSchema', () => {
        const validData = {
            email: 'user@example.com',
            password: 'password123'
        };

        it('should validate correct login data', () => {
            const { error, value } = loginSchema.validate(validData);
            expect(error).toBeUndefined();
            expect(value.email).toBe('user@example.com');
        });

        it('should convert email to lowercase', () => {
            const data = { ...validData, email: 'USER@EXAMPLE.COM' };
            const { error, value } = loginSchema.validate(data);
            expect(error).toBeUndefined();
            expect(value.email).toBe('user@example.com');
        });

        it('should reject invalid email', () => {
            const data = { ...validData, email: 'invalid-email' };
            const { error } = loginSchema.validate(data);
            expect(error).toBeDefined();
            expect(error.details[0].message).toContain('valid email');
        });

        it('should reject missing email', () => {
            const data = { password: 'password123' };
            const { error } = loginSchema.validate(data);
            expect(error).toBeDefined();
            expect(error.details[0].message).toContain('Email is required');
        });

        it('should reject missing password', () => {
            const data = { email: 'user@example.com' };
            const { error } = loginSchema.validate(data);
            expect(error).toBeDefined();
            expect(error.details[0].message).toContain('Password is required');
        });

        it('should accept any password (no strength requirements for login)', () => {
            const passwords = ['weak', 'short', '123', 'anypassword'];

            passwords.forEach(password => {
                const data = { ...validData, password };
                const { error } = loginSchema.validate(data);
                expect(error).toBeUndefined();
            });
        });
    });

    describe('refreshTokenSchema', () => {
        it('should validate correct refresh token data', () => {
            const data = { refreshToken: 'valid.jwt.token' };
            const { error } = refreshTokenSchema.validate(data);
            expect(error).toBeUndefined();
        });

        it('should reject missing refresh token', () => {
            const data = {};
            const { error } = refreshTokenSchema.validate(data);
            expect(error).toBeDefined();
            expect(error.details[0].message).toContain('Refresh token is required');
        });

        it('should reject empty refresh token', () => {
            const data = { refreshToken: '' };
            const { error } = refreshTokenSchema.validate(data);
            expect(error).toBeDefined();
        });
    });
});
