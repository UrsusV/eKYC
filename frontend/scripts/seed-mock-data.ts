#!/usr/bin/env node

/**
 * Seed Script for MSW Mock Data
 * 
 * This script provides utilities to:
 * - Reset mock data to initial state
 * - Generate additional mock data
 * - Export mock data as JSON
 * - Test MSW handlers
 * 
 * Usage:
 *   npm run seed:mock           # Reset to default data
 *   npm run seed:mock generate  # Generate additional data
 *   npm run seed:mock export    # Export current data to JSON
 *   npm run seed:mock test      # Test MSW handlers
 */

import { mockCredentials, mockConsents, mockAuditEvents } from '../src/mocks/data';

// ============================================================================
// Colors for console output
// ============================================================================
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// ============================================================================
// Data Generation Functions
// ============================================================================

const bangladeshiNames = {
  male: ['Ahmed', 'Mohammad', 'Rakib', 'Kamal', 'Rahim', 'Jamal', 'Faisal', 'Tariq', 'Nasir', 'Imran'],
  female: ['Fatima', 'Nusrat', 'Sadia', 'Nazma', 'Taslima', 'Razia', 'Hasina', 'Shireen', 'Amina', 'Kulsum'],
  surnames: ['Rahman', 'Begum', 'Hasan', 'Jahan', 'Islam', 'Akter', 'Uddin', 'Mia', 'Nasrin', 'Ahmed', 'Khan', 'Chowdhury'],
};

const credentialTypes = [
  'National ID',
  'eTIN Certificate',
  'Trade License',
  'Educational Certificate',
  'Professional License',
  'Birth Certificate',
  'Passport',
  'Driving License',
];

const verifiers = [
  { id: 'verifier-bank-001', name: 'Bangladesh Bank' },
  { id: 'verifier-tax-001', name: 'NBR Tax Portal' },
  { id: 'verifier-commerce-001', name: 'Ministry of Commerce' },
  { id: 'verifier-telecom-001', name: 'Grameenphone' },
  { id: 'verifier-hospital-001', name: 'United Hospital' },
  { id: 'verifier-edu-001', name: 'University of Dhaka' },
  { id: 'verifier-police-001', name: 'Bangladesh Police' },
  { id: 'verifier-court-001', name: 'Supreme Court' },
];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomName(): { full: string; email: string } {
  const isMale = Math.random() > 0.5;
  const firstName = isMale 
    ? randomItem(bangladeshiNames.male) 
    : randomItem(bangladeshiNames.female);
  const lastName = randomItem(bangladeshiNames.surnames);
  const full = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`;
  return { full, email };
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function generateCredential(id: number) {
  const name = randomName();
  const type = randomItem(credentialTypes);
  const statuses = ['active', 'active', 'active', 'active', 'revoked', 'pending', 'expired'];
  const status = randomItem(statuses);
  
  const issuedAt = randomDate(
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Up to 1 year ago
    new Date()
  );

  let expiresAt: string | undefined;
  if (type !== 'Birth Certificate' && type !== 'National ID') {
    expiresAt = new Date(issuedAt.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  }

  return {
    id: `cred-${String(id).padStart(3, '0')}`,
    holderName: name.full,
    holderEmail: name.email,
    type,
    status: status as any,
    issuedAt: issuedAt.toISOString(),
    expiresAt,
    credentialHash: generateHash(),
  };
}

function generateConsent(id: number, credentialId: string) {
  const verifier = randomItem(verifiers);
  const allFields = [
    'full_name',
    'nid',
    'etin',
    'date_of_birth',
    'address',
    'phone_number',
    'email',
    'business_name',
    'trade_license_number',
    'blood_group',
  ];

  const numFields = Math.floor(Math.random() * 4) + 2; // 2-5 fields
  const fields = [];
  for (let i = 0; i < numFields; i++) {
    fields.push(randomItem(allFields));
  }

  const durationOptions = [12, 24, 48, 72, 168]; // hours
  const durationHours = randomItem(durationOptions);

  const grantedAt = randomDate(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Up to 30 days ago
    new Date()
  );

  const expiresAt = new Date(grantedAt.getTime() + durationHours * 60 * 60 * 1000);
  const now = new Date();
  const status = expiresAt < now ? 'expired' : 'active';

  return {
    id: `consent-${String(id).padStart(3, '0')}`,
    credentialId,
    requesterId: verifier.id,
    requesterName: verifier.name,
    fields,
    status: status as any,
    grantedAt: grantedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    durationHours,
  };
}

function generateAuditEvent(id: number, credentialId: string, holderName: string) {
  const types = ['issued', 'consent_granted', 'verified', 'revoked'];
  const type = randomItem(types) as any;

  const timestamp = randomDate(
    new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Up to 60 days ago
    new Date()
  );

  let actor: string;
  let details: string;

  switch (type) {
    case 'issued':
      actor = 'Government Authority';
      details = `Credential issued to ${holderName}`;
      break;
    case 'consent_granted':
      actor = holderName;
      details = `Consent granted to ${randomItem(verifiers).name}`;
      break;
    case 'verified':
      actor = randomItem(verifiers).name;
      details = `Credential verified successfully`;
      break;
    case 'revoked':
      actor = 'Issuing Authority';
      details = `Credential revoked for ${holderName}`;
      break;
  }

  return {
    id: `event-${String(id).padStart(3, '0')}`,
    type,
    actor,
    timestamp: timestamp.toISOString(),
    details,
  };
}

// ============================================================================
// Commands
// ============================================================================

function showStats() {
  log.header('📊 Current Mock Data Statistics');
  
  console.log(`Credentials: ${colors.green}${mockCredentials.length}${colors.reset}`);
  console.log(`  - Active: ${mockCredentials.filter(c => c.status === 'active').length}`);
  console.log(`  - Revoked: ${mockCredentials.filter(c => c.status === 'revoked').length}`);
  console.log(`  - Pending: ${mockCredentials.filter(c => c.status === 'pending').length}`);
  console.log(`  - Expired: ${mockCredentials.filter(c => c.status === 'expired').length}`);
  
  console.log(`\nConsents: ${colors.green}${mockConsents.length}${colors.reset}`);
  console.log(`  - Active: ${mockConsents.filter(c => c.status === 'active').length}`);
  console.log(`  - Expired: ${mockConsents.filter(c => c.status === 'expired').length}`);
  console.log(`  - Revoked: ${mockConsents.filter(c => c.status === 'revoked').length}`);
  
  console.log(`\nAudit Events: ${colors.green}${mockAuditEvents.length}${colors.reset}`);
  console.log(`  - Issued: ${mockAuditEvents.filter(e => e.type === 'issued').length}`);
  console.log(`  - Consent Granted: ${mockAuditEvents.filter(e => e.type === 'consent_granted').length}`);
  console.log(`  - Verified: ${mockAuditEvents.filter(e => e.type === 'verified').length}`);
  console.log(`  - Revoked: ${mockAuditEvents.filter(e => e.type === 'revoked').length}`);
}

function generateData(count: number = 10) {
  log.header(`🎲 Generating ${count} Additional Mock Records`);

  const startId = mockCredentials.length + 1;
  const newCredentials = [];
  const newConsents = [];
  const newAuditEvents = [];

  for (let i = 0; i < count; i++) {
    const credential = generateCredential(startId + i);
    newCredentials.push(credential);

    // Generate 0-2 consents per credential
    const numConsents = Math.floor(Math.random() * 3);
    for (let j = 0; j < numConsents; j++) {
      const consent = generateConsent(mockConsents.length + newConsents.length + 1, credential.id);
      newConsents.push(consent);
    }

    // Generate 1-3 audit events per credential
    const numEvents = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numEvents; j++) {
      const event = generateAuditEvent(
        mockAuditEvents.length + newAuditEvents.length + 1,
        credential.id,
        credential.holderName
      );
      newAuditEvents.push(event);
    }
  }

  log.success(`Generated ${newCredentials.length} credentials`);
  log.success(`Generated ${newConsents.length} consents`);
  log.success(`Generated ${newAuditEvents.length} audit events`);

  log.info('\nNote: To persist this data, update src/mocks/data.ts');
  console.log('\nSample generated credential:');
  console.log(JSON.stringify(newCredentials[0], null, 2));
}

function exportData() {
  log.header('📤 Exporting Mock Data');

  const data = {
    credentials: mockCredentials,
    consents: mockConsents,
    auditEvents: mockAuditEvents,
    exportedAt: new Date().toISOString(),
  };

  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(process.cwd(), 'mock-data-export.json');

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  log.success(`Data exported to: ${outputPath}`);
  log.info(`Total size: ${(JSON.stringify(data).length / 1024).toFixed(2)} KB`);
}

function testHandlers() {
  log.header('🧪 Testing MSW Handlers');

  log.info('MSW handlers defined:');
  console.log('  - GET  /api/credentials');
  console.log('  - GET  /api/credentials/:id');
  console.log('  - POST /api/consents');
  console.log('  - GET  /api/consents');
  console.log('  - DELETE /api/consents/:id');
  console.log('  - POST /api/verify');
  console.log('  - GET  /api/audit');
  console.log('  - POST /api/credentials/:id/revoke');

  log.success('\nAll handlers loaded successfully');
  log.info('Run tests with: npm test');
}

function showHelp() {
  log.header('🌱 MSW Mock Data Seed Script');

  console.log('Usage: npm run seed:mock [command]\n');
  console.log('Commands:');
  console.log('  stats      Show current mock data statistics (default)');
  console.log('  generate   Generate additional mock data');
  console.log('  export     Export mock data to JSON file');
  console.log('  test       Test MSW handlers');
  console.log('  help       Show this help message\n');
  
  console.log('Examples:');
  console.log('  npm run seed:mock');
  console.log('  npm run seed:mock generate');
  console.log('  npm run seed:mock export\n');
}

// ============================================================================
// Main
// ============================================================================

const command = process.argv[2] || 'stats';
const count = parseInt(process.argv[3] || '10', 10);

switch (command) {
  case 'stats':
    showStats();
    break;
  case 'generate':
    generateData(count);
    break;
  case 'export':
    exportData();
    break;
  case 'test':
    testHandlers();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    log.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
