import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerifyCredentialPage from './VerifyCredentialPage';
import type { VerificationResult } from './VerifyCredentialPage';

// Mock jsPDF
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    rect: jest.fn(),
    line: jest.fn(),
    save: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('VerifyCredentialPage', () => {
  const mockVerifierId = 'verifier-123';
  const mockVerifierName = 'Test Verifier Organization';
  const mockOnConsentRequest = jest.fn();
  
  const mockVerifiedResult: VerificationResult = {
    status: 'verified',
    message: 'Credential has been successfully verified',
    credentialHash: 'abc123hash456def789',
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
        issuer: 'Government Identity Authority',
        issuedAt: '2025-01-15T10:30:00Z',
        credentialType: 'National ID',
      },
    ],
    consentRequired: false,
    verificationId: 'verification-789',
    verifiedAt: '2025-10-17T14:22:00Z',
  };
  
  const mockConsentRequiredResult: VerificationResult = {
    ...mockVerifiedResult,
    status: 'consent_required',
    message: 'Additional consent is required to access full credential details',
    consentRequired: true,
    consentId: 'consent-456',
  };
  
  const mockInvalidResult: VerificationResult = {
    ...mockVerifiedResult,
    status: 'invalid',
    message: 'Credential could not be verified',
    proofChain: [],
  };
  
  const mockRevokedResult: VerificationResult = {
    ...mockVerifiedResult,
    status: 'revoked',
    message: 'This credential has been revoked by the issuer',
  };
  
  const mockExpiredResult: VerificationResult = {
    ...mockVerifiedResult,
    status: 'expired',
    message: 'This credential has expired',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Rendering', () => {
    it('should render the page title and description', () => {
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      expect(screen.getByText('Verify Credential')).toBeInTheDocument();
      expect(
        screen.getByText('Verify the authenticity and validity of a verifiable credential')
      ).toBeInTheDocument();
    });

    it('should render verification method selection buttons', () => {
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      expect(screen.getByText('Credential Hash')).toBeInTheDocument();
      expect(screen.getByText('Upload Proof File')).toBeInTheDocument();
    });

    it('should render hash input by default', () => {
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      expect(screen.getByLabelText('Credential Hash')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Paste the credential hash here...')
      ).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
          className="custom-class"
        />
      );
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain('custom-class');
    });
  });

  // ============================================================================
  // Input Method Selection Tests
  // ============================================================================

  describe('Input Method Selection', () => {
    it('should switch to file upload mode', async () => {
      const user = userEvent.setup();
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const uploadButton = screen.getByText('Upload Proof File').closest('button')!;
      await user.click(uploadButton);
      
      expect(screen.getByLabelText('Proof File (JSON)')).toBeInTheDocument();
      expect(screen.getByText('Click to upload or drag and drop')).toBeInTheDocument();
    });

    it('should switch back to hash input mode', async () => {
      const user = userEvent.setup();
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      // Switch to upload
      const uploadButton = screen.getByText('Upload Proof File').closest('button')!;
      await user.click(uploadButton);
      
      // Switch back to hash
      const hashButton = screen.getByText('Credential Hash').closest('button')!;
      await user.click(hashButton);
      
      expect(screen.getByLabelText('Credential Hash')).toBeInTheDocument();
    });

    it('should highlight selected input method', async () => {
      const user = userEvent.setup();
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const hashButton = screen.getByText('Credential Hash').closest('button')!;
      const uploadButton = screen.getByText('Upload Proof File').closest('button')!;
      
      // Hash should be selected by default
      expect(hashButton.className).toContain('border-primary-600');
      expect(uploadButton.className).toContain('border-neutral-200');
      
      // Switch to upload
      await user.click(uploadButton);
      expect(uploadButton.className).toContain('border-primary-600');
    });
  });

  // ============================================================================
  // Hash Input Tests
  // ============================================================================

  describe('Hash Input', () => {
    it('should update hash input value', async () => {
      const user = userEvent.setup();
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash') as HTMLTextAreaElement;
      await user.type(input, 'test-hash-123');
      
      expect(input.value).toBe('test-hash-123');
    });

    it('should submit verification with hash', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerifiedResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash-123');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            verifierId: mockVerifierId,
            hash: 'test-hash-123',
          }),
        });
      });
    });
  });

  // ============================================================================
  // File Upload Tests
  // ============================================================================

  describe('File Upload', () => {
    it('should handle JSON file upload', async () => {
      const user = userEvent.setup();
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      // Switch to upload mode
      const uploadButton = screen.getByText('Upload Proof File').closest('button')!;
      await user.click(uploadButton);
      
      const file = new File(
        [JSON.stringify({ credentialHash: 'test-hash', proof: 'test-proof' })],
        'proof.json',
        { type: 'application/json' }
      );
      
      const input = screen.getByLabelText('Proof File (JSON)') as HTMLInputElement;
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('proof.json')).toBeInTheDocument();
      });
    });

    it('should show error for non-JSON file', async () => {
      const user = userEvent.setup();
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      // Switch to upload mode
      const uploadButton = screen.getByText('Upload Proof File').closest('button')!;
      await user.click(uploadButton);
      
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      const input = screen.getByLabelText('Proof File (JSON)') as HTMLInputElement;
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('Please upload a valid JSON file')).toBeInTheDocument();
      });
    });

    it('should show error for invalid JSON content', async () => {
      const user = userEvent.setup();
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      // Switch to upload mode
      const uploadButton = screen.getByText('Upload Proof File').closest('button')!;
      await user.click(uploadButton);
      
      const file = new File(['invalid json'], 'proof.json', {
        type: 'application/json',
      });
      
      const input = screen.getByLabelText('Proof File (JSON)') as HTMLInputElement;
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid JSON proof file')).toBeInTheDocument();
      });
    });

    it('should submit verification with proof file', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerifiedResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      // Switch to upload mode
      const uploadButton = screen.getByText('Upload Proof File').closest('button')!;
      await user.click(uploadButton);
      
      const proofData = { credentialHash: 'test-hash', proof: 'test-proof' };
      const file = new File([JSON.stringify(proofData)], 'proof.json', {
        type: 'application/json',
      });
      
      const input = screen.getByLabelText('Proof File (JSON)') as HTMLInputElement;
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('proof.json')).toBeInTheDocument();
      });
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            verifierId: mockVerifierId,
            proof: JSON.stringify(proofData),
            hash: 'test-hash',
          }),
        });
      });
    });
  });

  // ============================================================================
  // Form Submission Tests
  // ============================================================================

  describe('Form Submission', () => {
    it('should disable submit button when no input provided', () => {
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const verifyButton = screen.getByText('Verify Credential');
      expect(verifyButton).toBeDisabled();
    });

    it('should enable submit button when hash is provided', async () => {
      const user = userEvent.setup();
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      expect(verifyButton).not.toBeDisabled();
    });

    it('should show loading state during verification', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => mockVerifiedResult }), 1000))
      );
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      expect(screen.getByText('Verifying...')).toBeInTheDocument();
      expect(verifyButton).toBeDisabled();
    });

    it('should show error message on API failure', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Verification Error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle API error response', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credential hash' }),
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'invalid-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credential hash')).toBeInTheDocument();
      });
    });

    it('should use custom API base URL', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerifiedResult,
      });
      
      render(
        <VerifyCredentialPage
          apiBaseUrl="https://custom-api.example.com"
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://custom-api.example.com/verify',
          expect.any(Object)
        );
      });
    });
  });

  // ============================================================================
  // Verified Result Tests
  // ============================================================================

  describe('Verified Result', () => {
    it('should display verified status card', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerifiedResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Credential Verified')).toBeInTheDocument();
        expect(
          screen.getByText('Credential has been successfully verified')
        ).toBeInTheDocument();
      });
    });

    it('should display verification certificate card', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerifiedResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Verification Certificate')).toBeInTheDocument();
        expect(screen.getByText('verification-789')).toBeInTheDocument();
        expect(screen.getByText(mockVerifierName)).toBeInTheDocument();
      });
    });

    it('should display credential details', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerifiedResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Credential Details')).toBeInTheDocument();
        expect(screen.getByText('National ID')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Government Identity Authority')).toBeInTheDocument();
      });
    });

    it('should display proof chain', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerifiedResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Proof Chain')).toBeInTheDocument();
        expect(screen.getByText('Root Certificate Authority')).toBeInTheDocument();
        expect(screen.getByText(/Type: Root Certificate/)).toBeInTheDocument();
      });
    });

    it('should show download PDF button', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerifiedResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Download PDF Certificate')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Consent Required Tests
  // ============================================================================

  describe('Consent Required', () => {
    it('should display consent required status', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConsentRequiredResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
          onConsentRequest={mockOnConsentRequest}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Consent Required')).toBeInTheDocument();
        expect(
          screen.getByText('Additional consent is required to access full credential details')
        ).toBeInTheDocument();
      });
    });

    it('should show request consent button', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConsentRequiredResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
          onConsentRequest={mockOnConsentRequest}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Request Consent')).toBeInTheDocument();
      });
    });

    it('should call onConsentRequest callback', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConsentRequiredResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
          onConsentRequest={mockOnConsentRequest}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Request Consent')).toBeInTheDocument();
      });
      
      const consentButton = screen.getByText('Request Consent');
      await user.click(consentButton);
      
      expect(mockOnConsentRequest).toHaveBeenCalledWith(mockConsentRequiredResult);
    });
  });

  // ============================================================================
  // Invalid/Revoked/Expired Status Tests
  // ============================================================================

  describe('Other Status Types', () => {
    it('should display invalid status', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvalidResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(
          screen.getByText('Credential could not be verified')
        ).toBeInTheDocument();
      });
    });

    it('should display revoked status', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRevokedResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Credential Revoked')).toBeInTheDocument();
        expect(
          screen.getByText('This credential has been revoked by the issuer')
        ).toBeInTheDocument();
      });
    });

    it('should display expired status', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExpiredResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Credential Expired')).toBeInTheDocument();
        expect(screen.getByText('This credential has expired')).toBeInTheDocument();
      });
    });

    it('should not show certificate card for non-verified status', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvalidResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Verification Certificate')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Reset/Clear Functionality Tests
  // ============================================================================

  describe('Reset Functionality', () => {
    it('should clear form when Clear button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash') as HTMLTextAreaElement;
      await user.type(input, 'test-hash');
      
      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);
      
      expect(input.value).toBe('');
    });

    it('should reset form after verification', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerifiedResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Credential Verified')).toBeInTheDocument();
      });
      
      const resetButton = screen.getByText('Verify Another Credential');
      await user.click(resetButton);
      
      expect(screen.getByText('Verify Credential')).toBeInTheDocument();
      expect(screen.queryByText('Credential Verified')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // PDF Generation Tests
  // ============================================================================

  describe('PDF Generation', () => {
    it('should generate PDF when download button is clicked', async () => {
      const { jsPDF } = require('jspdf');
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerifiedResult,
      });
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Download PDF Certificate')).toBeInTheDocument();
      });
      
      const downloadButton = screen.getByText('Download PDF Certificate');
      await user.click(downloadButton);
      
      expect(jsPDF).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      expect(screen.getByLabelText('Credential Hash')).toBeInTheDocument();
    });

    it('should show error with proper role', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );
      
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      const input = screen.getByLabelText('Credential Hash');
      await user.type(input, 'test-hash');
      
      const verifyButton = screen.getByText('Verify Credential');
      await user.click(verifyButton);
      
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
      });
    });

    it('should have descriptive button text', () => {
      render(
        <VerifyCredentialPage
          verifierId={mockVerifierId}
          verifierName={mockVerifierName}
        />
      );
      
      expect(screen.getByText('Verify Credential')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });
});
