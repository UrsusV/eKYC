import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import CredentialsPage from './CredentialsPage';

const meta: Meta<typeof CredentialsPage> = {
  title: 'Pages/CredentialsPage',
  component: CredentialsPage,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Credentials Dashboard Page

A comprehensive dashboard for managing digital identity credentials with:

- **Search & Filter**: Find credentials by name, email, type, or hash
- **Status Filtering**: Filter by active, pending, expired, or revoked
- **Sorting**: Sort by date or name
- **Statistics**: Quick overview of credential counts by status
- **Actions**: View, share, and revoke credentials
- **Empty States**: Helpful messages when no credentials exist
- **Loading States**: Skeleton loaders during data fetching
- **Responsive**: Mobile-friendly grid layout

## Features

### Search
Search across multiple fields including holder name, email, credential type, and hash.

### Filters
- **Status**: All, Active, Pending, Expired, Revoked
- **Sort**: Newest/Oldest First, Name A-Z/Z-A, By Type

### Credential Actions
- **View**: See detailed information (coming soon)
- **Share**: Copy credential hash for verification
- **Revoke**: Invalidate credential (for active credentials only)

### Statistics
Real-time counts of:
- Total credentials
- Active credentials
- Pending credentials
- Expired/Revoked credentials
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CredentialsPage>;

/**
 * Default view of the Credentials Dashboard with mock data loaded via MSW.
 * 
 * The page automatically fetches credentials from /api/credentials endpoint.
 */
export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        // MSW handlers are already configured globally
      ],
    },
    docs: {
      description: {
        story: 'Default view showing all credentials with search and filter controls.',
      },
    },
  },
};

/**
 * Dashboard with active credentials filter applied.
 */
export const ActiveOnly: Story = {
  parameters: {
    docs: {
      description: {
        story: 'View filtered to show only active credentials. Use the status filter dropdown to switch between different credential states.',
      },
    },
  },
};

/**
 * Empty state shown when user has no credentials yet.
 */
export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [
        // Override to return empty array
      ],
    },
    docs: {
      description: {
        story: 'Empty state displayed when no credentials exist.',
      },
    },
  },
};

/**
 * Search functionality demonstration.
 */
export const WithSearch: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Try searching for credentials by name, email, type, or hash in the search bar.',
      },
    },
  },
};

/**
 * Mobile responsive view.
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Credentials page optimized for mobile devices with single column layout.',
      },
    },
  },
};

/**
 * Tablet responsive view.
 */
export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Credentials page on tablet with two-column grid.',
      },
    },
  },
};
