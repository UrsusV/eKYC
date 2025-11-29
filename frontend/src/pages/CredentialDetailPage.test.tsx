import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CredentialDetailPage from './CredentialDetailPage';
import { ToastProvider } from '@/components/Toast';

// Mock fetch
global.fetch = jest.fn();

const mockCredential = {
  id: 'cred-001',
  holderName: 'Ahmed Rahman',
  holderEmail: 'ahmed.rahman@email.com',
  type: 'National ID',
  status: 'active' as const,
  issuedAt: '2024-10-15T10:30:00Z',
  expiresAt: '2029-10-15T10:30:00Z',
  credentialHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
  issuer: 'Bangladesh Government',
  nid: '1234567890123',
};

const mockAuditEvents = [
  {
    id: 'audit-001',
    credentialId: 'cred-001',
    type: 'issued' as const,
    actor: 'Government Authority',
    timestamp: '2024-10-15T10:30:00Z',
    details: 'Credential issued',
  },
  {
    id: 'audit-002',
    credentialId: 'cred-001',
    type: 'verified' as const,
    actor: 'Bank of Bangladesh',
    timestamp: '2024-10-16T14:20:00Z',
    details: 'Credential verified',
  },
];

const renderWithRouter = (component: React.ReactElement, initialRoute = '/credentials/cred-001') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastProvider>
        <Routes>
          <Route path="/credentials/:id" element={component} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('CredentialDetailPage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/credentials/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ credential: mockCredential }),
        });
      }
      if (url.includes('/api/audit/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ events: mockAuditEvents }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    renderWithRouter(<CredentialDetailPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('fetches and displays credential details', async () => {
    renderWithRouter(<CredentialDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Ahmed Rahman')).toBeInTheDocument();
    });

    expect(screen.getByText('National ID')).toBeInTheDocument();
    expect(screen.getByText('ahmed.rahman@email.com')).toBeInTheDocument();
  });

  it('displays credential hash', async () => {
    renderWithRouter(<CredentialDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/0x1a2b3c4d/)).toBeInTheDocument();
    });
  });

  it('displays issuer information', async () => {
    renderWithRouter(<CredentialDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Bangladesh Government')).toBeInTheDocument();
    });
  });

  it('displays status badge', async () => {
    renderWithRouter(<CredentialDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<CredentialDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/error loading credential/i)).toBeInTheDocument();
    });
  });

  it('displays audit timeline section', async () => {
    renderWithRouter(<CredentialDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/audit trail/i)).toBeInTheDocument();
    });
  });

  it('fetches audit events for the credential', async () => {
    renderWithRouter(<CredentialDetailPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/audit/credential/cred-001')
      );
    });
  });
});
