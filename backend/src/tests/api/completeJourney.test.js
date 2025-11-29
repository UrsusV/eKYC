/**
 * Complete Journey Test: Registration -> KYC -> Approval -> Consent lifecycle
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../../models/User');
const Bank = require('../../models/Bank');
const KycRequest = require('../../models/KycRequest');
const Consent = require('../../models/Consent');

let mongoServer;

// Helper to create a test bank directly (no public bank creation endpoint exists yet)
async function createTestBank() {
  return await Bank.create({
    bankName: 'Journey Test Bank Limited',
    bankNameBangla: 'জার্নি টেস্ট ব্যাংক লিমিটেড',
    bankCode: 'TSTB', // 4 uppercase letters per validation rule
    swiftCode: 'TSTBBD2D', // Valid SWIFT example used elsewhere
    routingNumber: '123456789',
    licenseNumber: 'BB-JOURNEY-2025-001',
    licenseIssueDate: new Date('2024-01-01'),
    licenseExpiryDate: new Date('2034-12-31'),
    bankType: 'private_commercial',
    headOffice: {
      addressLine: '1 Banking Plaza',
      division: 'Dhaka',
      district: 'Dhaka',
      postCode: '1000',
      phone: '+8801000000000',
      email: `ops-${Date.now()}@journeybank.bd`
    },
    isActive: true,
    status: 'active'
  });
}

// Dynamic emails to avoid unique constraint collisions
function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;
}

describe('Complete eKYC + Consent Journey', () => {
  let customerToken;
  let bankOfficerToken;
  let bankOfficerId;
  let customerId;
  let kycRequestId;
  let consentId;
  let testBank;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean database between scenarios to keep test deterministic
    await User.deleteMany({});
    await Bank.deleteMany({});
    await KycRequest.deleteMany({});
    await Consent.deleteMany({});

    // 1. Create bank
    testBank = await createTestBank();

    // 2. Register customer
    const customerData = {
      name: 'Alice Wonder',
      email: uniqueEmail('customer'),
      password: 'Customer@123',
      nid_number: '1234567890'
    };
    const regCustomerRes = await request(app)
      .post('/api/v1/auth/register/customer')
      .send(customerData)
        .expect(res => {
          if (res.status !== 201) {
            // Log error body for debugging
            // eslint-disable-next-line no-console
            console.error('Customer registration failed:', JSON.stringify(res.body, null, 2));
          }
        });
      expect(regCustomerRes.status).toBe(201);
      expect(regCustomerRes.body.success).toBe(true);
    customerToken = regCustomerRes.body.data.accessToken;
    customerId = regCustomerRes.body.data.user.id;

    // 3. Submit KYC
    const kycPayload = {
      nid_number: '9876543210',
      full_name: 'Alice Wonder',
      date_of_birth: '1992-05-20',
      address: '123 Main Street, Dhaka-1215, Bangladesh',
      father_name: 'Robert Wonder',
      mother_name: 'Mary Wonder',
      phone: '01712345678'
    };

    const kycRes = await request(app)
      .post('/api/v1/kyc/submit')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(kycPayload)
      .expect(201);
    expect(kycRes.body.success).toBe(true);
    kycRequestId = kycRes.body.data._id;

    // 4. Register bank officer
    const officerData = {
      name: 'Bob Verifier',
      email: uniqueEmail('officer'),
      password: 'Officer@123',
      bank_id: testBank._id.toString(),
      officer_id: 'OFF999001'
    };
    const regOfficerRes = await request(app)
      .post('/api/v1/auth/register/bank-officer')
      .send(officerData)
      .expect(201);
    expect(regOfficerRes.body.success).toBe(true);
    bankOfficerToken = regOfficerRes.body.data.accessToken;
    bankOfficerId = regOfficerRes.body.data.user.id;
  });

  test('Full journey: approval + consent lifecycle', async () => {
    // Customer initial KYC status check
    const statusBefore = await request(app)
      .get(`/api/v1/kyc/status/${kycRequestId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(statusBefore.body.data.status).toBe('submitted');

    // Unauthorized attempt to approve by customer
    const unauthorized = await request(app)
      .post(`/api/v1/bank/verify/${kycRequestId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ approved: true, comments: 'Attempt by customer' })
      .expect(403); // expecting forbidden
    expect(unauthorized.body.success).toBe(false);

    // Bank officer approves KYC
    const approveRes = await request(app)
      .post(`/api/v1/bank/verify/${kycRequestId}`)
      .set('Authorization', `Bearer ${bankOfficerToken}`)
      .send({ approved: true, comments: 'All documents verified successfully' })
      .expect(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.status).toBe('approved');
    expect(approveRes.body.data.workflow.approvedBy).toBe(bankOfficerId);

    // Customer sees approved status
    const statusAfter = await request(app)
      .get(`/api/v1/kyc/status/${kycRequestId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(statusAfter.body.data.status).toBe('approved');

    // Create a consent (pending)
    const consentCreateRes = await request(app)
      .post('/api/v1/consent/create')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        kycRequestId: kycRequestId,
        consentType: 'data_collection',
        purpose: 'Collect and process personal data for compliance',
        dataCategories: ['personal_info']
      })
      .expect(201);
    expect(consentCreateRes.body.success).toBe(true);
    expect(consentCreateRes.body.data.status).toBe('pending');
    consentId = consentCreateRes.body.data._id;

    // Grant consent
    const grantRes = await request(app)
      .post(`/api/v1/consent/${consentId}/grant`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ agreed: true })
      .expect(200);
    expect(grantRes.body.success).toBe(true);
    expect(grantRes.body.data.status).toBe('granted');

    // List consents
    const listRes = await request(app)
      .get('/api/v1/consent/my-consents')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(listRes.body.success).toBe(true);
    const granted = listRes.body.data.consents.find(c => c._id === consentId);
    expect(granted).toBeDefined();
    expect(granted.status).toBe('granted');

    // Revoke consent
    const revokeRes = await request(app)
      .post(`/api/v1/consent/${consentId}/revoke`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'No longer required for services' })
      .expect(200);
    expect(revokeRes.body.success).toBe(true);
    expect(revokeRes.body.data.status).toBe('revoked');

    // List again verify revoked
    const listAfterRes = await request(app)
      .get('/api/v1/consent/my-consents')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    const revoked = listAfterRes.body.data.consents.find(c => c._id === consentId);
    expect(revoked).toBeDefined();
    expect(revoked.status).toBe('revoked');
  });
});
