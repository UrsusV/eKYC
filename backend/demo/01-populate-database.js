/**
 * Demo Script 1: Populate Database with Sample eKYC Data
 * This creates realistic test data for the demo
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const { User, Bank, KycRequest, Document } = require('../src/models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function populateDatabase() {
  console.log('\n🚀 Starting Database Population...\n');

  // Clear existing data (for demo purposes)
  console.log('🧹 Clearing existing demo data...');
  await User.deleteMany({ $or: [{ email: { $regex: /@demo\./ } }, { email: { $regex: /@demo-/ } }] });
  await Bank.deleteMany({ $or: [{ bankName: 'Dutch Bangla Bank' }, { bankName: 'BRAC Bank' }] });
  await KycRequest.deleteMany({});
  await Document.deleteMany({});

  // 1. Create Banks (matching blockchain authorized issuers)
  console.log('\n📊 Creating Banks...');

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
    isActive: true
  });
  console.log(`   ✅ ${dutchBanglaBank.bankName} created`);

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
    isActive: true
  });
  console.log(`   ✅ ${bracBank.bankName} created`);

  // 2. Create Bank Officers
  console.log('\n👥 Creating Bank Officers...');

  const officer1 = await User.create({
    email: 'officer1@demo.dbbl.com',
    password: 'Demo@123456',
    role: 'bank_officer',
    personalInfo: {
      fullName: 'Kamal Ahmed',
      fatherName: 'Abdul Ahmed',
      motherName: 'Amina Begum',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'male',
      nationality: 'Bangladeshi',
      nid: '1234567890'
    },
    contactInfo: {
      primaryPhone: '+8801712345678',
      presentAddress: {
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Motijheel',
        addressLine: 'House 10, Road 5',
        postCode: '1000'
      },
      permanentAddress: {
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Motijheel',
        addressLine: 'House 10, Road 5',
        postCode: '1000'
      }
    },
    bankOfficerInfo: {
      bankId: dutchBanglaBank._id,
      employeeId: 'DBBL-2024-001',
      department: 'KYC Operations',
      designation: 'Senior KYC Officer'
    },
    kycStatus: 'approved',
    kycLevel: 3,
    isActive: true
  });
  console.log(`   ✅ Officer created: ${officer1.personalInfo.fullName}`);

  // 3. Create Customers
  console.log('\n👤 Creating Customers...');

  const customer1 = await User.create({
    email: 'rahim@demo-customer.com',
    password: 'Demo@123456',
    role: 'customer',
    personalInfo: {
      fullName: 'Abdul Rahim',
      fatherName: 'Rahman Ali',
      motherName: 'Rahima Khatun',
      dateOfBirth: new Date('1995-08-20'),
      gender: 'male',
      nationality: 'Bangladeshi',
      nid: '9876543210987'
    },
    contactInfo: {
      primaryPhone: '+8801898765432',
      presentAddress: {
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Dhanmondi',
        addressLine: 'House 25, Road 11',
        postCode: '1209'
      },
      permanentAddress: {
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Dhanmondi',
        addressLine: 'House 25, Road 11',
        postCode: '1209'
      }
    },
    kycStatus: 'pending',
    kycLevel: 0,
    isActive: true
  });
  console.log(`   ✅ Customer created: ${customer1.personalInfo.fullName}`);

  const customer2 = await User.create({
    email: 'fatema@demo-customer.com',
    password: 'Demo@123456',
    role: 'customer',
    personalInfo: {
      fullName: 'Fatema Begum',
      fatherName: 'Ibrahim Hossain',
      motherName: 'Ayesha Siddiqua',
      dateOfBirth: new Date('1992-03-10'),
      gender: 'female',
      nationality: 'Bangladeshi',
      nid: '1122334455667'
    },
    contactInfo: {
      primaryPhone: '+8801755443322',
      presentAddress: {
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Gulshan',
        addressLine: 'House 42, Road 18',
        postCode: '1212'
      },
      permanentAddress: {
        division: 'Chattogram',
        district: 'Chattogram',
        upazila: 'Pahartali',
        addressLine: 'House 15, Block C',
        postCode: '4202'
      }
    },
    kycStatus: 'not_started',
    kycLevel: 0,
    isActive: true
  });
  console.log(`   ✅ Customer created: ${customer2.personalInfo.fullName}`);

  // 4. Create KYC Request for Customer 1
  console.log('\n📝 Creating KYC Request...');

  const kycRequest1 = await KycRequest.create({
    userId: customer1._id,
    bankId: dutchBanglaBank._id,
    requestType: 'new',
    kycLevel: 1,
    status: 'submitted',
    workflow: {
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      assignedTo: officer1._id
    },
    verificationChecks: {
      phoneVerification: {
        status: 'success',
        verifiedAt: new Date()
      },
      emailVerification: {
        status: 'success',
        verifiedAt: new Date()
      }
    },
    riskAssessment: {
      riskLevel: 'low',
      totalRiskScore: 15
    },
    priority: 'normal',
    createdBy: customer1._id
  });
  console.log(`   ✅ KYC Request created: ${kycRequest1.requestId}`);

  // 5. Create Document for KYC Request
  console.log('\n📄 Creating Documents...');

  const document1 = await Document.create({
    userId: customer1._id,
    kycRequestId: kycRequest1._id,
    documentType: 'nid_front',
    documentCategory: 'identity',
    file: {
      originalName: 'nid_front_rahim.jpg',
      fileName: 'nid_front_rahim_' + Date.now() + '.jpg',
      filePath: '/uploads/documents/demo/nid_front_rahim.jpg',
      mimeType: 'image/jpeg',
      fileSize: 245680,
      fileExtension: 'jpg'
    },
    encryption: {
      isEncrypted: false
    },
    verification: {
      status: 'verified',
      verifiedAt: new Date(),
      verifiedBy: officer1._id,
      verificationMethod: 'manual'
    },
    hash: {
      value: crypto.createHash('sha256').update('demo-nid-hash-rahim-' + Date.now()).digest('hex'),
      algorithm: 'sha256',
      createdAt: new Date()
    },
    expiryDate: new Date('2030-12-31'),
    isExpired: false
  });
  console.log(`   ✅ Document created: ${document1.documentId} (${document1.documentType})`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ DATABASE POPULATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`\n📊 Created:`);
  console.log(`   - ${2} Banks (Dutch Bangla Bank, BRAC Bank)`);
  console.log(`   - ${1} Bank Officer (Kamal Ahmed)`);
  console.log(`   - ${2} Customers (Abdul Rahim, Fatema Begum)`);
  console.log(`   - ${1} KYC Request (${kycRequest1.requestId})`);
  console.log(`   - ${1} Document (NID Front)`);

  console.log('\n📋 Demo Data Summary:');
  console.log('   Customer: rahim@demo-customer.com / Demo@123456');
  console.log('   Officer:  officer1@demo.dbbl.com / Demo@123456');
  console.log(`   KYC Request ID: ${kycRequest1.requestId}`);
  console.log(`   Document Hash: ${document1.hash.value.substring(0, 20)}...`);
  console.log(`\n🌐 Web Interfaces:`);
  console.log('   MongoDB Express: http://localhost:8081 (admin/admin123)');
  console.log('   Redis Commander: http://localhost:8082');

  return {
    banks: [dutchBanglaBank, bracBank],
    officers: [officer1],
    customers: [customer1, customer2],
    kycRequests: [kycRequest1],
    documents: [document1]
  };
}

// Run the population
populateDatabase()
  .then(async (data) => {
    console.log('\n🎉 Demo database ready for presentation!\n');
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error populating database:', err);
    mongoose.disconnect();
    process.exit(1);
  });
