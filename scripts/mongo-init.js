// MongoDB initialization script for eKYC database

db = db.getSiblingDB('ekyc_db');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'role', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        role: {
          enum: ['customer', 'bank_officer', 'admin']
        }
      }
    }
  }
});

db.createCollection('kyc_requests', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'status', 'createdAt'],
      properties: {
        status: {
          enum: ['pending', 'under_review', 'approved', 'rejected', 'expired']
        }
      }
    }
  }
});

db.createCollection('credentials');
db.createCollection('consent_logs');
db.createCollection('audit_logs');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ walletAddress: 1 }, { sparse: true });
db.users.createIndex({ role: 1 });

db.kyc_requests.createIndex({ userId: 1 });
db.kyc_requests.createIndex({ status: 1 });
db.kyc_requests.createIndex({ createdAt: -1 });

db.credentials.createIndex({ userId: 1 });
db.credentials.createIndex({ credentialHash: 1 }, { unique: true });
db.credentials.createIndex({ txHash: 1 }, { sparse: true });

db.consent_logs.createIndex({ userId: 1 });
db.consent_logs.createIndex({ requesterId: 1 });
db.consent_logs.createIndex({ createdAt: -1 });

db.audit_logs.createIndex({ userId: 1 });
db.audit_logs.createIndex({ action: 1 });
db.audit_logs.createIndex({ timestamp: -1 });

print('eKYC database initialized successfully');
