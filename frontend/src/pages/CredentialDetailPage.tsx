import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Credential } from '@/components/ui/IssuerCredentialsTable';
import AuditTimeline from '@/components/ui/AuditTimeline';
import type { AuditEvent } from '@/components/ui/AuditTimeline';

const CredentialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCredentialDetails();
      fetchAuditEvents();
    }
  }, [id]);

  const fetchCredentialDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/credentials?id=${id}`);
      if (!response.ok) throw new Error('Credential not found');
      
      const data = await response.json();
      const foundCredential = data.credentials.find((c: Credential) => c.id === id);
      
      if (!foundCredential) {
        throw new Error('Credential not found');
      }
      
      setCredential(foundCredential);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credential');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditEvents = async () => {
    try {
      const response = await fetch(`/api/audit?credentialId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setAuditEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit events:', err);
    }
  };

  const handleRevoke = async () => {
    if (!credential || !confirm('Are you sure you want to revoke this credential?')) {
      return;
    }

    try {
      const response = await fetch(`/api/credentials/${credential.id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User request' }),
      });

      if (response.ok) {
        alert('Credential revoked successfully');
        navigate('/credentials');
      } else {
        alert('Failed to revoke credential');
      }
    } catch (error) {
      console.error('Error revoking credential:', error);
      alert('Failed to revoke credential');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadQR = () => {
    // In a real app, this would generate and download a QR code image
    alert('QR code download feature coming soon!');
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="card">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !credential) {
    return (
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="card text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              {error || 'Credential not found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The credential you're looking for doesn't exist or has been removed.
            </p>
            <div className="mt-6">
              <Link to="/credentials" className="btn-primary">
                Back to Credentials
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'revoked':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Link
          to="/credentials"
          className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-5 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Credentials
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {credential.type}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">ID: {credential.id}</p>
            </div>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(credential.status)}`}>
              {credential.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Credential Information
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Holder Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{credential.holderName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{credential.holderEmail}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{credential.type}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Issued Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(credential.issuedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
                {credential.expiresAt && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Expiry Date</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(credential.expiresAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Credential Hash */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Verification Hash
              </h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <code className="text-xs font-mono break-all text-gray-900 dark:text-white flex-1">
                    {credential.credentialHash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(credential.credentialHash)}
                    className="group relative flex-shrink-0 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                    title="Copy hash"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-28 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                      Copy to clipboard
                    </div>
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                This cryptographic hash can be used to verify the authenticity of this credential.
              </p>
            </div>

            {/* Activity Timeline */}
            {auditEvents.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                  Activity Timeline
                </h2>
                <div className="max-h-[350px] overflow-y-auto">
                  <AuditTimeline events={auditEvents} />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* QR Code */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                QR Code
              </h2>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-center">
                {showQR ? (
                  <div className="text-center">
                    <div className="w-40 h-40 bg-white p-3 rounded-lg mx-auto mb-3">
                      {/* Placeholder for QR code - in real app, use qrcode.react or similar */}
                      <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-600">QR Code</span>
                      </div>
                    </div>
                    <button onClick={downloadQR} className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors w-full">
                      Download QR
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowQR(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                  >
                    Generate QR Code
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Share this QR code for quick verification
              </p>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => copyToClipboard(credential.credentialHash)}
                  className="group relative w-full px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Share Credential
                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                    Copy hash to share with verifiers
                  </div>
                </button>
                <button
                  onClick={() => window.print()}
                  className="group relative w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                >
                  Print Details
                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-44 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                    Print credential for records
                  </div>
                </button>
                {credential.status === 'active' && (
                  <button
                    onClick={handleRevoke}
                    className="group relative w-full px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg transition-colors"
                  >
                    Revoke Credential
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                      Permanently revoke this credential (cannot be undone)
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Statistics
              </h2>
              <dl className="space-y-2">
                <div className="group relative flex justify-between">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Verifications</dt>
                  <dd className="text-xs font-medium text-gray-900 dark:text-white">
                    {auditEvents.filter(e => e.type === 'verified').length}
                  </dd>
                  {/* Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-48 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                    Number of times this credential was verified
                  </div>
                </div>
                <div className="group relative flex justify-between">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Consents Given</dt>
                  <dd className="text-xs font-medium text-gray-900 dark:text-white">
                    {auditEvents.filter(e => e.type === 'consent_granted').length}
                  </dd>
                  {/* Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-48 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                    Times you granted access to this credential
                  </div>
                </div>
                <div className="group relative flex justify-between">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Days Active</dt>
                  <dd className="text-xs font-medium text-gray-900 dark:text-white">
                    {Math.floor(
                      (new Date().getTime() - new Date(credential.issuedAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}
                  </dd>
                  {/* Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-48 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                    Number of days since credential was issued
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialDetailPage;
