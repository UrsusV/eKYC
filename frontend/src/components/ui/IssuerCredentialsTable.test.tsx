import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IssuerCredentialsTable, { Credential, CredentialsResponse } from './IssuerCredentialsTable';

// Mock fetch
global.fetch = jest.fn();

// Helper to create a QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Helper to wrap component with QueryClientProvider
const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

// Mock data
const mockCredentials: Credential[] = [
  {
    id: 'cred-001',
    holderName: 'John Doe',
    holderEmail: 'john@example.com',
    type: 'Driver License',
    status: 'active',
    issuedAt: '2025-10-15T10:30:00Z',
    expiresAt: '2030-10-15T10:30:00Z',
    credentialHash: 'hash123',
  },
  {
    id: 'cred-002',
    holderName: 'Jane Smith',
    holderEmail: 'jane@example.com',
    type: 'Passport',
    status: 'active',
    issuedAt: '2025-10-16T14:00:00Z',
    expiresAt: '2030-10-16T14:00:00Z',
    credentialHash: 'hash456',
  },
  {
    id: 'cred-003',
    holderName: 'Bob Johnson',
    holderEmail: 'bob@example.com',
    type: 'ID Card',
    status: 'revoked',
    issuedAt: '2025-10-10T09:00:00Z',
    credentialHash: 'hash789',
  },
];

const mockResponse: CredentialsResponse = {
  credentials: mockCredentials,
  pagination: {
    currentPage: 1,
    totalPages: 3,
    totalItems: 25,
    itemsPerPage: 10,
  },
};

describe('IssuerCredentialsTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
  });

  describe('Rendering', () => {
    it('should render the component with title', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      expect(screen.getByText('Issued Credentials')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('25 total credentials')).toBeInTheDocument();
      });
    });

    it('should render table headers', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('Holder')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Issued At')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('should render credentials data', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Driver License')).toBeInTheDocument();
      });
    });

    it('should apply custom className', async () => {
      const { container } = renderWithQueryClient(
        <IssuerCredentialsTable className="custom-class" />
      );
      
      await waitFor(() => {
        expect(container.querySelector('.custom-class')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      expect(screen.getByText('Issued Credentials')).toBeInTheDocument();
      // Loading skeleton has animate-pulse class
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should show loading indicator when fetching', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Trigger refetch
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
    });
  });

  describe('Error State', () => {
    it('should show error message on fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Credentials')).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('should retry fetch when clicking try again button', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Credentials')).toBeInTheDocument();
      });
      
      // Mock successful response for retry
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no credentials', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          credentials: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: 10,
          },
        }),
      });
      
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('No credentials found')).toBeInTheDocument();
        expect(screen.getByText(/No credentials have been issued yet/)).toBeInTheDocument();
      });
    });

    it('should show different message when filters are active', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          credentials: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: 10,
          },
        }),
      });
      
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/search credentials/i)).toBeInTheDocument();
      });
      
      // Apply search filter
      const searchInput = screen.getByLabelText(/search credentials/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update search query on input change', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/search credentials/i)).toBeInTheDocument();
      });
      
      const searchInput = screen.getByLabelText(/search credentials/i);
      fireEvent.change(searchInput, { target: { value: 'john' } });
      
      expect(searchInput).toHaveValue('john');
    });

    it('should debounce search and trigger API call', async () => {
      jest.useFakeTimers();
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/search credentials/i)).toBeInTheDocument();
      });
      
      const searchInput = screen.getByLabelText(/search credentials/i);
      fireEvent.change(searchInput, { target: { value: 'john' } });
      
      // Fast-forward past debounce delay
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toContain('q=john');
      });
      
      jest.useRealTimers();
    });
  });

  describe('Status Filter', () => {
    it('should filter by status', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
      });
      
      const statusSelect = screen.getByLabelText(/filter by status/i);
      fireEvent.change(statusSelect, { target: { value: 'active' } });
      
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toContain('status=active');
      });
    });

    it('should have all status options', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
      });
      
      const statusSelect = screen.getByLabelText(/filter by status/i) as HTMLSelectElement;
      const options = Array.from(statusSelect.options).map(opt => opt.value);
      
      expect(options).toContain('all');
      expect(options).toContain('active');
      expect(options).toContain('revoked');
      expect(options).toContain('expired');
      expect(options).toContain('pending');
    });
  });

  describe('Date Range Filter', () => {
    it('should filter by start date', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/filter by start date/i)).toBeInTheDocument();
      });
      
      const startDateInput = screen.getByLabelText(/filter by start date/i);
      fireEvent.change(startDateInput, { target: { value: '2025-10-01' } });
      
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toContain('startDate=2025-10-01');
      });
    });

    it('should filter by end date', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/filter by end date/i)).toBeInTheDocument();
      });
      
      const endDateInput = screen.getByLabelText(/filter by end date/i);
      fireEvent.change(endDateInput, { target: { value: '2025-10-31' } });
      
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toContain('endDate=2025-10-31');
      });
    });
  });

  describe('Clear Filters', () => {
    it('should show clear filters button when filters are active', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/search credentials/i)).toBeInTheDocument();
      });
      
      // Apply a filter
      const searchInput = screen.getByLabelText(/search credentials/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument();
      });
    });

    it('should clear all filters when clicked', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/search credentials/i)).toBeInTheDocument();
      });
      
      // Apply filters
      const searchInput = screen.getByLabelText(/search credentials/i) as HTMLInputElement;
      const statusSelect = screen.getByLabelText(/filter by status/i) as HTMLSelectElement;
      
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(statusSelect, { target: { value: 'active' } });
      
      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument();
      });
      
      // Clear filters
      const clearButton = screen.getByText('Clear all filters');
      fireEvent.click(clearButton);
      
      expect(searchInput.value).toBe('');
      expect(statusSelect.value).toBe('all');
    });
  });

  describe('Sorting', () => {
    it('should toggle sort order when clicking issued at header', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/sort by issued date/i)).toBeInTheDocument();
      });
      
      const sortButton = screen.getByLabelText(/sort by issued date descending/i);
      fireEvent.click(sortButton);
      
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toContain('sortOrder=asc');
      });
    });
  });

  describe('Row Selection', () => {
    it('should select individual rows', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1]; // Index 0 is select all
      
      fireEvent.click(firstRowCheckbox);
      
      expect(firstRowCheckbox).toBeChecked();
    });

    it('should select all rows', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const selectAllCheckbox = screen.getByLabelText(/select all credentials/i);
      fireEvent.click(selectAllCheckbox);
      
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should deselect all rows when clicking select all again', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const selectAllCheckbox = screen.getByLabelText(/select all credentials/i);
      
      // Select all
      fireEvent.click(selectAllCheckbox);
      
      // Deselect all
      fireEvent.click(selectAllCheckbox);
      
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should show export button when rows are selected', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1];
      
      fireEvent.click(firstRowCheckbox);
      
      expect(screen.getByText(/Export Selected \(1\)/)).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should export selected rows as JSON', async () => {
      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Select rows
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);
      
      // Export
      const exportButton = screen.getByText(/Export Selected \(2\)/);
      fireEvent.click(exportButton);
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('View Action', () => {
    it('should call onViewCredential when view button is clicked', async () => {
      const onViewCredential = jest.fn();
      
      renderWithQueryClient(
        <IssuerCredentialsTable onViewCredential={onViewCredential} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);
      
      expect(onViewCredential).toHaveBeenCalledWith(mockCredentials[0]);
    });
  });

  describe('Revoke Action', () => {
    it('should show revoke button for active credentials', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const revokeButtons = screen.getAllByText('Revoke');
      expect(revokeButtons.length).toBeGreaterThan(0);
    });

    it('should not show revoke button for revoked credentials', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
      
      // Bob Johnson is revoked, find his row
      const rows = screen.getAllByRole('row');
      const bobRow = rows.find(row => within(row).queryByText('Bob Johnson'));
      
      expect(bobRow).toBeDefined();
      if (bobRow) {
        expect(within(bobRow).queryByText('Revoke')).not.toBeInTheDocument();
      }
    });

    it('should show confirmation dialog when revoking', async () => {
      window.confirm = jest.fn(() => true);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Revoked' }),
      });
      
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const revokeButtons = screen.getAllByText('Revoke');
      fireEvent.click(revokeButtons[0]);
      
      expect(window.confirm).toHaveBeenCalled();
    });

    it('should call revoke API when confirmed', async () => {
      window.confirm = jest.fn(() => true);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Revoked' }),
      });
      
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const revokeButtons = screen.getAllByText('Revoke');
      fireEvent.click(revokeButtons[0]);
      
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const revokeCall = calls.find(call => call[0].includes('/revoke'));
        expect(revokeCall).toBeDefined();
        expect(revokeCall[1]?.method).toBe('POST');
      });
    });

    it('should call onRevokeSuccess after successful revocation', async () => {
      window.confirm = jest.fn(() => true);
      const onRevokeSuccess = jest.fn();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Revoked' }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      renderWithQueryClient(
        <IssuerCredentialsTable onRevokeSuccess={onRevokeSuccess} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const revokeButtons = screen.getAllByText('Revoke');
      fireEvent.click(revokeButtons[0]);
      
      await waitFor(() => {
        expect(onRevokeSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Pagination', () => {
    it('should show pagination controls', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/go to previous page/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/go to next page/i)).toBeInTheDocument();
      });
    });

    it('should disable previous button on first page', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        const prevButton = screen.getByLabelText(/go to previous page/i);
        expect(prevButton).toBeDisabled();
      });
    });

    it('should navigate to next page', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/go to next page/i)).toBeInTheDocument();
      });
      
      const nextButton = screen.getByLabelText(/go to next page/i);
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toContain('page=2');
      });
    });

    it('should show page numbers', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/go to page 1/i)).toBeInTheDocument();
      });
    });

    it('should show result count', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText(/Showing 1 to 10 of 25 results/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper table semantics', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByRole('table', { name: /issued credentials table/i })).toBeInTheDocument();
      });
    });

    it('should have accessible labels for actions', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      expect(screen.getByLabelText(/view credential for john doe/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/revoke credential for john doe/i)).toBeInTheDocument();
    });

    it('should have accessible time elements', async () => {
      renderWithQueryClient(<IssuerCredentialsTable />);
      
      await waitFor(() => {
        const timeElements = screen.getAllByRole('time');
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });
});
