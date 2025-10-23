import React, { useState, useEffect } from 'react';
import IssuerCredentialsTable from '@/components/ui/IssuerCredentialsTable';
import type { Credential } from '@/components/ui/IssuerCredentialsTable';

interface IssuerStats {
  totalIssued: number;
  active: number;
  revoked: number;
  expired: number;
  thisMonth: number;
}

const IssuerDashboardPage: React.FC = () => {
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [stats, setStats] = useState<IssuerStats>({
    totalIssued: 0,
    active: 0,
    revoked: 0,
    expired: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formData, setFormData] = useState({
    holderName: '',
    holderEmail: '',
    type: 'National ID',
    expiresAt: '',
  });

  // Fetch stats on mount and when refreshKey changes
  useEffect(() => {
    console.log('IssuerDashboardPage mounted');
    const fetchStats = async () => {
      try {
        console.log('Fetching stats...');
        const response = await fetch('/api/issuer/stats');
        console.log('Stats response:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Stats data:', data);
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, [refreshKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          issuedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        alert('Credential issued successfully!');
        setShowIssueForm(false);
        setFormData({
          holderName: '',
          holderEmail: '',
          type: 'National ID',
          expiresAt: '',
        });
        // Refresh the table and stats
        setRefreshKey(prev => prev + 1);
      } else {
        const error = await response.json();
        alert(`Failed to issue credential: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error issuing credential:', error);
      alert('Failed to issue credential');
    } finally {
      setLoading(false);
    }
  };

  console.log('IssuerDashboardPage rendering, stats:', stats);

  // Safety check - always render something
  if (!stats) {
    console.log('Stats is null/undefined, rendering fallback');
    return <div className="p-8 text-xl">Loading Issuer Dashboard...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Issuer Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Issue and manage digital credentials
            </p>
          </div>
          <button
            onClick={() => setShowIssueForm(true)}
            className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            + Issue New Credential
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Issued</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalIssued}</p>
              </div>
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
              Total credentials issued by your organization
            </div>
          </div>

          <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.active}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
              Currently valid and verifiable credentials
            </div>
          </div>

          <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Revoked</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.revoked}</p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
              Credentials that have been revoked
            </div>
          </div>

          <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.thisMonth}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
              Credentials issued in the current month
            </div>
          </div>
        </div>

        {/* Issue Form Modal */}
        {showIssueForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowIssueForm(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Issue New Credential
                </h2>
                <button
                  onClick={() => setShowIssueForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="holderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Holder Name *
                  </label>
                  <input
                    type="text"
                    id="holderName"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                    value={formData.holderName}
                    onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label htmlFor="holderEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="holderEmail"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                    value={formData.holderEmail}
                    onChange={(e) => setFormData({ ...formData, holderEmail: e.target.value })}
                    placeholder="holder@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Credential Type *
                  </label>
                  <select
                    id="type"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="National ID">National ID</option>
                    <option value="eTIN Certificate">eTIN Certificate</option>
                    <option value="Trade License">Trade License</option>
                    <option value="Educational Certificate">Educational Certificate</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    id="expiresAt"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Leave empty for no expiration
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                    ℹ️ Note
                  </h3>
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    A cryptographic hash will be automatically generated for this credential.
                    The holder will receive an email notification upon issuance.
                  </p>
                </div>

                <div className="flex gap-2 pt-3">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Issuing...</span>
                      </>
                    ) : (
                      'Issue Credential'
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowIssueForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Credentials Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <IssuerCredentialsTable
            key={refreshKey}
            onViewCredential={(credential: Credential) => {
              alert(`Viewing credential: ${credential.type} for ${credential.holderName}`);
            }}
            onRevokeSuccess={() => {
              // Refresh stats after revocation
              setRefreshKey(prev => prev + 1);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default IssuerDashboardPage;
