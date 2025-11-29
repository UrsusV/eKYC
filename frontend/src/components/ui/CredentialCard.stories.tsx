import type { Meta, StoryObj } from '@storybook/react';
import CredentialCard, { Credential } from './CredentialCard';

const meta: Meta<typeof CredentialCard> = {
  title: 'Components/UI/CredentialCard',
  component: CredentialCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onShare: { action: 'shared' },
    onRevoke: { action: 'revoked' },
  },
};

export default meta;
type Story = StoryObj<typeof CredentialCard>;

// Sample credential data
const activeCredential: Credential = {
  id: 'cred-001',
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
    biometric_data: 'Fingerprint + Facial Recognition',
  },
};

const revokedCredential: Credential = {
  id: 'cred-002',
  holderName: 'Jane Smith',
  nid: '0987654321',
  issuer: 'Department of Motor Vehicles',
  issuedAt: '2023-05-20T14:30:00Z',
  expiresAt: '2026-05-20T14:30:00Z',
  status: 'REVOKED',
  hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  metadata: {
    document_type: "Driver's License",
    class: 'Class A',
    revocation_reason: 'Document reported lost',
    revoked_date: '2024-10-01',
  },
};

const pendingCredential: Credential = {
  id: 'cred-003',
  holderName: 'Alice Johnson',
  issuer: 'University of Technology',
  issuedAt: '2024-10-01T09:00:00Z',
  expiresAt: '2029-10-01T09:00:00Z',
  status: 'PENDING',
  hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
  metadata: {
    document_type: 'Degree Certificate',
    degree: 'Bachelor of Science',
    major: 'Computer Science',
    graduation_year: '2024',
  },
};

const expiredCredential: Credential = {
  id: 'cred-004',
  holderName: 'Bob Wilson',
  nid: '5555555555',
  issuer: 'Health Ministry',
  issuedAt: '2020-03-10T08:00:00Z',
  expiresAt: '2023-03-10T08:00:00Z', // Expired
  status: 'ACTIVE',
  hash: '0x56789abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345',
  metadata: {
    document_type: 'Health Card',
    blood_type: 'O+',
    allergies: 'None',
  },
};

const minimalCredential: Credential = {
  id: 'cred-005',
  holderName: 'Charlie Brown',
  issuer: 'Municipal Services',
  issuedAt: '2024-08-15T12:00:00Z',
  status: 'ACTIVE',
  hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
};

/**
 * Default active credential with all features
 */
export const Default: Story = {
  args: {
    credential: activeCredential,
    onShare: (id) => console.log('Share credential:', id),
    onRevoke: (id) => console.log('Revoke credential:', id),
  },
};

/**
 * Active credential with full metadata
 */
export const Active: Story = {
  args: {
    credential: activeCredential,
    onShare: (id) => console.log('Share credential:', id),
    onRevoke: (id) => console.log('Revoke credential:', id),
  },
};

/**
 * Revoked credential - cannot be revoked again
 */
export const Revoked: Story = {
  args: {
    credential: revokedCredential,
    onShare: (id) => console.log('Share credential:', id),
    onRevoke: (id) => console.log('Revoke credential:', id),
  },
};

/**
 * Pending credential awaiting verification
 */
export const Pending: Story = {
  args: {
    credential: pendingCredential,
    onShare: (id) => console.log('Share credential:', id),
    onRevoke: (id) => console.log('Revoke credential:', id),
  },
};

/**
 * Expired credential with warning indicator
 */
export const Expired: Story = {
  args: {
    credential: expiredCredential,
    onShare: (id) => console.log('Share credential:', id),
    onRevoke: (id) => console.log('Revoke credential:', id),
  },
};

/**
 * Minimal credential without optional fields
 */
export const Minimal: Story = {
  args: {
    credential: minimalCredential,
    onShare: (id) => console.log('Share credential:', id),
    onRevoke: (id) => console.log('Revoke credential:', id),
  },
};

/**
 * Credential without revoke functionality
 */
export const WithoutRevoke: Story = {
  args: {
    credential: activeCredential,
    onShare: (id) => console.log('Share credential:', id),
    // onRevoke not provided
  },
};

/**
 * Credential without NID
 */
export const WithoutNID: Story = {
  args: {
    credential: {
      ...activeCredential,
      nid: undefined,
    },
    onShare: (id) => console.log('Share credential:', id),
    onRevoke: (id) => console.log('Revoke credential:', id),
  },
};

/**
 * Credential without expiry date
 */
export const WithoutExpiry: Story = {
  args: {
    credential: {
      ...activeCredential,
      expiresAt: undefined,
    },
    onShare: (id) => console.log('Share credential:', id),
    onRevoke: (id) => console.log('Revoke credential:', id),
  },
};

/**
 * Credential without metadata
 */
export const WithoutMetadata: Story = {
  args: {
    credential: minimalCredential,
    onShare: (id) => console.log('Share credential:', id),
    onRevoke: (id) => console.log('Revoke credential:', id),
  },
};

/**
 * Multiple cards in a grid layout
 */
export const MultipleCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CredentialCard
        credential={activeCredential}
        onShare={(id) => console.log('Share:', id)}
        onRevoke={(id) => console.log('Revoke:', id)}
      />
      <CredentialCard
        credential={pendingCredential}
        onShare={(id) => console.log('Share:', id)}
        onRevoke={(id) => console.log('Revoke:', id)}
      />
      <CredentialCard
        credential={revokedCredential}
        onShare={(id) => console.log('Share:', id)}
      />
      <CredentialCard
        credential={expiredCredential}
        onShare={(id) => console.log('Share:', id)}
        onRevoke={(id) => console.log('Revoke:', id)}
      />
    </div>
  ),
};

/**
 * Card with long holder name
 */
export const LongHolderName: Story = {
  args: {
    credential: {
      ...activeCredential,
      holderName: 'Dr. Alexander Benjamin Christopher Davidson-Montgomery III',
    },
    onShare: (id) => console.log('Share credential:', id),
    onRevoke: (id) => console.log('Revoke credential:', id),
  },
};

/**
 * Card with extensive metadata
 */
export const ExtensiveMetadata: Story = {
  args: {
    credential: {
      ...activeCredential,
      metadata: {
        document_type: 'Passport',
        passport_number: 'AB1234567',
        place_of_birth: 'New York, USA',
        nationality: 'United States',
        height: '175 cm',
        eye_color: 'Brown',
        hair_color: 'Black',
        verification_level: 'Level 5 - Maximum',
        biometric_data: 'Fingerprint, Facial Recognition, Iris Scan',
        issuing_office: 'Department of State - Bureau of Consular Affairs',
      },
    },
    onShare: (id) => console.log('Share credential:', id),
    onRevoke: (id) => console.log('Revoke credential:', id),
  },
};

/**
 * List view - vertical stack of cards
 */
export const ListView: Story = {
  render: () => (
    <div className="space-y-4 max-w-3xl">
      <CredentialCard
        credential={activeCredential}
        onShare={(id) => console.log('Share:', id)}
        onRevoke={(id) => console.log('Revoke:', id)}
      />
      <CredentialCard
        credential={pendingCredential}
        onShare={(id) => console.log('Share:', id)}
        onRevoke={(id) => console.log('Revoke:', id)}
      />
      <CredentialCard
        credential={minimalCredential}
        onShare={(id) => console.log('Share:', id)}
        onRevoke={(id) => console.log('Revoke:', id)}
      />
    </div>
  ),
};

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    credential: activeCredential,
    onShare: (id) => {
      alert(`Sharing credential: ${id}`);
      console.log('Share credential:', id);
    },
    onRevoke: (id) => {
      if (confirm(`Are you sure you want to revoke credential ${id}?`)) {
        alert(`Credential ${id} has been revoked`);
        console.log('Revoke credential:', id);
      }
    },
  },
};
