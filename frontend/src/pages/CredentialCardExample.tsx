import { useState } from 'react';
import CredentialCard, { Credential } from '@components/ui/CredentialCard';

/**
 * Sample credentials for demonstration
 */
const sampleCredentials: Credential[] = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

/**
 * CredentialCardExample - Demo page showcasing CredentialCard component
 */
export default function CredentialCardExample() {
  const [notifications, setNotifications] = useState<string[]>([]);

  /**
   * Handle share action
   */
  const handleShare = (credentialId: string) => {
    const credential = sampleCredentials.find((c) => c.id === credentialId);
    const message = `Sharing credential for ${credential?.holderName} (${credentialId})`;
    
    console.log(message);
    addNotification(message);
    
    // In a real app, this would open a share dialog or send to API
    alert(`Share dialog would open for: ${credential?.holderName}`);
  };

  /**
   * Handle revoke action
   */
  const handleRevoke = (credentialId: string) => {
    const credential = sampleCredentials.find((c) => c.id === credentialId);
    const message = `Revoke requested for ${credential?.holderName} (${credentialId})`;
    
    // Confirm before revoking
    if (confirm(`Are you sure you want to revoke the credential for ${credential?.holderName}?`)) {
      console.log(message);
      addNotification(message);
      
      // In a real app, this would call an API to revoke the credential
      alert(`Credential revoked: ${credential?.holderName}`);
    }
  };

  /**
   * Add notification to list
   */
  const addNotification = (message: string) => {
    setNotifications((prev) => [message, ...prev].slice(0, 5)); // Keep last 5
  };

  /**
   * Clear all notifications
   */
  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            CredentialCard Component Demo
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore the CredentialCard component with different states and configurations
          </p>
        </div>

        {/* Notifications Panel */}
        {notifications.length > 0 && (
          <div className="card p-4 mb-6 bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Recent Actions</h3>
              <button
                onClick={clearNotifications}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
            <ul className="space-y-1">
              {notifications.map((notif, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {notif}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Filter/Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {sampleCredentials.filter((c) => c.status === 'ACTIVE').length}
            </div>
            <div className="text-sm text-success">Active</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {sampleCredentials.filter((c) => c.status === 'PENDING').length}
            </div>
            <div className="text-sm text-warning">Pending</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {sampleCredentials.filter((c) => c.status === 'REVOKED').length}
            </div>
            <div className="text-sm text-danger">Revoked</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {sampleCredentials.length}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            All Credentials
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sampleCredentials.map((credential) => (
              <CredentialCard
                key={credential.id}
                credential={credential}
                onShare={handleShare}
                onRevoke={handleRevoke}
              />
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="card p-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Component Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center">
                <span className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center mr-2">
                  ✓
                </span>
                Status Indicators
              </h3>
              <p className="text-sm text-muted-foreground">
                Color-coded badges: ACTIVE (green), REVOKED (red), PENDING (amber)
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center">
                <span className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center mr-2">
                  ✓
                </span>
                Hash Management
              </h3>
              <p className="text-sm text-muted-foreground">
                Truncated display with one-click copy-to-clipboard functionality
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center">
                <span className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center mr-2">
                  ✓
                </span>
                Expandable Metadata
              </h3>
              <p className="text-sm text-muted-foreground">
                Click "Details" to view additional credential information
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center">
                <span className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center mr-2">
                  ✓
                </span>
                Expiration Warnings
              </h3>
              <p className="text-sm text-muted-foreground">
                Automatic detection and visual indicators for expired credentials
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center">
                <span className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center mr-2">
                  ✓
                </span>
                Conditional Actions
              </h3>
              <p className="text-sm text-muted-foreground">
                Revoke button only appears for ACTIVE credentials
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center">
                <span className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center mr-2">
                  ✓
                </span>
                Full Accessibility
              </h3>
              <p className="text-sm text-muted-foreground">
                ARIA labels, keyboard navigation, and screen reader support
              </p>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="card p-6 bg-muted/50">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Try It Out
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start">
              <span className="font-bold text-primary mr-2">1.</span>
              <span>Click the <strong>Share</strong> button to trigger the share callback</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-primary mr-2">2.</span>
              <span>Click the <strong>Revoke</strong> button on active credentials (confirmation required)</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-primary mr-2">3.</span>
              <span>Click the <strong>copy icon</strong> next to the hash to copy it to clipboard</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-primary mr-2">4.</span>
              <span>Click <strong>Details</strong> to expand/collapse the metadata section</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-primary mr-2">5.</span>
              <span>Notice the <strong>expired warning</strong> on Bob Wilson's credential</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-primary mr-2">6.</span>
              <span>Observe that <strong>revoked credentials</strong> don't show the Revoke button</span>
            </li>
          </ul>
        </div>

        {/* Documentation Link */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            For complete documentation, API reference, and integration examples:
          </p>
          <code className="inline-block bg-muted px-4 py-2 rounded text-sm">
            src/components/ui/CREDENTIAL_CARD_DOCS.md
          </code>
        </div>
      </div>
    </div>
  );
}
