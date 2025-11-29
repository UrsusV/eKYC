import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface VerificationResult {
  status: 'verified' | 'invalid' | 'revoked' | 'expired' | 'consent_required';
  message: string;
  credentialHash: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  holderName?: string;
  credentialType: string;
  consentRequired: boolean;
  verifiedAt: string;
}

export const QuickVerifyWidget: React.FC = () => {
  const [hash, setHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!hash.trim()) {
      setError('Please enter a credential hash');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hash: hash.trim(),
          verifierId: 'quick-verify-widget',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;

    switch (result.status) {
      case 'verified':
        return <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />;
      case 'invalid':
      case 'revoked':
        return <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case 'expired':
        return <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      case 'consent_required':
        return <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    if (!result) return '';

    switch (result.status) {
      case 'verified':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'invalid':
      case 'revoked':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'expired':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'consent_required':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Verification
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Verify credentials instantly
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Input Section */}
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter credential hash..."
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={isLoading || !hash.trim()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify'
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Verification Result */}
        {result && (
          <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                    {result.status === 'consent_required' ? 'Consent Required' : result.status}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(result.verifiedAt)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {result.message}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Type:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {result.credentialType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Issuer:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {result.issuer}
                    </span>
                  </div>
                  {result.holderName && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Holder:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        {result.holderName}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Issued:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {formatDate(result.issuedAt)}
                    </span>
                  </div>
                  {result.expiresAt && (
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Expires:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        {formatDate(result.expiresAt)}
                      </span>
                    </div>
                  )}
                </div>

                {result.status === 'verified' && (
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                      <CheckCircle className="w-3 h-3" />
                      <span>This credential is valid and active</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
