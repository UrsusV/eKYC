/**
 * MSW Handlers for e-KYC System
 * 
 * Provides mock API endpoints for testing:
 * - GET /api/credentials - Fetch credentials with filtering, sorting, and pagination
 * - POST /api/consents - Create new consent records
 * - POST /api/verify - Verify credentials
 * - GET /api/audit - Fetch audit events
 */

import { http, HttpResponse, delay } from 'msw';
import {
  mockCredentials,
  mockConsents,
  mockAuditEvents,
  mockVerificationResults,
  mockCredentialTemplates,
  generateConsentId,
  generateVerificationId,
  generateAuditEventId,
  generateCredentialId,
  generateCredentialHash,
  calculateIssuerStats,
  filterCredentials,
  sortCredentials,
  paginateResults,
} from './data';
import type { ConsentRecord, VerifyPayload } from './data';
import type { Credential, CredentialsResponse } from '../components/ui/IssuerCredentialsTable';
import type { AuditEvent } from '../components/ui/AuditTimeline';
import type { VerificationResult } from '../pages/VerifyCredentialPage';

// ============================================================================
// In-Memory Storage (simulates database)
// ============================================================================

// Deep clone to avoid mutations affecting seed data
let credentials: Credential[] = JSON.parse(JSON.stringify(mockCredentials));
let consents: ConsentRecord[] = JSON.parse(JSON.stringify(mockConsents));
let auditEvents: AuditEvent[] = JSON.parse(JSON.stringify(mockAuditEvents));

// ============================================================================
// MSW Handlers
// ============================================================================

export const handlers = [
  // ==========================================================================
  // GET /api/credentials
  // Fetch credentials with filtering, sorting, and pagination
  // ==========================================================================
  http.get('/api/credentials', async ({ request }) => {
    // Simulate network delay
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const itemsPerPage = parseInt(url.searchParams.get('limit') || '10', 10);
    const q = url.searchParams.get('q') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'issuedAt';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Filter credentials
    let filtered = filterCredentials(credentials, { q, status, startDate, endDate });

    // Sort credentials
    filtered = sortCredentials(filtered, sortBy, sortOrder);

    // Paginate results
    const { items, totalPages, totalItems } = paginateResults(filtered, page, itemsPerPage);

    const response: CredentialsResponse = {
      credentials: items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage,
      },
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  // ==========================================================================
  // GET /api/credentials/:id
  // Fetch a single credential by ID
  // ==========================================================================
  http.get('/api/credentials/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const credential = credentials.find((c) => c.id === id);

    if (!credential) {
      return HttpResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(credential, { status: 200 });
  }),

  // ==========================================================================
  // POST /api/credentials
  // Issue a new credential (Issuer only)
  // ==========================================================================
  http.post('/api/credentials', async ({ request }) => {
    await delay(400);

    try {
      const body = await request.json() as {
        holderName: string;
        holderEmail: string;
        type: string;
        issuedAt: string;
        expiresAt?: string;
      };

      // Validation
      if (!body.holderName || !body.holderEmail || !body.type) {
        return HttpResponse.json(
          { error: 'Missing required fields: holderName, holderEmail, type' },
          { status: 400 }
        );
      }

      // Create new credential
      const newCredential: Credential = {
        id: generateCredentialId(),
        holderName: body.holderName,
        holderEmail: body.holderEmail,
        type: body.type,
        status: 'active',
        issuedAt: body.issuedAt,
        expiresAt: body.expiresAt,
        credentialHash: generateCredentialHash(),
      };

      // Add to credentials array
      credentials.unshift(newCredential);

      // Create audit event
      const auditEvent: AuditEvent = {
        id: generateAuditEventId(),
        type: 'issued',
        actor: 'Issuer Dashboard',
        timestamp: new Date().toISOString(),
        details: `Issued ${body.type} to ${body.holderName}`,
      };
      auditEvents.unshift(auditEvent);

      return HttpResponse.json(
        {
          success: true,
          credential: newCredential,
          message: 'Credential issued successfully',
        },
        { status: 201 }
      );
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  }),

  // ==========================================================================
  // GET /api/issuer/credentials
  // Fetch issuer's credentials with filtering, sorting, and pagination
  // ==========================================================================
  http.get('/api/issuer/credentials', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const itemsPerPage = parseInt(url.searchParams.get('limit') || '10', 10);
    const q = url.searchParams.get('q') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'issuedAt';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Filter credentials
    let filtered = filterCredentials(credentials, { q, status, startDate, endDate });

    // Sort credentials
    filtered = sortCredentials(filtered, sortBy, sortOrder);

    // Paginate results
    const { items, totalPages, totalItems } = paginateResults(filtered, page, itemsPerPage);

    const response: CredentialsResponse = {
      credentials: items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage,
      },
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  // ==========================================================================
  // GET /api/issuer/stats
  // Get issuer statistics
  // ==========================================================================
  http.get('/api/issuer/stats', async () => {
    await delay(200);

    const stats = calculateIssuerStats(credentials);
    return HttpResponse.json(stats, { status: 200 });
  }),

  // ==========================================================================
  // GET /api/templates
  // Get credential templates
  // ==========================================================================
  http.get('/api/templates', async () => {
    await delay(150);

    return HttpResponse.json(
      { templates: mockCredentialTemplates },
      { status: 200 }
    );
  }),

  // ==========================================================================
  // POST /api/credential/:id/revoke
  // Revoke a credential (matches IssuerCredentialsTable endpoint)
  // ==========================================================================
  http.post('/api/credential/:id/revoke', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const credentialIndex = credentials.findIndex((c) => c.id === id);

    if (credentialIndex === -1) {
      return HttpResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    const credential = credentials[credentialIndex];
    if (!credential) {
      return HttpResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    if (credential.status === 'revoked') {
      return HttpResponse.json(
        { error: 'Credential is already revoked' },
        { status: 400 }
      );
    }

    // Update credential status
    credential.status = 'revoked';

    // Create audit event
    const auditEvent: AuditEvent = {
      id: generateAuditEventId(),
      type: 'revoked',
      actor: 'Issuer Dashboard',
      timestamp: new Date().toISOString(),
      details: `Revoked ${credential.type} for ${credential.holderName}`,
    };
    auditEvents.unshift(auditEvent);

    return HttpResponse.json(
      {
        success: true,
        message: 'Credential revoked successfully',
      },
      { status: 200 }
    );
  }),

  // ==========================================================================
  // POST /api/consents
  // Create a new consent record
  // ==========================================================================
  http.post('/api/consents', async ({ request }) => {
    await delay(500); // Simulate processing time

    try {
      const body = await request.json() as {
        credentialId: string;
        requesterId: string;
        requesterName: string;
        fields: string[];
        durationHours: number;
      };

      // Validation
      if (!body.credentialId || !body.requesterId || !body.fields || body.fields.length === 0) {
        return HttpResponse.json(
          { 
            error: 'Invalid request body',
            message: 'credentialId, requesterId, and fields are required',
          },
          { status: 400 }
        );
      }

      if (body.durationHours < 1 || body.durationHours > 8760) {
        return HttpResponse.json(
          { 
            error: 'Invalid duration',
            message: 'Duration must be between 1 and 8760 hours (1 year)',
          },
          { status: 400 }
        );
      }

      // Check if credential exists
      const credential = credentials.find((c) => c.id === body.credentialId);
      if (!credential) {
        return HttpResponse.json(
          { error: 'Credential not found' },
          { status: 404 }
        );
      }

      // Check if credential is active
      if (credential.status !== 'active') {
        return HttpResponse.json(
          { 
            error: 'Credential not active',
            message: `Cannot grant consent for ${credential.status} credential`,
          },
          { status: 400 }
        );
      }

      // Create new consent
      const now = new Date();
      const expiresAt = new Date(now.getTime() + body.durationHours * 60 * 60 * 1000);

      const newConsent: ConsentRecord = {
        id: generateConsentId(),
        credentialId: body.credentialId,
        requesterId: body.requesterId,
        requesterName: body.requesterName || 'Unknown Verifier',
        fields: body.fields,
        status: 'active',
        grantedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        durationHours: body.durationHours,
      };

      // Store consent
      consents.push(newConsent);

      // Create audit event
      const auditEvent: AuditEvent = {
        id: generateAuditEventId(),
        type: 'consent_granted',
        actor: credential.holderName,
        timestamp: now.toISOString(),
        details: `Consent granted to ${body.requesterName} for ${body.durationHours} hours. Fields: ${body.fields.join(', ')}`,
      };
      auditEvents.push(auditEvent);

      return HttpResponse.json(
        {
          success: true,
          consent: newConsent,
          message: 'Consent granted successfully',
        },
        { status: 201 }
      );
    } catch (error) {
      return HttpResponse.json(
        { error: 'Internal server error', message: 'Failed to process consent request' },
        { status: 500 }
      );
    }
  }),

  // ==========================================================================
  // GET /api/consents
  // Fetch all consents (optionally filtered by credentialId or status)
  // ==========================================================================
  http.get('/api/consents', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const credentialId = url.searchParams.get('credentialId');
    const status = url.searchParams.get('status');

    let filtered = [...consents];

    if (credentialId) {
      filtered = filtered.filter((c) => c.credentialId === credentialId);
    }

    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }

    // Sort by grantedAt descending
    filtered.sort((a, b) => new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime());

    return HttpResponse.json(
      {
        consents: filtered,
        total: filtered.length,
      },
      { status: 200 }
    );
  }),

  // ==========================================================================
  // DELETE /api/consents/:id
  // Revoke a consent
  // ==========================================================================
  http.delete('/api/consents/:id', async ({ params }) => {
    await delay(400);

    const { id } = params;
    const consentIndex = consents.findIndex((c) => c.id === id);

    if (consentIndex === -1) {
      return HttpResponse.json(
        { error: 'Consent not found' },
        { status: 404 }
      );
    }

    const consent = consents[consentIndex];
    
    if (!consent) {
      return HttpResponse.json(
        { error: 'Consent not found' },
        { status: 404 }
      );
    }
    
    // Update consent status
    consent.status = 'revoked';

    // Create audit event
    const credential = credentials.find((c) => c.id === consent.credentialId);
    const auditEvent: AuditEvent = {
      id: generateAuditEventId(),
      type: 'revoked',
      actor: credential?.holderName || 'Unknown',
      timestamp: new Date().toISOString(),
      details: `Consent revoked for ${consent.requesterName}`,
    };
    auditEvents.push(auditEvent);

    return HttpResponse.json(
      {
        success: true,
        message: 'Consent revoked successfully',
      },
      { status: 200 }
    );
  }),

  // ==========================================================================
  // POST /api/verify
  // Verify a credential by hash or proof
  // ==========================================================================
  http.post('/api/verify', async ({ request }) => {
    await delay(800); // Simulate blockchain verification time

    try {
      const body = await request.json() as VerifyPayload;

      // Validation
      if (!body.hash && !body.proof) {
        return HttpResponse.json(
          { 
            error: 'Invalid request',
            message: 'Either hash or proof must be provided',
          },
          { status: 400 }
        );
      }

      if (!body.verifierId) {
        return HttpResponse.json(
          { 
            error: 'Invalid request',
            message: 'verifierId is required',
          },
          { status: 400 }
        );
      }

      const hashToVerify = body.hash || body.proof || '';

      // Check if we have a mock result for this hash
      const mockResult = mockVerificationResults[hashToVerify];

      if (mockResult) {
        // Update verification timestamp
        const result: VerificationResult = {
          ...mockResult,
          verificationId: generateVerificationId(),
          verifiedAt: new Date().toISOString(),
        };

        // Create audit event
        const auditEvent: AuditEvent = {
          id: generateAuditEventId(),
          type: 'verified',
          actor: body.verifierId,
          timestamp: new Date().toISOString(),
          details: `Credential verification ${result.status}: ${result.message}`,
        };
        auditEvents.push(auditEvent);

        return HttpResponse.json(result, { status: 200 });
      }

      // If hash not found, check if it exists in credentials
      const credential = credentials.find((c) => c.credentialHash === hashToVerify);

      if (credential) {
        // Generate dynamic verification result
        let status: VerificationResult['status'] = 'verified';
        let message = 'Credential is valid and has been successfully verified';

        if (credential.status === 'revoked') {
          status = 'revoked';
          message = 'This credential has been revoked by the issuing authority';
        } else if (credential.status === 'expired' || 
                   (credential.expiresAt && new Date(credential.expiresAt) < new Date())) {
          status = 'expired';
          message = 'This credential has expired';
        } else if (credential.status === 'pending') {
          status = 'invalid';
          message = 'This credential is still pending approval';
        }

        const result: VerificationResult = {
          status,
          message,
          credentialHash: credential.credentialHash,
          issuer: 'Government Authority',
          issuedAt: credential.issuedAt,
          expiresAt: credential.expiresAt,
          holderName: credential.holderName,
          credentialType: credential.type,
          proofChain: [
            {
              issuer: 'Government Authority',
              issuedAt: credential.issuedAt,
              credentialType: credential.type,
            },
          ],
          consentRequired: false,
          verificationId: generateVerificationId(),
          verifiedAt: new Date().toISOString(),
        };

        // Create audit event
        const auditEvent: AuditEvent = {
          id: generateAuditEventId(),
          type: 'verified',
          actor: body.verifierId,
          timestamp: new Date().toISOString(),
          details: `Credential verification ${status}: ${message}`,
        };
        auditEvents.push(auditEvent);

        return HttpResponse.json(result, { status: 200 });
      }

      // Hash not found - invalid credential
      const invalidResult: VerificationResult = {
        status: 'invalid',
        message: 'Credential not found or invalid hash',
        credentialHash: hashToVerify,
        issuer: 'Unknown',
        issuedAt: new Date().toISOString(),
        credentialType: 'Unknown',
        proofChain: [],
        consentRequired: false,
        verificationId: generateVerificationId(),
        verifiedAt: new Date().toISOString(),
      };

      return HttpResponse.json(invalidResult, { status: 200 });
    } catch (error) {
      return HttpResponse.json(
        { error: 'Internal server error', message: 'Failed to verify credential' },
        { status: 500 }
      );
    }
  }),

  // ==========================================================================
  // GET /api/audit
  // Fetch audit events (optionally filtered by credentialId or type)
  // ==========================================================================
  http.get('/api/audit', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    let filtered = [...auditEvents];

    // Filter by type
    if (type) {
      filtered = filtered.filter((e) => e.type === type);
    }

    // Sort by timestamp descending (most recent first)
    filtered.sort((a, b) => {
      const dateA = typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp;
      const dateB = typeof b.timestamp === 'string' ? new Date(b.timestamp) : b.timestamp;
      return dateB.getTime() - dateA.getTime();
    });

    // Limit results
    filtered = filtered.slice(0, limit);

    return HttpResponse.json(
      {
        events: filtered,
        total: filtered.length,
      },
      { status: 200 }
    );
  }),

  // ==========================================================================
  // POST /api/credentials/:id/revoke
  // Revoke a credential
  // ==========================================================================
  http.post('/api/credentials/:id/revoke', async ({ params }) => {
    await delay(600);

    const { id } = params;
    const credentialIndex = credentials.findIndex((c) => c.id === id);

    if (credentialIndex === -1) {
      return HttpResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    const credential = credentials[credentialIndex];
    
    if (!credential) {
      return HttpResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    if (credential.status === 'revoked') {
      return HttpResponse.json(
        { error: 'Credential already revoked' },
        { status: 400 }
      );
    }

    // Update credential status
    credential.status = 'revoked';

    // Revoke all active consents for this credential
    consents = consents.map((consent) => 
      consent.credentialId === id && consent.status === 'active'
        ? { ...consent, status: 'revoked' }
        : consent
    );

    // Create audit event
    const auditEvent: AuditEvent = {
      id: generateAuditEventId(),
      type: 'revoked',
      actor: 'Issuing Authority',
      timestamp: new Date().toISOString(),
      details: `Credential revoked: ${credential.type} for ${credential.holderName}`,
    };
    auditEvents.push(auditEvent);

    return HttpResponse.json(
      {
        success: true,
        message: 'Credential revoked successfully',
        credential: credential,
      },
      { status: 200 }
    );
  }),

  // ==========================================================================
  // Error simulation endpoints (for testing error handling)
  // ==========================================================================
  http.get('/api/error/500', async () => {
    await delay(100);
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  // ==========================================================================
  // GET /api/users
  // Fetch all users (Admin only)
  // ==========================================================================
  http.get('/api/users', async () => {
    await delay(300);
    
    const { mockUsers } = await import('./data');
    return HttpResponse.json({
      users: mockUsers,
      total: mockUsers.length,
    });
  }),

  // ==========================================================================
  // PATCH /api/users/:id/status
  // Update user status (Admin only)
  // ==========================================================================
  http.patch('/api/users/:id/status', async ({ request, params }) => {
    await delay(200);
    
    const { mockUsers } = await import('./data');
    const { id } = params;
    const body = await request.json() as { status: string };
    
    const userIndex = mockUsers.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = mockUsers[userIndex];
    if (user) {
      user.status = body.status as 'active' | 'inactive' | 'suspended';
    }
    
    return HttpResponse.json({
      success: true,
      user: mockUsers[userIndex],
    });
  }),

  // ==========================================================================
  // DELETE /api/users/:id
  // Delete user (Admin only)
  // ==========================================================================
  http.delete('/api/users/:id', async ({ params }) => {
    await delay(200);
    
    const { mockUsers } = await import('./data');
    const { id } = params;
    
    const userIndex = mockUsers.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    mockUsers.splice(userIndex, 1);
    
    return HttpResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  }),

  http.get('/api/error/timeout', async () => {
    await delay(30000); // 30 second timeout
    return HttpResponse.json({ data: 'This will timeout' });
  }),

  http.get('/api/error/network', () => {
    return HttpResponse.error();
  }),
];
