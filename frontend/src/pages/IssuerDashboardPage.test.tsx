import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import IssuerDashboardPage from './IssuerDashboardPage';
import { ToastProvider } from '@/components/Toast';

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
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ToastProvider>{component}</ToastProvider>
    </BrowserRouter>
  );
};

describe('IssuerDashboardPage', () => {
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
    renderWithRouter(<IssuerDashboardPage />);
    expect(screen.getByText('Issuer Dashboard')).toBeInTheDocument();
  });

  it('displays issue new credential button', () => {
    renderWithRouter(<IssuerDashboardPage />);
    expect(screen.getByText('Issue New Credential')).toBeInTheDocument();
  });

  it('opens modal when issue button is clicked', () => {
    renderWithRouter(<IssuerDashboardPage />);
    
    const issueButton = screen.getByText('Issue New Credential');
    fireEvent.click(issueButton);

    expect(screen.getByText('Issue New Credential', { selector: 'h2' })).toBeInTheDocument();
  });

  it('displays form fields in the modal', () => {
    renderWithRouter(<IssuerDashboardPage />);
    
    const issueButton = screen.getByText('Issue New Credential');
    fireEvent.click(issueButton);

    expect(screen.getByLabelText(/holder name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/credential type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', () => {
    renderWithRouter(<IssuerDashboardPage />);
    
    const issueButton = screen.getByText('Issue New Credential');
    fireEvent.click(issueButton);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Issue New Credential', { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithRouter(<IssuerDashboardPage />);
    
    const issueButton = screen.getByText('Issue New Credential');
    fireEvent.click(issueButton);

    const submitButton = screen.getByText('Issue Credential');
    fireEvent.click(submitButton);

    // Form should not submit without required fields
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/credentials'),
      expect.anything()
    );
  });

  it('displays credentials table', async () => {
    renderWithRouter(<IssuerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Ahmed Rahman')).toBeInTheDocument();
    });
  });

  it('shows credential type options in dropdown', () => {
    renderWithRouter(<IssuerDashboardPage />);
    
    const issueButton = screen.getByText('Issue New Credential');
    fireEvent.click(issueButton);

    const typeSelect = screen.getByLabelText(/credential type/i) as HTMLSelectElement;
    expect(typeSelect.options.length).toBeGreaterThan(1);
  });
});
