import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CredentialsPage from './CredentialsPage';

// Mock fetch
global.fetch = jest.fn();

const mockCredentials = [
  {
    id: 'cred-001',
    holderName: 'Ahmed Rahman',
    holderEmail: 'ahmed.rahman@email.com',
    type: 'National ID',
    status: 'active' as const,
    issuedAt: '2024-10-15T10:30:00Z',
    expiresAt: '2029-10-15T10:30:00Z',
    credentialHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
  },
  {
    id: 'cred-002',
    holderName: 'Fatima Begum',
    holderEmail: 'fatima.begum@email.com',
    type: 'eTIN Certificate',
    status: 'active' as const,
    issuedAt: '2024-09-20T14:15:00Z',
    expiresAt: '2025-09-20T14:15:00Z',
    credentialHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab',
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CredentialsPage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ credentials: mockCredentials }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page title', () => {
    renderWithRouter(<CredentialsPage />);
    expect(screen.getByText('My Credentials')).toBeInTheDocument();
  });

  it('fetches and displays credentials', async () => {
    renderWithRouter(<CredentialsPage />);

    await waitFor(() => {
      expect(screen.getByText('Ahmed Rahman')).toBeInTheDocument();
      expect(screen.getByText('Fatima Begum')).toBeInTheDocument();
    });
  });

  it('displays search input', () => {
    renderWithRouter(<CredentialsPage />);
    const searchInput = screen.getByPlaceholderText(/search by name/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('displays filter dropdowns', () => {
    renderWithRouter(<CredentialsPage />);
    expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
  });

  it('displays statistics summary', async () => {
    renderWithRouter(<CredentialsPage />);

    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderWithRouter(<CredentialsPage />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty state when no credentials', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ credentials: [] }),
    });

    renderWithRouter(<CredentialsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no credentials yet/i)).toBeInTheDocument();
    });
  });
});
