require('dotenv').config();
const mongoose = require('mongoose');
const Bank = require('../src/models/Bank');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ekyc_db';

async function seedBanks() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connected\n');

        // Check if banks already exist
        const existingBanks = await Bank.find({});
        if (existingBanks.length > 0) {
            console.log(`⚠️  Found ${existingBanks.length} existing bank(s) in database:`);
            existingBanks.forEach(bank => {
                console.log(`   - ${bank.bankName} (${bank.bankCode}) - ID: ${bank._id}`);
            });
            console.log('\n💡 If you want to add more banks, you can run this script again.');
            console.log('💡 To reset banks, delete them first from the database.\n');
            await mongoose.disconnect();
            return;
        }

        console.log('📊 Creating banks...\n');

        // Create Dutch Bangla Bank
        const dutchBanglaBank = await Bank.create({
            bankName: 'Dutch Bangla Bank',
            bankCode: 'DBBL',
            swiftCode: 'DBBLBDDH',
            routingNumber: '090277261',
            licenseNumber: 'BB-LIC-2023-001',
            licenseIssueDate: new Date('2023-01-15'),
            licenseExpiryDate: new Date('2028-01-15'),
            bankType: 'private_commercial',
            headOffice: {
                addressLine: '100 Motijheel C/A',
                district: 'Dhaka',
                division: 'Dhaka',
                postCode: '1000',
                phone: '+88029559702',
                email: 'info@dutchbanglabank.com',
                website: 'https://www.dutchbanglabank.com'
            },
            blockchainIntegration: {
                walletAddress: '0x0000000000000000000000000000000000000001',
                isAuthorizedIssuer: true,
                authorizedAt: new Date()
            },
            regulatory: {
                complianceStatus: 'compliant',
                amlCompliant: true,
                kycCompliant: true
            },
            kycIntegration: {
                isEnabled: true,
                enabledAt: new Date()
            },
            isActive: true,
            isVerified: true
        });
        console.log(`✅ ${dutchBanglaBank.bankName} created`);
        console.log(`   Bank ID: ${dutchBanglaBank._id}`);
        console.log(`   Bank Code: ${dutchBanglaBank.bankCode}\n`);

        // Create BRAC Bank
        const bracBank = await Bank.create({
            bankName: 'BRAC Bank',
            bankCode: 'BRAC',
            swiftCode: 'BRACBDDH',
            routingNumber: '060240011',
            licenseNumber: 'BB-LIC-2023-002',
            licenseIssueDate: new Date('2023-01-15'),
            licenseExpiryDate: new Date('2028-01-15'),
            bankType: 'private_commercial',
            headOffice: {
                addressLine: 'BRAC Centre, 75 Mohakhali',
                district: 'Dhaka',
                division: 'Dhaka',
                postCode: '1212',
                phone: '+88096197777777',
                email: 'info@bracbank.com',
                website: 'https://www.bracbank.com'
            },
            blockchainIntegration: {
                walletAddress: '0x0000000000000000000000000000000000000002',
                isAuthorizedIssuer: true,
                authorizedAt: new Date()
            },
            regulatory: {
                complianceStatus: 'compliant',
                amlCompliant: true,
                kycCompliant: true
            },
            kycIntegration: {
                isEnabled: true,
                enabledAt: new Date()
            },
            isActive: true,
            isVerified: true
        });
        console.log(`✅ ${bracBank.bankName} created`);
        console.log(`   Bank ID: ${bracBank._id}`);
        console.log(`   Bank Code: ${bracBank.bankCode}\n`);

        // Create a test bank for development
        const testBank = await Bank.create({
            bankName: 'Test Bank',
            bankCode: 'TEST',
            swiftCode: 'TESTBD00',
            routingNumber: '123456789',
            licenseNumber: 'BB-LIC-TEST-001',
            licenseIssueDate: new Date('2020-01-01'),
            licenseExpiryDate: new Date('2030-01-01'),
            bankType: 'private_commercial',
            headOffice: {
                addressLine: '123 Test Street',
                district: 'Dhaka',
                division: 'Dhaka',
                postCode: '1000',
                phone: '+8801712345678',
                email: 'info@testbank.com'
            },
            blockchainIntegration: {
                walletAddress: '0x0000000000000000000000000000000000000003',
                isAuthorizedIssuer: true,
                authorizedAt: new Date()
            },
            regulatory: {
                complianceStatus: 'compliant',
                amlCompliant: true,
                kycCompliant: true
            },
            kycIntegration: {
                isEnabled: true,
                enabledAt: new Date()
            },
            isActive: true,
            isVerified: true
        });
        console.log(`✅ ${testBank.bankName} created`);
        console.log(`   Bank ID: ${testBank._id}`);
        console.log(`   Bank Code: ${testBank.bankCode}\n`);

        console.log('✅ Successfully seeded banks!\n');
        console.log('📋 Summary:');
        console.log(`   Total banks created: 3`);
        console.log(`   - Dutch Bangla Bank (DBBL)`);
        console.log(`   - BRAC Bank (BRAC)`);
        console.log(`   - Test Bank (TEST)\n`);
        console.log('💡 You can now register bank officers using these bank IDs.\n');

    } catch (error) {
        console.error('❌ Error seeding banks:', error);
        if (error.code === 11000) {
            console.error('   Duplicate key error - some banks may already exist');
        }
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the seed function
seedBanks();

