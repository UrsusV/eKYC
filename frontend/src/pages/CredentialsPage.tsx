import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Credential } from '@/components/ui/IssuerCredentialsTable';
import { useToast } from '@/components/Toast';

type FilterStatus = 'all' | 'active' | 'revoked' | 'pending' | 'expired';
type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'type';

const CredentialsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);

  // Fetch credentials on mount
  React.useEffect(() => {
    fetchCredentials();
  }, [filterStatus, sortBy]);

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      params.append('sort', sortBy);

      const response = await fetch(`/api/credentials?${params.toString()}`);
      const data = await response.json();
      setCredentials(data.credentials || []);
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search credentials
  const filteredCredentials = useMemo(() => {
    return credentials.filter((cred) => {
      const matchesSearch =
        searchQuery === '' ||
        cred.holderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.holderEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.credentialHash?.includes(searchQuery);

      return matchesSearch;
    });
  }, [credentials, searchQuery]);

  // Handle credential actions
  const handleShare = (credential: Credential) => {
    setSelectedCredential(credential);
    setShowShareModal(true);
  };

  const handleRevoke = async (credentialId: string) => {
    if (!confirm('Are you sure you want to revoke this credential? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/credentials/${credentialId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User request' }),
      });

      if (response.ok) {
        toast.success('Credential revoked successfully');
        fetchCredentials();
      } else {
        toast.error('Failed to revoke credential');
      }
    } catch (error) {
      console.error('Error revoking credential:', error);
      toast.error('Failed to revoke credential');
    }
  };

  const handleViewDetails = (credential: Credential) => {
    navigate(`/credentials/${credential.id}`);
  };

  const statusOptions: { value: FilterStatus; label: string; count?: number }[] = [
    { value: 'all', label: 'All Credentials' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'expired', label: 'Expired' },
    { value: 'revoked', label: 'Revoked' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'type', label: 'Type' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            My Credentials
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your digital identity credentials
          </p>
        </div>

      {/* Search and Filters - Inline */}
      <div className="card mb-5 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search credentials
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Search by name, email, type, or hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-40">
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="w-full md:w-40">
            <label htmlFor="sort" className="sr-only">
              Sort by
            </label>
            <select
              id="sort"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || filterStatus !== 'all') && (
          <div className="flex flex-wrap gap-2 mt-3">
            {searchQuery && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1.5 hover:text-primary-600"
                  aria-label="Clear search"
                >
                  ×
                </button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                Status: {statusOptions.find((s) => s.value === filterStatus)?.label}
                <button
                  onClick={() => setFilterStatus('all')}
                  className="ml-1.5 hover:text-primary-600"
                  aria-label="Clear filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {credentials.length}
            </div>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
              Total number of credentials in your account
            </div>
          </div>
          <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {credentials.filter((c) => c.status === 'active').length}
            </div>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
              Verified and ready to share credentials
            </div>
          </div>
          <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {credentials.filter((c) => c.status === 'pending').length}
            </div>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
              Credentials awaiting issuer verification
            </div>
          </div>
          <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Expired</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {credentials.filter((c) => c.status === 'expired' || c.status === 'revoked').length}
            </div>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
              Credentials past expiry date or revoked
            </div>
          </div>
        </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCredentials.length === 0 && (
        <div className="card text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {searchQuery || filterStatus !== 'all' ? 'No credentials found' : 'No credentials yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by requesting your first digital credential'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <div className="mt-6">
              <button className="btn-primary">Request Credential</button>
            </div>
          )}
        </div>
      )}

      {/* Credentials Grid */}
      {!isLoading && filteredCredentials.length > 0 && (
        <>
          <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredCredentials.length} of {credentials.length} credentials
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCredentials.map((credential) => (
              <div key={credential.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5 truncate">
                      {credential.type}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {credential.holderName}
                    </p>
                  </div>
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                      credential.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : credential.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : credential.status === 'expired'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {credential.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400 w-16">Issued:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(credential.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {credential.expiresAt && (
                    <div className="flex items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-400 w-16">Expires:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(credential.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start text-xs">
                    <span className="text-gray-500 dark:text-gray-400 w-16">Hash:</span>
                    <span className="text-gray-900 dark:text-white font-mono text-xs break-all">
                      {credential.credentialHash.substring(0, 16)}...
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(credential)}
                    className="group relative flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleShare(credential)}
                    className="group relative flex-1 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={credential.status !== 'active'}
                  >
                    Share
                    {/* Tooltip for disabled state */}
                    {credential.status !== 'active' && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-44 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                        Only active credentials can be shared
                      </div>
                    )}
                  </button>
                  {credential.status === 'active' && (
                    <button
                      onClick={() => handleRevoke(credential.id)}
                      className="group relative px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg transition-colors"
                      title="Revoke"
                    >
                      ✕
                      {/* Tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-40 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                        Revoke this credential
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Share Modal (Simple version - can be enhanced) */}
      {showShareModal && selectedCredential && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Share Credential
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Share {selectedCredential.type} for {selectedCredential.holderName}
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Credential Hash
                </div>
                <div className="text-xs font-mono break-all text-gray-900 dark:text-white">
                  {selectedCredential.credentialHash}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedCredential.credentialHash || '');
                  toast.success('Credential hash copied!');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex-1"
              >
                Copy Hash
              </button>
              <button onClick={() => setShowShareModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CredentialsPage;
