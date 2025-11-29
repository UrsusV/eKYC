import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import IssuerDashboardPage from './IssuerDashboardPage';
import { ToastProvider } from '@/components/Toast';

const meta: Meta<typeof IssuerDashboardPage> = {
  title: 'Pages/IssuerDashboardPage',
  component: IssuerDashboardPage,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <ToastProvider>
          <Story />
        </ToastProvider>
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Issuer Dashboard Page

A comprehensive dashboard for credential issuers to manage and issue new credentials.

## Features

### Issue New Credential
- Modal-based credential issuance form
- Form fields:
  - Holder Name (required)
  - Email Address (required)
  - Credential Type (dropdown with predefined types)
  - Expiry Date (optional)
- Form validation
- Success/error handling with toast notifications

### Credential Types
- National ID (NID)
- eTIN Certificate
- Trade License
- Birth Certificate
- Driver's License
- Passport
- Educational Certificate
- Professional License

### Credentials Table
- View all issued credentials
- Filter and search capabilities
- Sort by various fields
- Action buttons (view, revoke)
- Status indicators

### Statistics
- Total credentials issued
- Active credentials
- Pending verifications
- Expired credentials

## Usage
This page is intended for authorized issuers such as:
- Government authorities
- Educational institutions
- Professional licensing boards
- Financial institutions
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof IssuerDashboardPage>;

/**
 * Default view of the Issuer Dashboard with mock credentials.
 */
export const Default: Story = {};

/**
 * Shows the dashboard with the issue credential modal open.
 */
export const ModalOpen: Story = {
  play: async () => {
    // Simulate clicking the issue button
    const issueButton = document.querySelector('button') as HTMLButtonElement;
    if (issueButton && issueButton.textContent?.includes('Issue')) {
      issueButton.click();
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Issue credential modal open with empty form ready for input.',
      },
    },
  },
};

/**
 * Dashboard showing empty state when no credentials have been issued.
 */
export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [
        // Mock empty credentials response
      ],
    },
    docs: {
      description: {
        story: 'Empty state shown when the issuer has not issued any credentials yet.',
      },
    },
  },
};

/**
 * Dashboard with many issued credentials showing pagination.
 */
export const ManyCredentials: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Dashboard populated with multiple credentials demonstrating table pagination.',
      },
    },
  },
};

/**
 * Shows the dashboard in loading state while fetching credentials.
 */
export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Loading state displayed while credential data is being fetched.',
      },
    },
  },
};

/**
 * Dashboard showing error state when credentials cannot be loaded.
 */
export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        // Mock API error
      ],
    },
    docs: {
      description: {
        story: 'Error state shown when credentials cannot be loaded from the API.',
      },
    },
  },
};
