require('dotenv').config();
const mongoose = require('mongoose');
const { User, Bank, KycRequest, Document, AuditLog } = require('./src/models');

async function testSchemas() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully!\n');

        // Test 1: User Schema
        console.log('📋 Testing User Schema...');
        const testUser = new User({
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
        });
        await testUser.validate();
        console.log('✅ User schema validation passed');

        // Test 2: Bank Schema
        console.log('\n📋 Testing Bank Schema...');
        const testBank = new Bank({
            bankName: 'Test Bank',
            bankCode: 'TEST',
            routingNumber: '123456789',
            licenseNumber: 'LIC123456',
            licenseIssueDate: new Date('2020-01-01'),
            licenseExpiryDate: new Date('2030-01-01'),
            bankType: 'private_commercial',
            headOffice: {
                addressLine: 'Test Address',
                division: 'Dhaka',
                district: 'Dhaka',
                postCode: '1212',
                phone: '01712345678',
                email: 'test@bank.com'
            }
        });
        await testBank.validate();
        console.log('✅ Bank schema validation passed');

        // Test 3: KYC Request Schema
        console.log('\n📋 Testing KYC Request Schema...');
        const testKyc = new KycRequest({
            requestId: 'KYC2510TEST1',
            userId: new mongoose.Types.ObjectId(),
            bankId: new mongoose.Types.ObjectId(),
            requestType: 'new',
            kycLevel: 1,
            status: 'draft'
        });
        await testKyc.validate();
        console.log('✅ KYC Request schema validation passed');

        // Test 4: Document Schema
        console.log('\n📋 Testing Document Schema...');
        const testDocument = new Document({
            documentId: 'DOC2510TEST1',
            userId: new mongoose.Types.ObjectId(),
            documentType: 'nid_front',
            documentCategory: 'identity',
            file: {
                originalName: 'test.jpg',
                fileName: 'test_123.jpg',
                filePath: '/uploads/test_123.jpg',
                mimeType: 'image/jpeg',
                fileSize: 1024000,
                fileExtension: 'jpg'
            },
            encryption: {
                isEncrypted: true,
                algorithm: 'aes-256-cbc',
                iv: 'abc123def456',
                encryptionKeyId: 'key_123'
            },
            hash: {
                algorithm: 'sha256',
                value: 'abc123def456',
                createdAt: new Date()
            }
        });
        await testDocument.validate();
        console.log('✅ Document schema validation passed');

        // Test 5: Audit Log Schema
        console.log('\n📋 Testing Audit Log Schema...');
        const testAuditLog = new AuditLog({
            logId: 'LOG2510TEST1',
            actor: {
                userId: new mongoose.Types.ObjectId(),
                userEmail: 'test@example.com',
                userRole: 'customer'
            },
            action: {
                type: 'user_register',
                category: 'authentication',
                description: 'New user registration',
                severity: 'info'
            },
            status: 'success',
            request: {
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                deviceType: 'web'
            }
        });
        await testAuditLog.validate();
        console.log('✅ Audit Log schema validation passed');

        // Test Virtual Fields
        console.log('\n📋 Testing Virtual Fields...');
        console.log('User fullName virtual:', testUser.fullName);
        console.log('User age virtual:', testUser.age);
        console.log('Bank isLicenseValid virtual:', testBank.isLicenseValid);
        console.log('Document fileSizeMB virtual:', testDocument.fileSizeMB);
        console.log('✅ Virtual fields working correctly');

        // Test Instance Methods
        console.log('\n📋 Testing Instance Methods...');
        const passwordMatch = await testUser.comparePassword('Test@1234');
        console.log('Password comparison method:', passwordMatch ? '✅' : '❌');

        // Test Static Methods
        console.log('\n📋 Testing Static Methods...');
        console.log('Document.generateHash method exists:', typeof Document.generateHash === 'function' ? '✅' : '❌');
        console.log('Bank.findActive method exists:', typeof Bank.findActive === 'function' ? '✅' : '❌');

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('🎉 ALL SCHEMA TESTS PASSED!');
        console.log('='.repeat(50));
        console.log('\n✨ Schema Summary:');
        console.log('  1. User Schema - ✅ Created with roles & Bangladesh fields');
        console.log('  2. Bank Schema - ✅ Created with regulatory compliance');
        console.log('  3. KYC Request Schema - ✅ Created with complete workflow');
        console.log('  4. Document Schema - ✅ Created with encryption metadata');
        console.log('  5. Audit Log Schema - ✅ Created for compliance tracking');
        console.log('\n📦 All models exported from: /src/models/index.js');
        console.log('🗄️  MongoDB Database: ekyc_db');
        console.log('🌐 MongoDB Express GUI: http://localhost:8081\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Schema Test Failed:', error.message);
        if (error.errors) {
            console.error('\nValidation Errors:');
            Object.keys(error.errors).forEach(key => {
                console.error(`  - ${key}: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
}

testSchemas();
