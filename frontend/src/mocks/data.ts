/**
 * Mock Data for MSW Handlers
 * 
 * Provides realistic seed data for e-KYC system testing including:
 * - Credentials with NID and eTIN
 * - Consents with field selections
 * - Verification results
 * - Audit events
 */

import type { Credential } from '../components/ui/IssuerCredentialsTable';
import type { AuditEvent } from '../components/ui/AuditTimeline';
import type { VerificationResult } from '../pages/VerifyCredentialPage';

// ============================================================================
// Types
// ============================================================================

export interface ConsentRecord {
  id: string;
  credentialId: string;
  requesterId: string;
  requesterName: string;
  fields: string[];
  status: 'active' | 'expired' | 'revoked';
  grantedAt: string;
  expiresAt: string;
  durationHours: number;
}

export interface VerifyPayload {
  hash?: string;
  proof?: string;
  verifierId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Holder' | 'Issuer' | 'Verifier' | 'Admin';
  organization?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  credentialsCount?: number;
  verificationsCount?: number;
}

export interface CredentialTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'date' | 'number';
    required: boolean;
  }>;
  defaultExpiryMonths?: number;
}

export interface IssuerStats {
  totalIssued: number;
  active: number;
  revoked: number;
  thisMonth: number;
  expired: number;
}

// ============================================================================
// Seed Data
// ============================================================================

/**
 * Mock credentials database
 */
export const mockCredentials: Credential[] = [
  {
    id: 'cred-001',
    holderName: 'Ahmed Rahman',
    holderEmail: 'ahmed.rahman@email.com',
    type: 'National ID',
    status: 'active',
    issuedAt: '2024-10-15T10:30:00Z',
    expiresAt: '2029-10-15T10:30:00Z',
    credentialHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
  },
  {
    id: 'cred-002',
    holderName: 'Fatima Begum',
    holderEmail: 'fatima.begum@email.com',
    type: 'eTIN Certificate',
    status: 'active',
    issuedAt: '2024-09-20T14:15:00Z',
    expiresAt: '2025-09-20T14:15:00Z',
    credentialHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab',
  },
  {
    id: 'cred-003',
    holderName: 'Mohammad Hasan',
    holderEmail: 'mohammad.hasan@email.com',
    type: 'Trade License',
    status: 'active',
    issuedAt: '2024-08-10T09:00:00Z',
    expiresAt: '2025-08-10T09:00:00Z',
    credentialHash: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
  },
  {
    id: 'cred-004',
    holderName: 'Nusrat Jahan',
    holderEmail: 'nusrat.jahan@email.com',
    type: 'Educational Certificate',
    status: 'revoked',
    issuedAt: '2024-07-05T11:20:00Z',
    expiresAt: '2029-07-05T11:20:00Z',
    credentialHash: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
  {
    id: 'cred-005',
    holderName: 'Rakib Islam',
    holderEmail: 'rakib.islam@email.com',
    type: 'National ID',
    status: 'pending',
    issuedAt: '2024-10-16T08:45:00Z',
    expiresAt: '2029-10-16T08:45:00Z',
    credentialHash: '0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
  },
  {
    id: 'cred-006',
    holderName: 'Sadia Akter',
    holderEmail: 'sadia.akter@email.com',
    type: 'eTIN Certificate',
    status: 'expired',
    issuedAt: '2023-10-01T10:00:00Z',
    expiresAt: '2024-10-01T10:00:00Z',
    credentialHash: '0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
  },
  {
    id: 'cred-007',
    holderName: 'Kamal Uddin',
    holderEmail: 'kamal.uddin@email.com',
    type: 'National ID',
    status: 'active',
    issuedAt: '2024-09-15T13:30:00Z',
    expiresAt: '2029-09-15T13:30:00Z',
    credentialHash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
  },
  {
    id: 'cred-008',
    holderName: 'Taslima Nasrin',
    holderEmail: 'taslima.nasrin@email.com',
    type: 'Professional License',
    status: 'active',
    issuedAt: '2024-10-10T15:00:00Z',
    expiresAt: '2025-10-10T15:00:00Z',
    credentialHash: '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567',
  },
  {
    id: 'cred-009',
    holderName: 'Rahim Mia',
    holderEmail: 'rahim.mia@email.com',
    type: 'Birth Certificate',
    status: 'active',
    issuedAt: '2024-06-20T10:15:00Z',
    credentialHash: '0x90abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
  },
  {
    id: 'cred-010',
    holderName: 'Nazma Begum',
    holderEmail: 'nazma.begum@email.com',
    type: 'eTIN Certificate',
    status: 'active',
    issuedAt: '2024-05-15T09:30:00Z',
    expiresAt: '2025-05-15T09:30:00Z',
    credentialHash: '0x0abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456789',
  },
];

/**
 * Mock consents database
 */
export const mockConsents: ConsentRecord[] = [
  {
    id: 'consent-001',
    credentialId: 'cred-001',
    requesterId: 'verifier-bank-001',
    requesterName: 'Bangladesh Bank',
    fields: ['full_name', 'nid', 'date_of_birth', 'address'],
    status: 'active',
    grantedAt: '2024-10-16T10:00:00Z',
    expiresAt: '2024-10-17T10:00:00Z',
    durationHours: 24,
  },
  {
    id: 'consent-002',
    credentialId: 'cred-002',
    requesterId: 'verifier-tax-001',
    requesterName: 'NBR Tax Portal',
    fields: ['full_name', 'etin', 'business_name'],
    status: 'active',
    grantedAt: '2024-10-15T14:30:00Z',
    expiresAt: '2024-10-16T14:30:00Z',
    durationHours: 24,
  },
  {
    id: 'consent-003',
    credentialId: 'cred-003',
    requesterId: 'verifier-commerce-001',
    requesterName: 'Ministry of Commerce',
    fields: ['business_name', 'trade_license_number', 'owner_name'],
    status: 'active',
    grantedAt: '2024-10-14T09:00:00Z',
    expiresAt: '2024-10-21T09:00:00Z',
    durationHours: 168, // 7 days
  },
  {
    id: 'consent-004',
    credentialId: 'cred-001',
    requesterId: 'verifier-telecom-001',
    requesterName: 'Grameenphone',
    fields: ['full_name', 'nid', 'phone_number'],
    status: 'expired',
    grantedAt: '2024-10-10T12:00:00Z',
    expiresAt: '2024-10-11T12:00:00Z',
    durationHours: 24,
  },
  {
    id: 'consent-005',
    credentialId: 'cred-007',
    requesterId: 'verifier-hospital-001',
    requesterName: 'United Hospital',
    fields: ['full_name', 'nid', 'date_of_birth', 'blood_group'],
    status: 'active',
    grantedAt: '2024-10-16T08:00:00Z',
    expiresAt: '2024-10-16T20:00:00Z',
    durationHours: 12,
  },
];

/**
 * Mock audit events database
 */
export const mockAuditEvents: AuditEvent[] = [
  {
    id: 'event-001',
    type: 'issued',
    actor: 'Bangladesh Election Commission',
    timestamp: '2024-10-15T10:30:00Z',
    details: 'National ID credential issued to Ahmed Rahman',
  },
  {
    id: 'event-002',
    type: 'consent_granted',
    actor: 'Ahmed Rahman',
    timestamp: '2024-10-16T10:00:00Z',
    details: 'Consent granted to Bangladesh Bank for fields: full_name, nid, date_of_birth, address',
  },
  {
    id: 'event-003',
    type: 'verified',
    actor: 'Bangladesh Bank',
    timestamp: '2024-10-16T10:05:00Z',
    details: 'Credential verified successfully by Bangladesh Bank',
  },
  {
    id: 'event-004',
    type: 'issued',
    actor: 'National Board of Revenue',
    timestamp: '2024-09-20T14:15:00Z',
    details: 'eTIN Certificate issued to Fatima Begum',
  },
  {
    id: 'event-005',
    type: 'consent_granted',
    actor: 'Fatima Begum',
    timestamp: '2024-10-15T14:30:00Z',
    details: 'Consent granted to NBR Tax Portal for fields: full_name, etin, business_name',
  },
  {
    id: 'event-006',
    type: 'verified',
    actor: 'NBR Tax Portal',
    timestamp: '2024-10-15T14:35:00Z',
    details: 'eTIN Certificate verified successfully',
  },
  {
    id: 'event-007',
    type: 'revoked',
    actor: 'University of Dhaka',
    timestamp: '2024-10-12T16:20:00Z',
    details: 'Educational Certificate revoked for Nusrat Jahan due to verification issues',
  },
  {
    id: 'event-008',
    type: 'issued',
    actor: 'Ministry of Commerce',
    timestamp: '2024-08-10T09:00:00Z',
    details: 'Trade License issued to Mohammad Hasan',
  },
  {
    id: 'event-009',
    type: 'consent_granted',
    actor: 'Mohammad Hasan',
    timestamp: '2024-10-14T09:00:00Z',
    details: 'Consent granted to Ministry of Commerce for 7 days',
  },
  {
    id: 'event-010',
    type: 'verified',
    actor: 'Ministry of Commerce',
    timestamp: '2024-10-14T09:10:00Z',
    details: 'Trade License verified successfully',
  },
  {
    id: 'event-011',
    type: 'issued',
    actor: 'Bangladesh Election Commission',
    timestamp: '2024-09-15T13:30:00Z',
    details: 'National ID credential issued to Kamal Uddin',
  },
  {
    id: 'event-012',
    type: 'consent_granted',
    actor: 'Kamal Uddin',
    timestamp: '2024-10-16T08:00:00Z',
    details: 'Consent granted to United Hospital for medical records access',
  },
];

/**
 * Mock verification results
 */
export const mockVerificationResults: Record<string, VerificationResult> = {
  '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890': {
    status: 'verified',
    message: 'Credential is valid and has been successfully verified',
    credentialHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    issuer: 'Bangladesh Election Commission',
    issuedAt: '2024-10-15T10:30:00Z',
    expiresAt: '2029-10-15T10:30:00Z',
    holderName: 'Ahmed Rahman',
    credentialType: 'National ID',
    proofChain: [
      {
        issuer: 'Bangladesh Election Commission',
        issuedAt: '2024-10-15T10:30:00Z',
        credentialType: 'National ID',
      },
    ],
    consentRequired: false,
    verificationId: 'verify-001',
    verifiedAt: '2024-10-17T10:00:00Z',
  },
  '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab': {
    status: 'verified',
    message: 'eTIN Certificate verified successfully',
    credentialHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    issuer: 'National Board of Revenue',
    issuedAt: '2024-09-20T14:15:00Z',
    expiresAt: '2025-09-20T14:15:00Z',
    holderName: 'Fatima Begum',
    credentialType: 'eTIN Certificate',
    proofChain: [
      {
        issuer: 'National Board of Revenue',
        issuedAt: '2024-09-20T14:15:00Z',
        credentialType: 'eTIN Certificate',
      },
    ],
    consentRequired: false,
    verificationId: 'verify-002',
    verifiedAt: '2024-10-17T10:00:00Z',
  },
  '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef': {
    status: 'revoked',
    message: 'This credential has been revoked by the issuing authority',
    credentialHash: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    issuer: 'University of Dhaka',
    issuedAt: '2024-07-05T11:20:00Z',
    expiresAt: '2029-07-05T11:20:00Z',
    holderName: 'Nusrat Jahan',
    credentialType: 'Educational Certificate',
    proofChain: [
      {
        issuer: 'University of Dhaka',
        issuedAt: '2024-07-05T11:20:00Z',
        credentialType: 'Educational Certificate',
      },
    ],
    consentRequired: false,
    verificationId: 'verify-003',
    verifiedAt: '2024-10-17T10:00:00Z',
  },
  '0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234': {
    status: 'expired',
    message: 'This credential has expired',
    credentialHash: '0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
    issuer: 'National Board of Revenue',
    issuedAt: '2023-10-01T10:00:00Z',
    expiresAt: '2024-10-01T10:00:00Z',
    holderName: 'Sadia Akter',
    credentialType: 'eTIN Certificate',
    proofChain: [
      {
        issuer: 'National Board of Revenue',
        issuedAt: '2023-10-01T10:00:00Z',
        credentialType: 'eTIN Certificate',
      },
    ],
    consentRequired: false,
    verificationId: 'verify-004',
    verifiedAt: '2024-10-17T10:00:00Z',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a random consent ID
 */
export const generateConsentId = (): string => {
  return `consent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generate a random verification ID
 */
export const generateVerificationId = (): string => {
  return `verify-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generate a random audit event ID
 */
export const generateAuditEventId = (): string => {
  return `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Filter credentials by query parameters
 */
export const filterCredentials = (
  credentials: Credential[],
  params: {
    q?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Credential[] => {
  let filtered = [...credentials];

  // Search query
  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(
      (cred) =>
        cred.holderName.toLowerCase().includes(query) ||
        cred.holderEmail.toLowerCase().includes(query) ||
        cred.type.toLowerCase().includes(query) ||
        cred.credentialHash.toLowerCase().includes(query)
    );
  }

  // Status filter
  if (params.status && params.status !== 'all') {
    filtered = filtered.filter((cred) => cred.status === params.status);
  }

  // Date range filter
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    filtered = filtered.filter((cred) => new Date(cred.issuedAt) >= startDate);
  }

  if (params.endDate) {
    const endDate = new Date(params.endDate);
    filtered = filtered.filter((cred) => new Date(cred.issuedAt) <= endDate);
  }

  return filtered;
};

/**
 * Sort credentials
 */
export const sortCredentials = (
  credentials: Credential[],
  sortBy: string = 'issuedAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Credential[] => {
  const sorted = [...credentials];

  sorted.sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'issuedAt') {
      comparison = new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

/**
 * Paginate results
 */
export const paginateResults = <T>(
  items: T[],
  page: number,
  itemsPerPage: number
): { items: T[]; totalPages: number; totalItems: number } => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    totalPages: Math.ceil(items.length / itemsPerPage),
    totalItems: items.length,
  };
};

/**
 * Mock users database
 */
export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: 'Ahmed Rahman',
    email: 'ahmed.rahman@email.com',
    role: 'Holder',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    lastLogin: '2024-10-18T14:25:00Z',
    credentialsCount: 3,
  },
  {
    id: 'user-002',
    name: 'Fatima Begum',
    email: 'fatima.begum@email.com',
    role: 'Holder',
    status: 'active',
    createdAt: '2024-02-20T09:15:00Z',
    lastLogin: '2024-10-17T11:30:00Z',
    credentialsCount: 2,
  },
  {
    id: 'user-003',
    name: 'Mohammad Hasan',
    email: 'mohammad.hasan@email.com',
    role: 'Holder',
    status: 'active',
    createdAt: '2024-03-10T16:45:00Z',
    lastLogin: '2024-10-18T09:15:00Z',
    credentialsCount: 1,
  },
  {
    id: 'user-004',
    name: 'Bangladesh Election Commission',
    email: 'admin@ec.gov.bd',
    role: 'Issuer',
    organization: 'Bangladesh Election Commission',
    status: 'active',
    createdAt: '2023-06-01T08:00:00Z',
    lastLogin: '2024-10-18T15:45:00Z',
    credentialsCount: 1247,
  },
  {
    id: 'user-005',
    name: 'National Board of Revenue',
    email: 'etin@nbr.gov.bd',
    role: 'Issuer',
    organization: 'NBR - Tax Division',
    status: 'active',
    createdAt: '2023-06-01T08:00:00Z',
    lastLogin: '2024-10-18T13:20:00Z',
    credentialsCount: 892,
  },
  {
    id: 'user-006',
    name: 'Ministry of Commerce',
    email: 'licensing@moc.gov.bd',
    role: 'Issuer',
    organization: 'Ministry of Commerce',
    status: 'active',
    createdAt: '2023-07-15T10:00:00Z',
    lastLogin: '2024-10-17T16:30:00Z',
    credentialsCount: 543,
  },
  {
    id: 'user-007',
    name: 'Bangladesh Bank',
    email: 'verify@bb.org.bd',
    role: 'Verifier',
    organization: 'Bangladesh Bank',
    status: 'active',
    createdAt: '2023-08-01T09:00:00Z',
    lastLogin: '2024-10-18T12:00:00Z',
    verificationsCount: 3421,
  },
  {
    id: 'user-008',
    name: 'Grameenphone Limited',
    email: 'kyc@grameenphone.com',
    role: 'Verifier',
    organization: 'Grameenphone',
    status: 'active',
    createdAt: '2023-09-10T11:30:00Z',
    lastLogin: '2024-10-18T14:50:00Z',
    verificationsCount: 8932,
  },
  {
    id: 'user-009',
    name: 'United Hospital Dhaka',
    email: 'admissions@united-hospital.com',
    role: 'Verifier',
    organization: 'United Hospital',
    status: 'active',
    createdAt: '2023-10-05T14:20:00Z',
    lastLogin: '2024-10-16T10:15:00Z',
    verificationsCount: 1256,
  },
  {
    id: 'user-010',
    name: 'Rakib Islam',
    email: 'rakib.islam@email.com',
    role: 'Holder',
    status: 'active',
    createdAt: '2024-04-12T13:00:00Z',
    lastLogin: '2024-10-15T17:40:00Z',
    credentialsCount: 1,
  },
  {
    id: 'user-011',
    name: 'Sadia Akter',
    email: 'sadia.akter@email.com',
    role: 'Holder',
    status: 'inactive',
    createdAt: '2023-11-20T10:30:00Z',
    lastLogin: '2024-08-25T09:20:00Z',
    credentialsCount: 1,
  },
  {
    id: 'user-012',
    name: 'System Administrator',
    email: 'admin@ekyc.gov.bd',
    role: 'Admin',
    organization: 'e-KYC Platform',
    status: 'active',
    createdAt: '2023-01-01T00:00:00Z',
    lastLogin: '2024-10-18T15:55:00Z',
  },
  {
    id: 'user-013',
    name: 'Security Team',
    email: 'security@ekyc.gov.bd',
    role: 'Admin',
    organization: 'e-KYC Security Operations',
    status: 'active',
    createdAt: '2023-01-01T00:00:00Z',
    lastLogin: '2024-10-18T08:30:00Z',
  },
  {
    id: 'user-014',
    name: 'Kamal Uddin',
    email: 'kamal.uddin@email.com',
    role: 'Holder',
    status: 'suspended',
    createdAt: '2024-05-10T11:20:00Z',
    lastLogin: '2024-09-15T14:30:00Z',
    credentialsCount: 1,
  },
  {
    id: 'user-015',
    name: 'BRAC Bank',
    email: 'digitalkyc@bracbank.com',
    role: 'Verifier',
    organization: 'BRAC Bank Limited',
    status: 'active',
    createdAt: '2023-11-15T09:45:00Z',
    lastLogin: '2024-10-18T11:25:00Z',
    verificationsCount: 2145,
  },
];

/**
 * Credential templates for different types
 */
export const mockCredentialTemplates: CredentialTemplate[] = [
  {
    id: 'template-001',
    name: 'National ID',
    type: 'National ID',
    description: 'Government-issued National Identity Card',
    fields: [
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true },
      { name: 'fullName', label: 'Full Name', type: 'text', required: true },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'fatherName', label: 'Father\'s Name', type: 'text', required: true },
      { name: 'motherName', label: 'Mother\'s Name', type: 'text', required: true },
      { name: 'address', label: 'Present Address', type: 'text', required: true },
    ],
    defaultExpiryMonths: 60, // 5 years
  },
  {
    id: 'template-002',
    name: 'eTIN Certificate',
    type: 'eTIN Certificate',
    description: 'Electronic Tax Identification Number Certificate',
    fields: [
      { name: 'tinNumber', label: 'TIN Number', type: 'text', required: true },
      { name: 'taxpayerName', label: 'Taxpayer Name', type: 'text', required: true },
      { name: 'businessName', label: 'Business Name', type: 'text', required: false },
      { name: 'taxpayerType', label: 'Taxpayer Type', type: 'text', required: true },
      { name: 'circle', label: 'Tax Circle', type: 'text', required: true },
    ],
    defaultExpiryMonths: 12, // 1 year
  },
  {
    id: 'template-003',
    name: 'Trade License',
    type: 'Trade License',
    description: 'Business Trade License',
    fields: [
      { name: 'licenseNumber', label: 'License Number', type: 'text', required: true },
      { name: 'businessName', label: 'Business Name', type: 'text', required: true },
      { name: 'businessType', label: 'Business Type', type: 'text', required: true },
      { name: 'ownerName', label: 'Owner Name', type: 'text', required: true },
      { name: 'businessAddress', label: 'Business Address', type: 'text', required: true },
    ],
    defaultExpiryMonths: 12, // 1 year
  },
  {
    id: 'template-004',
    name: 'Educational Certificate',
    type: 'Educational Certificate',
    description: 'Academic Degree or Certificate',
    fields: [
      { name: 'certificateNumber', label: 'Certificate Number', type: 'text', required: true },
      { name: 'studentName', label: 'Student Name', type: 'text', required: true },
      { name: 'degree', label: 'Degree/Program', type: 'text', required: true },
      { name: 'institution', label: 'Institution Name', type: 'text', required: true },
      { name: 'graduationDate', label: 'Graduation Date', type: 'date', required: true },
      { name: 'cgpa', label: 'CGPA/Grade', type: 'text', required: true },
    ],
    defaultExpiryMonths: undefined, // No expiry
  },
  {
    id: 'template-005',
    name: 'Passport',
    type: 'Passport',
    description: 'International Travel Passport',
    fields: [
      { name: 'passportNumber', label: 'Passport Number', type: 'text', required: true },
      { name: 'fullName', label: 'Full Name', type: 'text', required: true },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'nationality', label: 'Nationality', type: 'text', required: true },
      { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
    ],
    defaultExpiryMonths: 60, // 5 years
  },
];

// ============================================================================
// Helper Functions for Issuers
// ============================================================================

/**
 * Generate a unique credential ID
 */
export const generateCredentialId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `cred-${timestamp}-${random}`;
};

/**
 * Generate a cryptographic hash for a credential
 */
export const generateCredentialHash = (): string => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

/**
 * Calculate issuer statistics from credentials
 */
export const calculateIssuerStats = (credentials: Credential[]): IssuerStats => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const stats: IssuerStats = {
    totalIssued: credentials.length,
    active: 0,
    revoked: 0,
    expired: 0,
    thisMonth: 0,
  };
  
  credentials.forEach(cred => {
    // Count by status
    if (cred.status === 'active') stats.active++;
    else if (cred.status === 'revoked') stats.revoked++;
    else if (cred.status === 'expired') stats.expired++;
    
    // Count this month's issuances
    const issuedDate = new Date(cred.issuedAt);
    if (issuedDate.getMonth() === currentMonth && issuedDate.getFullYear() === currentYear) {
      stats.thisMonth++;
    }
  });
  
  return stats;
};
