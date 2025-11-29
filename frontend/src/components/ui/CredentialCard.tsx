import { useState } from 'react';

/**
 * Credential status type
 */
export type CredentialStatus = 'ACTIVE' | 'REVOKED' | 'PENDING';

/**
 * Credential data structure
 */
export interface Credential {
  id: string;
  holderName: string;
  nid?: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  status: CredentialStatus;
  hash: string;
  metadata?: Record<string, string>;
}

/**
 * CredentialCard component props
 */
export interface CredentialCardProps {
  credential: Credential;
  onShare: (credentialId: string) => void;
  onRevoke?: (credentialId: string) => void;
}

/**
 * Get status badge color classes based on credential status
 */
const getStatusColor = (status: CredentialStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-success/10 text-success border-success/20';
    case 'REVOKED':
      return 'bg-danger/10 text-danger border-danger/20';
    case 'PENDING':
      return 'bg-warning/10 text-warning border-warning/20';
    default:
      return 'bg-neutral-200 text-neutral-800 border-neutral-300';
  }
};

/**
 * Format date string to readable format
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Truncate hash for display
 */
const truncateHash = (hash: string, length: number = 12): string => {
  if (hash.length <= length) return hash;
  return `${hash.slice(0, length / 2)}...${hash.slice(-length / 2)}`;
};

/**
 * Check if credential is expired
 */
const isExpired = (expiresAt?: string): boolean => {
  if (!expiresAt) return false;
  try {
    return new Date(expiresAt) < new Date();
  } catch {
    return false;
  }
};

/**
 * CredentialCard component
 * 
 * Displays a credential with issuer badge, status pill, dates, hash, and actions.
 * Includes expandable metadata section and copy-to-clipboard functionality.
 */
export default function CredentialCard({
  credential,
  onShare,
  onRevoke,
}: CredentialCardProps) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  /**
   * Copy hash to clipboard
   */
  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(credential.hash);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy hash:', error);
    }
  };

  /**
   * Handle share button click
   */
  const handleShare = () => {
    onShare(credential.id);
  };

  /**
   * Handle revoke button click
   */
  const handleRevoke = () => {
    if (onRevoke) {
      onRevoke(credential.id);
    }
  };

  /**
   * Toggle metadata details
   */
  const toggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  const expired = isExpired(credential.expiresAt);
  const statusColor = getStatusColor(credential.status);
  const hasMetadata = credential.metadata && Object.keys(credential.metadata).length > 0;

  return (
    <div
      className="card p-6 space-y-4 hover:shadow-lg transition-shadow"
      role="article"
      aria-label={`Credential for ${credential.holderName}`}
    >
      {/* Header: Issuer Badge and Status */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Issuer Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-2">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>{credential.issuer}</span>
          </div>

          {/* Holder Name */}
          <h3 className="text-xl font-bold text-foreground mb-1">
            {credential.holderName}
          </h3>

          {/* NID (if provided) */}
          {credential.nid && (
            <p className="text-sm text-muted-foreground">
              NID: {credential.nid}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${statusColor}`}
            role="status"
            aria-label={`Status: ${credential.status}`}
          >
            {credential.status}
          </span>
        </div>
      </div>

      {/* Dates Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {/* Issued Date */}
        <div className="flex items-center text-muted-foreground">
          <svg
            className="w-4 h-4 mr-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            <span className="font-medium text-foreground">Issued:</span>{' '}
            {formatDate(credential.issuedAt)}
          </span>
        </div>

        {/* Expires Date */}
        {credential.expiresAt && (
          <div
            className={`flex items-center ${
              expired ? 'text-danger' : 'text-muted-foreground'
            }`}
          >
            <svg
              className="w-4 h-4 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <span className="font-medium text-foreground">
                {expired ? 'Expired:' : 'Expires:'}
              </span>{' '}
              {formatDate(credential.expiresAt)}
            </span>
            {expired && (
              <span className="ml-2 text-xs font-semibold" aria-label="Expired">
                ⚠️
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hash Section */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Credential Hash</p>
            <code className="block text-sm font-mono text-foreground truncate">
              {truncateHash(credential.hash, 16)}
            </code>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyHash}
            className="flex-shrink-0 p-2 hover:bg-accent rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Copy credential hash to clipboard"
            title="Copy hash"
          >
            {isCopied ? (
              <svg
                className="w-5 h-5 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Metadata Details Dropdown */}
      {hasMetadata && (
        <div className="pt-3 border-t border-border">
          <button
            onClick={toggleDetails}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
            aria-expanded={isDetailsExpanded}
            aria-controls={`metadata-${credential.id}`}
          >
            <span>Details</span>
            <svg
              className={`w-5 h-5 transition-transform ${
                isDetailsExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isDetailsExpanded && (
            <div
              id={`metadata-${credential.id}`}
              className="mt-3 space-y-2 bg-muted/50 rounded-lg p-4 animate-fadeIn"
              role="region"
              aria-label="Credential metadata"
            >
              {Object.entries(credential.metadata!).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 text-sm">
                  <span className="font-medium text-foreground capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-muted-foreground text-right break-all">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-3">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="btn-primary px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={`Share credential for ${credential.holderName}`}
        >
          <svg
            className="w-4 h-4 mr-2 inline-block"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share
        </button>

        {/* Revoke Button (conditional) */}
        {onRevoke && credential.status === 'ACTIVE' && (
          <button
            onClick={handleRevoke}
            className="btn-destructive px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
            aria-label={`Revoke credential for ${credential.holderName}`}
          >
            <svg
              className="w-4 h-4 mr-2 inline-block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            Revoke
          </button>
        )}

        {/* Details Button (if no metadata, show disabled state) */}
        {!hasMetadata && (
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50 rounded-lg cursor-not-allowed"
            aria-label="No additional details available"
          >
            No Details
          </button>
        )}
      </div>

      {/* Credential ID (hidden, for accessibility) */}
      <span className="sr-only">Credential ID: {credential.id}</span>
    </div>
  );
}
