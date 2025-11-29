import { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import IssuerCredentialsTable, { Credential, CredentialsResponse } from './IssuerCredentialsTable';

// Create QueryClient for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const meta: Meta<typeof IssuerCredentialsTable> = {
  title: 'Components/IssuerCredentialsTable',
  component: IssuerCredentialsTable,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'IssuerCredentialsTable displays a paginated, filterable, and sortable table of issued credentials with actions for viewing, revoking, and exporting credentials. Uses React Query for data fetching.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof IssuerCredentialsTable>;

// ============================================================================
// Mock Data
// ============================================================================

const generateMockCredentials = (count: number, page: number = 1): Credential[] => {
  const types = ['Driver License', 'Passport', 'ID Card', 'Birth Certificate', 'Degree Certificate'];
  const statuses: Array<'active' | 'revoked' | 'expired' | 'pending'> = ['active', 'revoked', 'expired', 'pending'];
  
  return Array.from({ length: count }, (_, i) => {
    const index = (page - 1) * count + i;
    const status = statuses[index % statuses.length];
    
    return {
      id: `cred-${String(index + 1).padStart(3, '0')}`,
      holderName: `User ${index + 1}`,
      holderEmail: `user${index + 1}@example.com`,
      type: types[index % types.length],
      status,
      issuedAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
      expiresAt: status !== 'revoked' ? new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString() : undefined,
      credentialHash: `hash-${index + 1}`,
    };
  });
};

// ============================================================================
// Mock API Handler
// ============================================================================

const setupMockAPI = (
  credentials: Credential[],
  delay: number = 500,
  shouldError: boolean = false
) => {
  const originalFetch = global.fetch;
  
  global.fetch = jest.fn((url: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldError) {
          reject(new Error('Network connection failed'));
          return;
        }
        
        // Parse URL to get query params
        const urlObj = new URL(url, 'http://localhost');
        const page = parseInt(urlObj.searchParams.get('page') || '1');
        const q = urlObj.searchParams.get('q');
        const status = urlObj.searchParams.get('status');
        
        // Filter credentials
        let filtered = [...credentials];
        
        if (q) {
          filtered = filtered.filter(c =>
            c.holderName.toLowerCase().includes(q.toLowerCase()) ||
            c.holderEmail.toLowerCase().includes(q.toLowerCase()) ||
            c.type.toLowerCase().includes(q.toLowerCase())
          );
        }
        
        if (status && status !== 'all') {
          filtered = filtered.filter(c => c.status === status);
        }
        
        // Pagination
        const itemsPerPage = 10;
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginated = filtered.slice(start, end);
        
        const response: CredentialsResponse = {
          credentials: paginated,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filtered.length / itemsPerPage),
            totalItems: filtered.length,
            itemsPerPage,
          },
        };
        
        resolve({
          ok: true,
          json: async () => response,
        } as Response);
      }, delay);
    });
  }) as jest.Mock;
  
  return () => {
    global.fetch = originalFetch;
  };
};

// ============================================================================
// Stories
// ============================================================================

/**
 * Default table with typical credential data
 */
export const Default: Story = {
  render: () => {
    const credentials = generateMockCredentials(25);
    setupMockAPI(credentials);
    
    return <IssuerCredentialsTable />;
  },
};

/**
 * Table with loading state (slow network)
 */
export const Loading: Story = {
  render: () => {
    const credentials = generateMockCredentials(10);
    setupMockAPI(credentials, 5000); // 5 second delay
    
    return <IssuerCredentialsTable />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the loading skeleton while fetching data from the API.',
      },
    },
  },
};

/**
 * Table with error state
 */
export const ErrorState: Story = {
  render: () => {
    setupMockAPI([], 500, true);
    
    return <IssuerCredentialsTable />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows error message when API request fails with retry button.',
      },
    },
  },
};

/**
 * Empty table with no credentials
 */
export const Empty: Story = {
  render: () => {
    setupMockAPI([]);
    
    return <IssuerCredentialsTable />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows empty state when no credentials have been issued.',
      },
    },
  },
};

/**
 * Table with many credentials (100+)
 */
export const ManyCredentials: Story = {
  render: () => {
    const credentials = generateMockCredentials(150);
    setupMockAPI(credentials);
    
    return <IssuerCredentialsTable />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with 150 credentials demonstrating pagination across 15 pages.',
      },
    },
  },
};

/**
 * Table with only active credentials
 */
export const OnlyActive: Story = {
  render: () => {
    const credentials = generateMockCredentials(20).map(c => ({
      ...c,
      status: 'active' as const,
    }));
    setupMockAPI(credentials);
    
    return <IssuerCredentialsTable />;
  },
  parameters: {
    docs: {
      description: {
        story: 'All credentials are active, showing only the "Revoke" action button.',
      },
    },
  },
};

/**
 * Table with mixed statuses
 */
export const MixedStatuses: Story = {
  render: () => {
    const credentials = [
      ...generateMockCredentials(5).map(c => ({ ...c, status: 'active' as const })),
      ...generateMockCredentials(5).map(c => ({ ...c, status: 'revoked' as const })),
      ...generateMockCredentials(5).map(c => ({ ...c, status: 'expired' as const })),
      ...generateMockCredentials(5).map(c => ({ ...c, status: 'pending' as const })),
    ];
    setupMockAPI(credentials);
    
    return <IssuerCredentialsTable />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates all credential statuses with their respective badge colors.',
      },
    },
  },
};

/**
 * Interactive demo with callbacks
 */
export const WithCallbacks: Story = {
  render: () => {
    const credentials = generateMockCredentials(25);
    setupMockAPI(credentials);
    
    const handleView = (credential: Credential) => {
      alert(`Viewing credential:\n\nID: ${credential.id}\nHolder: ${credential.holderName}\nType: ${credential.type}`);
    };
    
    const handleRevokeSuccess = (credential: Credential) => {
      alert(`Successfully revoked credential for ${credential.holderName}`);
    };
    
    return (
      <IssuerCredentialsTable
        onViewCredential={handleView}
        onRevokeSuccess={handleRevokeSuccess}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the onViewCredential and onRevokeSuccess callbacks. Click "View" or "Revoke" to see alerts.',
      },
    },
  },
};

/**
 * Table with search pre-applied
 */
export const WithSearch: Story = {
  render: () => {
    const credentials = generateMockCredentials(50);
    setupMockAPI(credentials);
    
    return <IssuerCredentialsTable />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the search input to filter credentials by name, email, or type. Search is debounced by 300ms.',
      },
    },
  },
};

/**
 * Table with filters applied
 */
export const WithFilters: Story = {
  render: () => {
    const credentials = generateMockCredentials(50);
    setupMockAPI(credentials);
    
    return <IssuerCredentialsTable />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Apply filters by status or date range to narrow down results. Click "Clear all filters" to reset.',
      },
    },
  },
};

/**
 * Demonstrates row selection and export
 */
export const RowSelection: Story = {
  render: () => {
    const credentials = generateMockCredentials(20);
    setupMockAPI(credentials);
    
    return (
      <div>
        <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <h3 className="font-semibold text-primary-900 mb-2">Try these actions:</h3>
          <ul className="text-sm text-primary-800 space-y-1 list-disc list-inside">
            <li>Check individual credential checkboxes</li>
            <li>Use "Select All" to select all visible credentials</li>
            <li>Click "Export Selected" to download as JSON</li>
          </ul>
        </div>
        <IssuerCredentialsTable />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Select credentials using checkboxes and export selected rows as JSON.',
      },
    },
  },
};

/**
 * Demonstrates sorting functionality
 */
export const Sorting: Story = {
  render: () => {
    const credentials = generateMockCredentials(30);
    setupMockAPI(credentials);
    
    return (
      <div>
        <div className="mb-4 p-4 bg-secondary-50 border border-secondary-200 rounded-lg">
          <h3 className="font-semibold text-secondary-900 mb-2">Sorting:</h3>
          <p className="text-sm text-secondary-800">
            Click the "Issued At" column header to toggle between ascending and descending order.
          </p>
        </div>
        <IssuerCredentialsTable />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the "Issued At" column header to sort credentials by date.',
      },
    },
  },
};

/**
 * Demonstrates pagination
 */
export const Pagination: Story = {
  render: () => {
    const credentials = generateMockCredentials(75);
    setupMockAPI(credentials);
    
    return (
      <div>
        <div className="mb-4 p-4 bg-success-50 border border-success-200 rounded-lg">
          <h3 className="font-semibold text-success-900 mb-2">Pagination:</h3>
          <ul className="text-sm text-success-800 space-y-1 list-disc list-inside">
            <li>Navigate pages using "Previous" and "Next" buttons</li>
            <li>Click page numbers to jump directly</li>
            <li>View result count at the bottom</li>
          </ul>
        </div>
        <IssuerCredentialsTable />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with 75 credentials across 8 pages demonstrating pagination controls.',
      },
    },
  },
};

/**
 * Fast API response
 */
export const FastAPI: Story = {
  render: () => {
    const credentials = generateMockCredentials(25);
    setupMockAPI(credentials, 100); // 100ms delay
    
    return <IssuerCredentialsTable />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Simulates a fast API response (100ms) for optimal user experience.',
      },
    },
  },
};

/**
 * Slow API response
 */
export const SlowAPI: Story = {
  render: () => {
    const credentials = generateMockCredentials(25);
    setupMockAPI(credentials, 3000); // 3 second delay
    
    return <IssuerCredentialsTable />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Simulates a slow API response (3 seconds) showing loading states.',
      },
    },
  },
};

/**
 * Custom API base URL
 */
export const CustomAPIBaseURL: Story = {
  render: () => {
    const credentials = generateMockCredentials(25);
    setupMockAPI(credentials);
    
    return <IssuerCredentialsTable apiBaseUrl="https://api.example.com" />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates using a custom API base URL via the apiBaseUrl prop.',
      },
    },
  },
};

/**
 * With custom styling
 */
export const CustomStyling: Story = {
  render: () => {
    const credentials = generateMockCredentials(25);
    setupMockAPI(credentials);
    
    return (
      <IssuerCredentialsTable className="shadow-2xl border-4 border-primary-300" />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with custom CSS classes applied via the className prop.',
      },
    },
  },
};

/**
 * Complete workflow demo
 */
export const CompleteWorkflow: Story = {
  render: () => {
    const [credentials, setCredentials] = useState(generateMockCredentials(30));
    
    // Setup mock API with stateful credentials
    const originalFetch = global.fetch;
    global.fetch = jest.fn((url: string) => {
      const urlObj = new URL(url, 'http://localhost');
      const isRevoke = url.includes('/revoke');
      
      if (isRevoke) {
        const credentialId = url.split('/')[4];
        setCredentials(prev =>
          prev.map(c =>
            c.id === credentialId ? { ...c, status: 'revoked' as const } : c
          )
        );
        
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, message: 'Credential revoked' }),
        } as Response);
      }
      
      // Regular fetch
      const page = parseInt(urlObj.searchParams.get('page') || '1');
      const itemsPerPage = 10;
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginated = credentials.slice(start, end);
      
      return Promise.resolve({
        ok: true,
        json: async () => ({
          credentials: paginated,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(credentials.length / itemsPerPage),
            totalItems: credentials.length,
            itemsPerPage,
          },
        }),
      } as Response);
    }) as jest.Mock;
    
    return (
      <div>
        <div className="mb-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <h3 className="font-semibold text-warning-900 mb-2">Complete Workflow:</h3>
          <ol className="text-sm text-warning-800 space-y-1 list-decimal list-inside">
            <li>View credentials in the table</li>
            <li>Use search and filters to find specific credentials</li>
            <li>Select credentials using checkboxes</li>
            <li>Export selected credentials as JSON</li>
            <li>Click "View" to see credential details</li>
            <li>Click "Revoke" to revoke active credentials</li>
            <li>Navigate pages to see more credentials</li>
          </ol>
        </div>
        <IssuerCredentialsTable
          onViewCredential={(cred) => console.log('View:', cred)}
          onRevokeSuccess={(cred) => console.log('Revoked:', cred)}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive demo showing all features working together with state updates.',
      },
    },
  },
};
