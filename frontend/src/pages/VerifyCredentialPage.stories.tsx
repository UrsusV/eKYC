import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import VerifyCredentialPage from './VerifyCredentialPage';
import type { VerificationResult } from './VerifyCredentialPage';

const meta = {
  title: 'Pages/VerifyCredentialPage',
  component: VerifyCredentialPage,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A comprehensive page for verifying verifiable credentials. Supports both hash input and JSON proof file upload. Displays verification results with detailed credential information, proof chain, and downloadable PDF certificate.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    verifierId: {
      control: 'text',
      description: 'Unique identifier for the verifier',
    },
    verifierName: {
      control: 'text',
      description: 'Display name of the verifying organization',
    },
    apiBaseUrl: {
      control: 'text',
      description: 'Base URL for the verification API',
    },
    onConsentRequest: {
      action: 'consent-requested',
      description: 'Callback when user requests consent for protected credentials',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof VerifyCredentialPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock verification responses
const mockVerifiedResponse: VerificationResult = {
  status: 'verified',
  message: 'Credential has been successfully verified',
  credentialHash: 'a3f5e9d2c8b6f1a4d7e9c2b5a8f3e6d9c2b5a8f3e6d9c2b5a8f3e6d9',
  issuer: 'Government Identity Authority',
  issuedAt: '2025-01-15T10:30:00Z',
  expiresAt: '2026-01-15T10:30:00Z',
  holderName: 'John Doe',
  credentialType: 'National ID',
  proofChain: [
    {
      issuer: 'Root Certificate Authority',
      issuedAt: '2020-01-01T00:00:00Z',
      credentialType: 'Root Certificate',
    },
    {
      issuer: 'Intermediate Certificate Authority',
      issuedAt: '2023-06-15T08:00:00Z',
      credentialType: 'Intermediate Certificate',
    },
    {
      issuer: 'Government Identity Authority',
      issuedAt: '2025-01-15T10:30:00Z',
      credentialType: 'National ID',
    },
  ],
  consentRequired: false,
  verificationId: 'verification-abc123def456',
  verifiedAt: '2025-10-17T14:22:00Z',
};

const mockConsentRequiredResponse: VerificationResult = {
  ...mockVerifiedResponse,
  status: 'consent_required',
  message: 'Additional consent is required to access full credential details',
  consentRequired: true,
  consentId: 'consent-xyz789',
};

const mockInvalidResponse: VerificationResult = {
  ...mockVerifiedResponse,
  status: 'invalid',
  message: 'Credential could not be verified. The hash does not match any known credentials.',
  proofChain: [],
};

const mockRevokedResponse: VerificationResult = {
  ...mockVerifiedResponse,
  status: 'revoked',
  message: 'This credential has been revoked by the issuer',
};

const mockExpiredResponse: VerificationResult = {
  ...mockVerifiedResponse,
  status: 'expired',
  message: 'This credential has expired on January 15, 2026',
};

// Mock API setup
const setupMockAPI = (
  response: VerificationResult,
  delay = 1000
): (() => void) => {
  const originalFetch = global.fetch;
  
  global.fetch = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url.includes('/verify')) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => response,
          } as Response);
        }, delay);
      });
    }
    return originalFetch(url, options);
  });
  
  return () => {
    global.fetch = originalFetch;
  };
};

const setupErrorAPI = (errorMessage: string, delay = 1000): (() => void) => {
  const originalFetch = global.fetch;
  
  global.fetch = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url.includes('/verify')) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: false,
            json: async () => ({ message: errorMessage }),
          } as Response);
        }, delay);
      });
    }
    return originalFetch(url, options);
  });
  
  return () => {
    global.fetch = originalFetch;
  };
};

// ============================================================================
// Basic Stories
// ============================================================================

export const Default: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default state showing the verification form with hash input method selected.',
      },
    },
  },
};

export const HashInputMethod: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verification form with credential hash input method. Users can paste a credential hash to verify.',
      },
    },
  },
};

export const FileUploadMethod: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement as HTMLElement;
    const uploadButton = canvas.querySelector('button:has-text("Upload Proof File")') as HTMLButtonElement;
    if (uploadButton) {
      uploadButton.click();
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verification form with file upload method selected. Users can upload a JSON proof file.',
      },
    },
  },
};

// ============================================================================
// Verification Result Stories
// ============================================================================

export const VerifiedCredential: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async () => {
    setupMockAPI(mockVerifiedResponse, 500);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Successfully verified credential showing status card, certificate card, credential details, and proof chain. Includes download PDF button.',
      },
    },
  },
};

export const ConsentRequired: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
    onConsentRequest: (result) => {
      console.log('Consent requested for:', result);
    },
  },
  play: async () => {
    setupMockAPI(mockConsentRequiredResponse, 500);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verification result indicating that additional consent is required. Shows a consent request button.',
      },
    },
  },
};

export const InvalidCredential: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async () => {
    setupMockAPI(mockInvalidResponse, 500);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Invalid credential verification result. The credential hash does not match any known credentials.',
      },
    },
  },
};

export const RevokedCredential: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async () => {
    setupMockAPI(mockRevokedResponse, 500);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Revoked credential verification result. The credential has been revoked by the issuer.',
      },
    },
  },
};

export const ExpiredCredential: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async () => {
    setupMockAPI(mockExpiredResponse, 500);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Expired credential verification result. The credential is past its expiration date.',
      },
    },
  },
};

// ============================================================================
// Error State Stories
// ============================================================================

export const APIError: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async () => {
    setupErrorAPI('Invalid credential hash format', 500);
  },
  parameters: {
    docs: {
      description: {
        story:
          'API error response. Shows error message when the verification API returns an error.',
      },
    },
  },
};

export const NetworkError: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network connection failed'));
    return () => {
      global.fetch = originalFetch;
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'Network error scenario. Shows error message when the API request fails due to network issues.',
      },
    },
  },
};

// ============================================================================
// Loading State Stories
// ============================================================================

export const VerificationInProgress: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async () => {
    setupMockAPI(mockVerifiedResponse, 5000); // 5 second delay
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verification in progress. Shows loading spinner and disabled submit button during API call.',
      },
    },
  },
};

// ============================================================================
// Proof Chain Variations
// ============================================================================

export const SimpleProofChain: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async () => {
    setupMockAPI(
      {
        ...mockVerifiedResponse,
        proofChain: [
          {
            issuer: 'Root Certificate Authority',
            issuedAt: '2020-01-01T00:00:00Z',
            credentialType: 'Root Certificate',
          },
        ],
      },
      500
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Verified credential with a simple single-step proof chain.',
      },
    },
  },
};

export const ComplexProofChain: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async () => {
    setupMockAPI(
      {
        ...mockVerifiedResponse,
        proofChain: [
          {
            issuer: 'Root Certificate Authority',
            issuedAt: '2020-01-01T00:00:00Z',
            credentialType: 'Root Certificate',
          },
          {
            issuer: 'International Standards Authority',
            issuedAt: '2021-03-15T12:00:00Z',
            credentialType: 'International Certificate',
          },
          {
            issuer: 'National Accreditation Body',
            issuedAt: '2022-06-20T09:30:00Z',
            credentialType: 'National Accreditation',
          },
          {
            issuer: 'Regional Certification Center',
            issuedAt: '2023-09-10T14:15:00Z',
            credentialType: 'Regional Certificate',
          },
          {
            issuer: 'Government Identity Authority',
            issuedAt: '2025-01-15T10:30:00Z',
            credentialType: 'National ID',
          },
        ],
      },
      500
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Verified credential with a complex multi-step proof chain.',
      },
    },
  },
};

// ============================================================================
// Different Credential Types
// ============================================================================

export const EducationalCredential: Story = {
  args: {
    verifierId: 'university-verifier-456',
    verifierName: 'University Verification Service',
  },
  play: async () => {
    setupMockAPI(
      {
        ...mockVerifiedResponse,
        credentialType: 'Bachelor of Science Degree',
        issuer: 'Massachusetts Institute of Technology',
        holderName: 'Jane Smith',
        issuedAt: '2024-06-15T16:00:00Z',
        proofChain: [
          {
            issuer: 'Department of Education',
            issuedAt: '2020-01-01T00:00:00Z',
            credentialType: 'Accreditation Certificate',
          },
          {
            issuer: 'Massachusetts Institute of Technology',
            issuedAt: '2024-06-15T16:00:00Z',
            credentialType: 'Bachelor of Science Degree',
          },
        ],
      },
      500
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Educational credential verification (university degree).',
      },
    },
  },
};

export const ProfessionalLicense: Story = {
  args: {
    verifierId: 'licensing-board-789',
    verifierName: 'Professional Licensing Board',
  },
  play: async () => {
    setupMockAPI(
      {
        ...mockVerifiedResponse,
        credentialType: 'Medical License',
        issuer: 'State Medical Board',
        holderName: 'Dr. Robert Johnson',
        issuedAt: '2023-03-20T09:00:00Z',
        expiresAt: '2026-03-20T09:00:00Z',
        proofChain: [
          {
            issuer: 'National Medical Council',
            issuedAt: '2020-01-01T00:00:00Z',
            credentialType: 'Medical Council Registration',
          },
          {
            issuer: 'State Medical Board',
            issuedAt: '2023-03-20T09:00:00Z',
            credentialType: 'Medical License',
          },
        ],
      },
      500
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Professional license credential verification.',
      },
    },
  },
};

export const EmploymentCredential: Story = {
  args: {
    verifierId: 'employer-verifier-321',
    verifierName: 'Employment Verification Service',
  },
  play: async () => {
    setupMockAPI(
      {
        ...mockVerifiedResponse,
        credentialType: 'Employment Certificate',
        issuer: 'Tech Corporation Inc.',
        holderName: 'Alice Williams',
        issuedAt: '2022-09-01T08:00:00Z',
        expiresAt: undefined,
        proofChain: [
          {
            issuer: 'Chamber of Commerce',
            issuedAt: '2020-01-01T00:00:00Z',
            credentialType: 'Business Registration',
          },
          {
            issuer: 'Tech Corporation Inc.',
            issuedAt: '2022-09-01T08:00:00Z',
            credentialType: 'Employment Certificate',
          },
        ],
      },
      500
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Employment credential verification without expiration date.',
      },
    },
  },
};

// ============================================================================
// Custom API URL Story
// ============================================================================

export const CustomAPIURL: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
    apiBaseUrl: 'https://custom-api.example.com/v2',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Page configured with a custom API base URL for verification requests.',
      },
    },
  },
};

// ============================================================================
// Interactive Demo Stories
// ============================================================================

export const InteractiveHashVerification: Story = {
  args: {
    verifierId: 'demo-verifier-999',
    verifierName: 'Interactive Demo Verifier',
  },
  play: async () => {
    setupMockAPI(mockVerifiedResponse, 1500);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo: Paste a credential hash and click verify to see the full verification flow.',
      },
    },
  },
};

export const InteractiveFileUpload: Story = {
  args: {
    verifierId: 'demo-verifier-999',
    verifierName: 'Interactive Demo Verifier',
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement as HTMLElement;
    const uploadButton = canvas.querySelector('button:has-text("Upload Proof File")') as HTMLButtonElement;
    if (uploadButton) {
      uploadButton.click();
    }
    setupMockAPI(mockVerifiedResponse, 1500);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo: Upload a JSON proof file and verify. Try creating a JSON file with structure: {"credentialHash": "abc123", "proof": "..."}',
      },
    },
  },
};

// ============================================================================
// Fast and Slow API Stories
// ============================================================================

export const FastVerification: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async () => {
    setupMockAPI(mockVerifiedResponse, 200);
  },
  parameters: {
    docs: {
      description: {
        story: 'Fast API response (200ms) for testing quick verification scenarios.',
      },
    },
  },
};

export const SlowVerification: Story = {
  args: {
    verifierId: 'verifier-organization-123',
    verifierName: 'SecureVerify Inc.',
  },
  play: async () => {
    setupMockAPI(mockVerifiedResponse, 5000);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Slow API response (5s) for testing loading states and user patience scenarios.',
      },
    },
  },
};

// ============================================================================
// Complete Workflow Story
// ============================================================================

export const CompleteVerificationWorkflow: Story = {
  args: {
    verifierId: 'workflow-verifier-777',
    verifierName: 'Complete Workflow Demo',
    onConsentRequest: (result) => {
      alert(`Consent requested for credential: ${result.credentialType}`);
    },
  },
  play: async () => {
    const originalFetch = global.fetch;
    let callCount = 0;
    
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/verify')) {
        callCount++;
        const responses = [
          mockVerifiedResponse,
          mockConsentRequiredResponse,
          mockInvalidResponse,
          mockRevokedResponse,
          mockExpiredResponse,
        ];
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => responses[(callCount - 1) % responses.length],
            } as Response);
          }, 1000);
        });
      }
      return originalFetch(url);
    });
    
    return () => {
      global.fetch = originalFetch;
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complete workflow demonstration. Verify multiple times to see different verification results (verified → consent required → invalid → revoked → expired).',
      },
    },
  },
};
