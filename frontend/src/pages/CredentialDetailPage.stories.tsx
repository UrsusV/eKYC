import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CredentialDetailPage from './CredentialDetailPage';
import { ToastProvider } from '@/components/Toast';

const meta: Meta<typeof CredentialDetailPage> = {
  title: 'Pages/CredentialDetailPage',
  component: CredentialDetailPage,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <MemoryRouter initialEntries={['/credentials/cred-001']}>
          <Routes>
            <Route path="/credentials/:id" element={<Story />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Credential Detail Page

Displays comprehensive information about a specific credential including:

- **Credential Information**: Type, status, holder details, issuer
- **Verification Hash**: Cryptographic hash with copy functionality
- **QR Code**: Placeholder for credential QR code generation
- **Audit Timeline**: Complete history of credential activities
- **Statistics**: Quick metrics (verifications, consents, days active)
- **Actions**: Share, print, and revoke capabilities

## Features

### Information Display
- Full credential details with status badge
- Issuer and holder information
- Issuance and expiry dates
- Verification hash with copy button

### Audit Trail
- Timeline of all credential activities
- Types: issued, verified, accessed, consent_granted, revoked
- Actor information and timestamps

### Quick Actions
- Share credential
- Print credential
- Revoke credential (for active credentials)
- Copy hash to clipboard

### Statistics Sidebar
- Total verifications count
- Active consents count
- Days since issuance
- Responsive layout
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CredentialDetailPage>;

/**
 * Default view of the Credential Detail page showing an active National ID credential.
 */
export const Default: Story = {};

/**
 * Shows a credential detail page in loading state while fetching data.
 */
export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Loading state displayed while credential data is being fetched from the API.',
      },
    },
  },
};

/**
 * Displays an error state when credential cannot be loaded.
 */
export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        // Mock API error response
      ],
    },
    docs: {
      description: {
        story: 'Error state shown when the credential cannot be loaded from the API.',
      },
    },
  },
};

/**
 * Shows a revoked credential with appropriate status indicators.
 */
export const RevokedCredential: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Displays a revoked credential with red status badge and disabled actions.',
      },
    },
  },
};

/**
 * Shows a credential that is about to expire.
 */
export const ExpiringSoon: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Credential detail for a credential approaching its expiry date.',
      },
    },
  },
};

/**
 * Shows a credential with extensive audit history.
 */
export const ExtensiveAuditHistory: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Credential with many audit events showing complete verification and access history.',
      },
    },
  },
};
