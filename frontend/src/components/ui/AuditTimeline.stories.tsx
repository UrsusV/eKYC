import { Meta, StoryObj } from '@storybook/react';
import AuditTimeline, { AuditEvent, AuditEventType } from './AuditTimeline';

const meta: Meta<typeof AuditTimeline> = {
  title: 'Components/AuditTimeline',
  component: AuditTimeline,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'AuditTimeline displays an ordered list of audit events for a credential holder. Features include visual timeline with icons, relative timestamps, keyboard navigation, and CSV export functionality.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    events: {
      control: 'object',
      description: 'Array of audit events to display in the timeline',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the component',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AuditTimeline>;

// ============================================================================
// Sample Data
// ============================================================================

const sampleEvents: AuditEvent[] = [
  {
    id: 'evt-001',
    type: 'issued',
    actor: 'Government ID Authority',
    timestamp: new Date('2025-10-10T09:00:00Z'),
    details: 'Driver license credential issued successfully. Credential ID: DL-2025-12345',
  },
  {
    id: 'evt-002',
    type: 'consent_granted',
    actor: 'John Doe',
    timestamp: new Date('2025-10-12T14:30:00Z'),
    details: 'Consent granted to share full_name, email, and date_of_birth with Acme Corporation for 24 hours',
  },
  {
    id: 'evt-003',
    type: 'verified',
    actor: 'Acme Corp Verifier',
    timestamp: new Date('2025-10-12T14:35:00Z'),
    details: 'Credential verified successfully via verifiable presentation. Verification ID: VER-789',
  },
  {
    id: 'evt-004',
    type: 'consent_granted',
    actor: 'John Doe',
    timestamp: new Date('2025-10-15T10:00:00Z'),
    details: 'Consent granted to share full_name and email with TechStart Inc for 48 hours',
  },
  {
    id: 'evt-005',
    type: 'verified',
    actor: 'TechStart Verification Service',
    timestamp: new Date('2025-10-15T10:05:00Z'),
    details: 'Credential verified successfully. All checks passed.',
  },
];

const recentEvents: AuditEvent[] = [
  {
    id: 'evt-recent-1',
    type: 'verified',
    actor: 'Bank Verification Service',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    details: 'Identity verification completed for account opening',
  },
  {
    id: 'evt-recent-2',
    type: 'consent_granted',
    actor: 'Jane Smith',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    details: 'Consent granted to share address and phone_number with Regional Bank',
  },
  {
    id: 'evt-recent-3',
    type: 'issued',
    actor: 'State ID Authority',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    details: 'State ID credential issued',
  },
];

const fullLifecycleEvents: AuditEvent[] = [
  {
    id: 'evt-lifecycle-1',
    type: 'issued',
    actor: 'Healthcare Provider',
    timestamp: new Date('2025-09-01T08:00:00Z'),
    details: 'Medical credential issued for patient ID verification',
  },
  {
    id: 'evt-lifecycle-2',
    type: 'consent_granted',
    actor: 'Patient',
    timestamp: new Date('2025-09-15T11:00:00Z'),
    details: 'Consent granted to share medical records with Specialist Clinic',
  },
  {
    id: 'evt-lifecycle-3',
    type: 'verified',
    actor: 'Specialist Clinic',
    timestamp: new Date('2025-09-15T11:10:00Z'),
    details: 'Medical credential verified for appointment',
  },
  {
    id: 'evt-lifecycle-4',
    type: 'consent_granted',
    actor: 'Patient',
    timestamp: new Date('2025-09-20T09:30:00Z'),
    details: 'Consent granted to share medical history with Pharmacy',
  },
  {
    id: 'evt-lifecycle-5',
    type: 'verified',
    actor: 'Local Pharmacy',
    timestamp: new Date('2025-09-20T09:35:00Z'),
    details: 'Credential verified for prescription pickup',
  },
  {
    id: 'evt-lifecycle-6',
    type: 'revoked',
    actor: 'Healthcare Provider',
    timestamp: new Date('2025-10-17T16:00:00Z'),
    details: 'Medical credential revoked due to expiration. New credential issued separately.',
  },
];

const allEventTypes: AuditEvent[] = [
  {
    id: 'evt-type-1',
    type: 'issued',
    actor: 'Issuing Authority',
    timestamp: new Date('2025-10-01T10:00:00Z'),
    details: 'Credential issued successfully',
  },
  {
    id: 'evt-type-2',
    type: 'consent_granted',
    actor: 'User',
    timestamp: new Date('2025-10-05T14:00:00Z'),
    details: 'User granted consent to share credentials',
  },
  {
    id: 'evt-type-3',
    type: 'verified',
    actor: 'Verification Service',
    timestamp: new Date('2025-10-10T11:30:00Z'),
    details: 'Credential verification successful',
  },
  {
    id: 'evt-type-4',
    type: 'revoked',
    actor: 'Administrator',
    timestamp: new Date('2025-10-15T09:00:00Z'),
    details: 'Credential revoked by system administrator',
  },
];

// ============================================================================
// Stories
// ============================================================================

/**
 * Default timeline with a typical set of audit events.
 */
export const Default: Story = {
  args: {
    events: sampleEvents,
  },
};

/**
 * Timeline with recent events showing relative timestamps.
 */
export const RecentEvents: Story = {
  args: {
    events: recentEvents,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how recent events are displayed with relative time (e.g., "30 minutes ago", "2 hours ago").',
      },
    },
  },
};

/**
 * Complete credential lifecycle from issuance to revocation.
 */
export const FullLifecycle: Story = {
  args: {
    events: fullLifecycleEvents,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the complete lifecycle of a credential: issued → consents granted → verifications → revoked.',
      },
    },
  },
};

/**
 * Shows all four event types with their distinctive styling.
 */
export const AllEventTypes: Story = {
  args: {
    events: allEventTypes,
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays all four event types (issued, consent_granted, verified, revoked) with their respective colors and icons.',
      },
    },
  },
};

/**
 * Timeline with a single event.
 */
export const SingleEvent: Story = {
  args: {
    events: [
      {
        id: 'evt-single',
        type: 'issued',
        actor: 'Digital ID Authority',
        timestamp: new Date('2025-10-17T12:00:00Z'),
        details: 'Digital identity credential issued',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline with only one event. Note the singular "1 event recorded" text.',
      },
    },
  },
};

/**
 * Empty state when no events exist.
 */
export const EmptyState: Story = {
  args: {
    events: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the empty state with helpful message when no audit events are available.',
      },
    },
  },
};

/**
 * Timeline with many events to demonstrate scrolling.
 */
export const ManyEvents: Story = {
  args: {
    events: Array.from({ length: 20 }, (_, i) => ({
      id: `evt-${i + 1}`,
      type: (['issued', 'consent_granted', 'verified', 'revoked'] as const)[i % 4] as AuditEventType,
      actor: `Actor ${i + 1}`,
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Each day back
      details: `Event details for event number ${i + 1}. This describes what happened during this audit event.`,
    })),
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline with many events to test scrolling behavior and performance.',
      },
    },
  },
};

/**
 * Events with long detailed descriptions.
 */
export const LongDetails: Story = {
  args: {
    events: [
      {
        id: 'evt-long-1',
        type: 'consent_granted',
        actor: 'John Doe',
        timestamp: new Date('2025-10-17T10:00:00Z'),
        details: 'Consent granted to share the following fields: full_name, email, phone_number, date_of_birth, address, city, state, postal_code, country, and social_security_number with Acme Corporation for verification purposes. This consent is valid for 24 hours and will automatically expire after that period unless renewed.',
      },
      {
        id: 'evt-long-2',
        type: 'verified',
        actor: 'Enterprise Verification System',
        timestamp: new Date('2025-10-17T10:05:00Z'),
        details: 'Comprehensive credential verification completed. All fields were validated against authoritative sources. Verification included identity document validation, address confirmation via postal service database, and cross-reference with government records. Verification ID: VER-2025-10-17-ABC123. All checks passed successfully.',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Events with lengthy details to show how the component handles long text content.',
      },
    },
  },
};

/**
 * Demonstrates keyboard navigation capabilities.
 */
export const KeyboardNavigation: Story = {
  args: {
    events: sampleEvents,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use Tab to navigate between events, Enter or Space to expand/collapse details, and the "Jump to top" button for quick navigation.',
      },
    },
  },
};

/**
 * Only "issued" events (e.g., new credential issuances).
 */
export const IssuedOnly: Story = {
  args: {
    events: [
      {
        id: 'evt-issued-1',
        type: 'issued',
        actor: 'Government ID Authority',
        timestamp: new Date('2025-09-01T10:00:00Z'),
        details: 'Driver license credential issued',
      },
      {
        id: 'evt-issued-2',
        type: 'issued',
        actor: 'University Registrar',
        timestamp: new Date('2025-09-15T14:00:00Z'),
        details: 'Degree certificate credential issued',
      },
      {
        id: 'evt-issued-3',
        type: 'issued',
        actor: 'Healthcare Provider',
        timestamp: new Date('2025-10-01T09:00:00Z'),
        details: 'Vaccination record credential issued',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline showing only "issued" events with success styling (green).',
      },
    },
  },
};

/**
 * Only "consent_granted" events.
 */
export const ConsentOnly: Story = {
  args: {
    events: [
      {
        id: 'evt-consent-1',
        type: 'consent_granted',
        actor: 'User',
        timestamp: new Date('2025-10-01T12:00:00Z'),
        details: 'Consent granted to share name and email with Service A',
      },
      {
        id: 'evt-consent-2',
        type: 'consent_granted',
        actor: 'User',
        timestamp: new Date('2025-10-08T15:00:00Z'),
        details: 'Consent granted to share address with Service B',
      },
      {
        id: 'evt-consent-3',
        type: 'consent_granted',
        actor: 'User',
        timestamp: new Date('2025-10-15T11:00:00Z'),
        details: 'Consent granted to share full profile with Service C',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline showing only "consent_granted" events with primary styling (blue).',
      },
    },
  },
};

/**
 * Only "verified" events.
 */
export const VerifiedOnly: Story = {
  args: {
    events: [
      {
        id: 'evt-verified-1',
        type: 'verified',
        actor: 'Bank Verification Service',
        timestamp: new Date('2025-10-05T09:30:00Z'),
        details: 'Identity verified for account opening',
      },
      {
        id: 'evt-verified-2',
        type: 'verified',
        actor: 'Employer HR System',
        timestamp: new Date('2025-10-10T14:00:00Z'),
        details: 'Employment credentials verified',
      },
      {
        id: 'evt-verified-3',
        type: 'verified',
        actor: 'Government Portal',
        timestamp: new Date('2025-10-17T08:00:00Z'),
        details: 'Citizenship credentials verified',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline showing only "verified" events with secondary styling (purple).',
      },
    },
  },
};

/**
 * Only "revoked" events.
 */
export const RevokedOnly: Story = {
  args: {
    events: [
      {
        id: 'evt-revoked-1',
        type: 'revoked',
        actor: 'System Administrator',
        timestamp: new Date('2025-10-01T10:00:00Z'),
        details: 'Credential revoked due to policy violation',
      },
      {
        id: 'evt-revoked-2',
        type: 'revoked',
        actor: 'Issuing Authority',
        timestamp: new Date('2025-10-10T11:00:00Z'),
        details: 'Credential revoked due to expiration',
      },
      {
        id: 'evt-revoked-3',
        type: 'revoked',
        actor: 'User Request',
        timestamp: new Date('2025-10-17T15:00:00Z'),
        details: 'Credential revoked at user request',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline showing only "revoked" events with danger styling (red).',
      },
    },
  },
};

/**
 * Timeline with custom CSS classes applied.
 */
export const WithCustomStyling: Story = {
  args: {
    events: sampleEvents,
    className: 'shadow-2xl border-2 border-primary-200',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates applying custom CSS classes via the className prop.',
      },
    },
  },
};

/**
 * Interactive playground for testing all features.
 */
export const Playground: Story = {
  args: {
    events: sampleEvents,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel to customize the timeline. Try adding/removing events, changing event types, and testing the download feature.',
      },
    },
  },
};
