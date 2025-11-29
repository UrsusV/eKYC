import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CredentialCard, {
  Credential,
  CredentialCardProps,
} from './CredentialCard';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

describe('CredentialCard Component', () => {
  // Sample credential data
  const mockCredential: Credential = {
    id: 'cred-123',
    holderName: 'John Doe',
    nid: '1234567890',
    issuer: 'Government Authority',
    issuedAt: '2024-01-15T10:00:00Z',
    expiresAt: '2025-12-31T23:59:59Z',
    status: 'ACTIVE',
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    metadata: {
      document_type: 'National ID',
      verification_level: 'Level 3',
      issuing_authority: 'Ministry of Home Affairs',
    },
  };

  const mockOnShare = jest.fn();
  const mockOnRevoke = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render the credential card with all basic information', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
          onRevoke={mockOnRevoke}
        />
      );

      // Check holder name
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Check issuer
      expect(screen.getByText('Government Authority')).toBeInTheDocument();

      // Check NID
      expect(screen.getByText(/NID: 1234567890/)).toBeInTheDocument();

      // Check status
      expect(screen.getByRole('status', { name: /Status: ACTIVE/i })).toBeInTheDocument();
    });

    it('should render without NID if not provided', () => {
      const credentialWithoutNid: Credential = {
        ...mockCredential,
        nid: undefined,
      };

      render(
        <CredentialCard
          credential={credentialWithoutNid}
          onShare={mockOnShare}
        />
      );

      expect(screen.queryByText(/NID:/)).not.toBeInTheDocument();
    });

    it('should render issued date', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      expect(screen.getByText(/Issued:/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('should render expires date if provided', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      expect(screen.getByText(/Expires:/)).toBeInTheDocument();
      expect(screen.getByText(/Dec 31, 2025/)).toBeInTheDocument();
    });

    it('should not render expires date if not provided', () => {
      const credentialWithoutExpiry: Credential = {
        ...mockCredential,
        expiresAt: undefined,
      };

      render(
        <CredentialCard
          credential={credentialWithoutExpiry}
          onShare={mockOnShare}
        />
      );

      expect(screen.queryByText(/Expires:/)).not.toBeInTheDocument();
    });

    it('should render truncated hash', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      expect(screen.getByText('Credential Hash')).toBeInTheDocument();
      // Hash should be truncated
      expect(screen.getByText(/0x123456.../)).toBeInTheDocument();
    });
  });

  describe('Status Badge Colors', () => {
    it('should render ACTIVE status with green color', () => {
      render(
        <CredentialCard
          credential={{ ...mockCredential, status: 'ACTIVE' }}
          onShare={mockOnShare}
        />
      );

      const statusBadge = screen.getByRole('status', { name: /Status: ACTIVE/i });
      expect(statusBadge).toHaveClass('text-success');
    });

    it('should render REVOKED status with red color', () => {
      render(
        <CredentialCard
          credential={{ ...mockCredential, status: 'REVOKED' }}
          onShare={mockOnShare}
        />
      );

      const statusBadge = screen.getByRole('status', { name: /Status: REVOKED/i });
      expect(statusBadge).toHaveClass('text-danger');
    });

    it('should render PENDING status with amber color', () => {
      render(
        <CredentialCard
          credential={{ ...mockCredential, status: 'PENDING' }}
          onShare={mockOnShare}
        />
      );

      const statusBadge = screen.getByRole('status', { name: /Status: PENDING/i });
      expect(statusBadge).toHaveClass('text-warning');
    });
  });

  describe('Expired Credential', () => {
    it('should show expired warning for expired credentials', () => {
      const expiredCredential: Credential = {
        ...mockCredential,
        expiresAt: '2020-01-01T00:00:00Z', // Past date
      };

      render(
        <CredentialCard
          credential={expiredCredential}
          onShare={mockOnShare}
        />
      );

      expect(screen.getByText(/Expired:/)).toBeInTheDocument();
      expect(screen.getByLabelText('Expired')).toBeInTheDocument();
    });

    it('should not show expired warning for future expiry dates', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      expect(screen.getByText(/Expires:/)).toBeInTheDocument();
      expect(screen.queryByLabelText('Expired')).not.toBeInTheDocument();
    });
  });

  describe('Copy Hash Functionality', () => {
    it('should copy hash to clipboard when copy button is clicked', async () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const copyButton = screen.getByLabelText('Copy credential hash to clipboard');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(mockCredential.hash);
      });
    });

    it('should show success icon temporarily after copying', async () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const copyButton = screen.getByLabelText('Copy credential hash to clipboard');
      fireEvent.click(copyButton);

      // Success icon should be visible
      await waitFor(() => {
        expect(copyButton.querySelector('.text-success')).toBeInTheDocument();
      });
    });

    it('should handle clipboard copy errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));

      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const copyButton = screen.getByLabelText('Copy credential hash to clipboard');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Metadata Details Dropdown', () => {
    it('should show Details button when metadata is present', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('should not show Details button when metadata is empty', () => {
      const credentialWithoutMetadata: Credential = {
        ...mockCredential,
        metadata: undefined,
      };

      render(
        <CredentialCard
          credential={credentialWithoutMetadata}
          onShare={mockOnShare}
        />
      );

      expect(screen.queryByText('Details')).not.toBeInTheDocument();
      expect(screen.getByText('No Details')).toBeInTheDocument();
    });

    it('should toggle metadata visibility when Details button is clicked', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const detailsButton = screen.getByText('Details');

      // Initially collapsed
      expect(screen.queryByText('Document type:')).not.toBeInTheDocument();

      // Expand
      fireEvent.click(detailsButton);
      expect(screen.getByText('Document type:')).toBeInTheDocument();
      expect(screen.getByText('National ID')).toBeInTheDocument();

      // Collapse
      fireEvent.click(detailsButton);
      expect(screen.queryByText('Document type:')).not.toBeInTheDocument();
    });

    it('should render all metadata entries', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const detailsButton = screen.getByText('Details');
      fireEvent.click(detailsButton);

      expect(screen.getByText('Document type:')).toBeInTheDocument();
      expect(screen.getByText('National ID')).toBeInTheDocument();
      expect(screen.getByText('Verification level:')).toBeInTheDocument();
      expect(screen.getByText('Level 3')).toBeInTheDocument();
      expect(screen.getByText('Issuing authority:')).toBeInTheDocument();
      expect(screen.getByText('Ministry of Home Affairs')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for expandable section', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const detailsButton = screen.getByText('Details');

      expect(detailsButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(detailsButton);

      expect(detailsButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Action Buttons', () => {
    it('should call onShare when Share button is clicked', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const shareButton = screen.getByRole('button', { name: /Share credential/i });
      fireEvent.click(shareButton);

      expect(mockOnShare).toHaveBeenCalledWith(mockCredential.id);
      expect(mockOnShare).toHaveBeenCalledTimes(1);
    });

    it('should render Share button with proper label', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const shareButton = screen.getByRole('button', { name: /Share credential for John Doe/i });
      expect(shareButton).toBeInTheDocument();
      expect(shareButton).toHaveTextContent('Share');
    });

    it('should call onRevoke when Revoke button is clicked', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
          onRevoke={mockOnRevoke}
        />
      );

      const revokeButton = screen.getByRole('button', { name: /Revoke credential/i });
      fireEvent.click(revokeButton);

      expect(mockOnRevoke).toHaveBeenCalledWith(mockCredential.id);
      expect(mockOnRevoke).toHaveBeenCalledTimes(1);
    });

    it('should not render Revoke button when onRevoke is not provided', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      expect(screen.queryByRole('button', { name: /Revoke credential/i })).not.toBeInTheDocument();
    });

    it('should not render Revoke button when status is not ACTIVE', () => {
      render(
        <CredentialCard
          credential={{ ...mockCredential, status: 'REVOKED' }}
          onShare={mockOnShare}
          onRevoke={mockOnRevoke}
        />
      );

      expect(screen.queryByRole('button', { name: /Revoke credential/i })).not.toBeInTheDocument();
    });

    it('should render Revoke button only for ACTIVE credentials when onRevoke is provided', () => {
      render(
        <CredentialCard
          credential={{ ...mockCredential, status: 'ACTIVE' }}
          onShare={mockOnShare}
          onRevoke={mockOnRevoke}
        />
      );

      expect(screen.getByRole('button', { name: /Revoke credential/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role for the card', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'Credential for John Doe');
    });

    it('should have focus states on interactive elements', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
          onRevoke={mockOnRevoke}
        />
      );

      // Check Share button has focus styles
      const shareButton = screen.getByRole('button', { name: /Share credential/i });
      expect(shareButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');

      // Check Revoke button has focus styles
      const revokeButton = screen.getByRole('button', { name: /Revoke credential/i });
      expect(revokeButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-danger');

      // Check copy button has focus styles
      const copyButton = screen.getByLabelText('Copy credential hash to clipboard');
      expect(copyButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    });

    it('should have screen reader only text for credential ID', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const srOnlyText = screen.getByText(`Credential ID: ${mockCredential.id}`);
      expect(srOnlyText).toHaveClass('sr-only');
    });

    it('should have proper aria-label for status badge', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const statusBadge = screen.getByRole('status');
      expect(statusBadge).toHaveAttribute('aria-label', 'Status: ACTIVE');
    });

    it('should have keyboard accessible Details button', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const detailsButton = screen.getByText('Details');
      expect(detailsButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Visual States', () => {
    it('should apply hover effects to the card', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const card = screen.getByRole('article');
      expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
    });

    it('should rotate chevron icon when Details is expanded', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const detailsButton = screen.getByText('Details');
      const chevronIcon = detailsButton.querySelector('svg');

      // Initially not rotated
      expect(chevronIcon).not.toHaveClass('rotate-180');

      // Expand
      fireEvent.click(detailsButton);
      expect(chevronIcon).toHaveClass('rotate-180');

      // Collapse
      fireEvent.click(detailsButton);
      expect(chevronIcon).not.toHaveClass('rotate-180');
    });

    it('should show fade-in animation when metadata is expanded', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const detailsButton = screen.getByText('Details');
      fireEvent.click(detailsButton);

      const metadataSection = screen.getByRole('region', { name: 'Credential metadata' });
      expect(metadataSection).toHaveClass('animate-fadeIn');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation through all interactive elements', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
          onRevoke={mockOnRevoke}
        />
      );

      const shareButton = screen.getByRole('button', { name: /share/i });
      const revokeButton = screen.getByRole('button', { name: /revoke/i });
      const copyButton = screen.getByLabelText('Copy credential hash to clipboard');

      // All buttons should be in tab order
      expect(shareButton).toHaveAttribute('tabIndex', '0');
      expect(revokeButton).toHaveAttribute('tabIndex', '0');
      expect(copyButton).toHaveAttribute('tabIndex', '0');
    });

    it('should activate share button on Enter key', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const shareButton = screen.getByRole('button', { name: /share/i });
      shareButton.focus();

      fireEvent.keyDown(shareButton, { key: 'Enter', code: 'Enter' });

      expect(mockOnShare).toHaveBeenCalledWith(mockCredential.id);
    });

    it('should activate share button on Space key', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const shareButton = screen.getByRole('button', { name: /share/i });
      shareButton.focus();

      fireEvent.keyDown(shareButton, { key: ' ', code: 'Space' });

      expect(mockOnShare).toHaveBeenCalledWith(mockCredential.id);
    });

    it('should activate revoke button on Enter key', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
          onRevoke={mockOnRevoke}
        />
      );

      const revokeButton = screen.getByRole('button', { name: /revoke/i });
      revokeButton.focus();

      fireEvent.keyDown(revokeButton, { key: 'Enter', code: 'Enter' });

      expect(mockOnRevoke).toHaveBeenCalledWith(mockCredential.id);
    });

    it('should activate copy hash button on Enter key', async () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const copyButton = screen.getByLabelText('Copy credential hash to clipboard');
      copyButton.focus();

      fireEvent.keyDown(copyButton, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(mockCredential.hash);
      });
    });

    it('should toggle details section on Enter key', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      const detailsButton = screen.getByRole('button', { name: /details/i });
      expect(screen.queryByText('Document Type')).not.toBeInTheDocument();

      detailsButton.focus();
      fireEvent.keyDown(detailsButton, { key: 'Enter', code: 'Enter' });

      expect(screen.getByText('Document Type')).toBeInTheDocument();
    });
  });

  describe('Revoke Confirmation', () => {
    it('should trigger revoke callback without confirmation dialog', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
          onRevoke={mockOnRevoke}
        />
      );

      const revokeButton = screen.getByRole('button', { name: /revoke/i });
      fireEvent.click(revokeButton);

      expect(mockOnRevoke).toHaveBeenCalledWith(mockCredential.id);
      expect(mockOnRevoke).toHaveBeenCalledTimes(1);
    });

    it('should not render revoke button when onRevoke is not provided', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
        />
      );

      expect(screen.queryByRole('button', { name: /revoke/i })).not.toBeInTheDocument();
    });

    it('should not render revoke button for already revoked credentials', () => {
      const revokedCredential: Credential = {
        ...mockCredential,
        status: 'REVOKED',
      };

      render(
        <CredentialCard
          credential={revokedCredential}
          onShare={mockOnShare}
          onRevoke={mockOnRevoke}
        />
      );

      expect(screen.queryByRole('button', { name: /revoke/i })).not.toBeInTheDocument();
    });

    it('should handle revoke button click without crashing', () => {
      const mockRevokeWithDelay = jest.fn(() => {
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(
        <CredentialCard
          credential={mockCredential}
          onShare={mockOnShare}
          onRevoke={mockRevokeWithDelay}
        />
      );

      const revokeButton = screen.getByRole('button', { name: /revoke/i });
      fireEvent.click(revokeButton);

      expect(mockRevokeWithDelay).toHaveBeenCalledWith(mockCredential.id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long holder names', () => {
      const longNameCredential: Credential = {
        ...mockCredential,
        holderName: 'Very Long Name That Should Not Break The Layout And Should Wrap Properly',
      };

      render(
        <CredentialCard
          credential={longNameCredential}
          onShare={mockOnShare}
        />
      );

      expect(screen.getByText(longNameCredential.holderName)).toBeInTheDocument();
    });

    it('should handle empty metadata object', () => {
      const credentialWithEmptyMetadata: Credential = {
        ...mockCredential,
        metadata: {},
      };

      render(
        <CredentialCard
          credential={credentialWithEmptyMetadata}
          onShare={mockOnShare}
        />
      );

      expect(screen.queryByText('Details')).not.toBeInTheDocument();
    });

    it('should handle invalid date formats gracefully', () => {
      const invalidDateCredential: Credential = {
        ...mockCredential,
        issuedAt: 'invalid-date',
      };

      render(
        <CredentialCard
          credential={invalidDateCredential}
          onShare={mockOnShare}
        />
      );

      // Should still render, but with the original string
      expect(screen.getByText(/Issued:/)).toBeInTheDocument();
    });

    it('should handle very long hash strings', () => {
      const longHashCredential: Credential = {
        ...mockCredential,
        hash: '0x' + 'a'.repeat(200),
      };

      render(
        <CredentialCard
          credential={longHashCredential}
          onShare={mockOnShare}
        />
      );

      // Hash should be truncated and displayed
      const hashElement = screen.getByText(/0x.*\.\.\./);
      expect(hashElement).toBeInTheDocument();
    });
  });
});
