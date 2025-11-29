import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type CredentialStatus = 'active' | 'revoked' | 'expired' | 'pending';

export interface Credential {
  id: string;
  holderName: string;
  holderEmail: string;
  type: string;
  status: CredentialStatus;
  issuedAt: string;
  expiresAt?: string;
  credentialHash: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface CredentialsResponse {
  credentials: Credential[];
  pagination: PaginationMeta;
}

export interface CredentialsQueryParams {
  page: number;
  limit?: number;
  q?: string;
  status?: CredentialStatus | 'all';
  startDate?: string;
  endDate?: string;
  sortBy?: 'issuedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface IssuerCredentialsTableProps {
  apiBaseUrl?: string;
  itemsPerPage?: number;
  onViewCredential?: (credential: Credential) => void;
  onRevokeSuccess?: (credential: Credential) => void;
  className?: string;
}

// ============================================================================
// API Functions
// ============================================================================

const fetchCredentials = async (
  params: CredentialsQueryParams,
  baseUrl: string = '/api'
): Promise<CredentialsResponse> => {
  const searchParams = new URLSearchParams();
  
  searchParams.append('page', params.page.toString());
  
  if (params.limit) {
    searchParams.append('limit', params.limit.toString());
  }
  
  if (params.q) {
    searchParams.append('q', params.q);
  }
  
  if (params.status && params.status !== 'all') {
    searchParams.append('status', params.status);
  }
  
  if (params.startDate) {
    searchParams.append('startDate', params.startDate);
  }
  
  if (params.endDate) {
    searchParams.append('endDate', params.endDate);
  }
  
  if (params.sortBy) {
    searchParams.append('sortBy', params.sortBy);
  }
  
  if (params.sortOrder) {
    searchParams.append('sortOrder', params.sortOrder);
  }
  
  const response = await fetch(`${baseUrl}/issuer/credentials?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch credentials: ${response.statusText}`);
  }
  
  return response.json();
};

const revokeCredential = async (
  credentialId: string,
  baseUrl: string = '/api'
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/credential/${credentialId}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to revoke credential');
  }
  
  return response.json();
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getStatusBadgeClass = (status: CredentialStatus): string => {
  switch (status) {
    case 'active':
      return 'badge-success';
    case 'revoked':
      return 'badge-danger';
    case 'expired':
      return 'badge-warning';
    case 'pending':
      return 'badge-neutral';
    default:
      return 'badge-neutral';
  }
};

const exportToJSON = (credentials: Credential[], filename: string = 'credentials.json') => {
  const json = JSON.stringify(credentials, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================================================
// Loading Skeleton Component
// ============================================================================

const TableSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-neutral-200 rounded mb-4"></div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-4 mb-3">
          <div className="h-12 bg-neutral-100 rounded flex-1"></div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const IssuerCredentialsTable: React.FC<IssuerCredentialsTableProps> = ({
  apiBaseUrl = '/api',
  itemsPerPage = 10,
  onViewCredential,
  onRevokeSuccess,
  className = '',
}) => {
  const queryClient = useQueryClient();
  
  // State
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CredentialStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [revokingId, setRevokingId] = useState<string | null>(null);
  
  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Query params
  const queryParams: CredentialsQueryParams = {
    page,
    limit: itemsPerPage,
    q: debouncedSearch || undefined,
    status: statusFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy: 'issuedAt',
    sortOrder,
  };
  
  // Fetch credentials using React Query
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['issuer-credentials', queryParams],
    queryFn: () => fetchCredentials(queryParams, apiBaseUrl),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
  });
  
  // Revoke mutation
  const revokeMutation = useMutation({
    mutationFn: (credentialId: string) => revokeCredential(credentialId, apiBaseUrl),
    onSuccess: (_, credentialId) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['issuer-credentials'] });
      
      // Call success callback
      const credential = data?.credentials.find(c => c.id === credentialId);
      if (credential && onRevokeSuccess) {
        onRevokeSuccess(credential);
      }
      
      setRevokingId(null);
    },
    onError: (error: Error) => {
      console.error('Failed to revoke credential:', error);
      setRevokingId(null);
    },
  });
  
  // Handlers
  const handleRevoke = (credentialId: string) => {
    if (window.confirm('Are you sure you want to revoke this credential? This action cannot be undone.')) {
      setRevokingId(credentialId);
      revokeMutation.mutate(credentialId);
    }
  };
  
  const handleSelectRow = (credentialId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(credentialId)) {
      newSelected.delete(credentialId);
    } else {
      newSelected.add(credentialId);
    }
    setSelectedRows(newSelected);
  };
  
  const handleSelectAll = () => {
    if (data?.credentials) {
      if (selectedRows.size === data.credentials.length) {
        setSelectedRows(new Set());
      } else {
        setSelectedRows(new Set(data.credentials.map(c => c.id)));
      }
    }
  };
  
  const handleExportSelected = () => {
    if (data?.credentials) {
      const selected = data.credentials.filter(c => selectedRows.has(c.id));
      if (selected.length > 0) {
        const timestamp = new Date().toISOString().split('T')[0];
        exportToJSON(selected, `credentials-export-${timestamp}.json`);
      }
    }
  };
  
  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setSortOrder('desc');
    setPage(1);
  };
  
  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return debouncedSearch || statusFilter !== 'all' || startDate || endDate;
  }, [debouncedSearch, statusFilter, startDate, endDate]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">
          Issued Credentials
        </h2>
        <TableSkeleton />
      </div>
    );
  }
  
  // Render error state
  if (isError) {
    return (
      <div className={`card ${className}`}>
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">
          Issued Credentials
        </h2>
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4" role="alert">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-danger-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-danger-900">Error Loading Credentials</h3>
              <p className="text-sm text-danger-700 mt-1">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['issuer-credentials'] })}
            className="btn-outline mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  const credentials = data?.credentials || [];
  const pagination = data?.pagination;
  
  return (
    <div className={`card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Issued Credentials
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            {pagination?.totalItems || 0} total credentials
          </p>
        </div>
        
        {/* Export Button */}
        {selectedRows.size > 0 && (
          <button
            onClick={handleExportSelected}
            className="btn-primary flex items-center gap-2"
            aria-label={`Export ${selectedRows.size} selected credentials`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export Selected ({selectedRows.size})
          </button>
        )}
      </div>
      
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-neutral-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or type..."
                className="input-field pl-10"
                aria-label="Search credentials"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-neutral-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CredentialStatus | 'all');
                setPage(1);
              }}
              className="input-field"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          {/* Start Date */}
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-neutral-700 mb-1">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="input-field"
              aria-label="Filter by start date"
            />
          </div>
          
          {/* End Date */}
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-neutral-700 mb-1">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="input-field"
              aria-label="Filter by end date"
            />
          </div>
        </div>
        
        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Filters active
            </p>
            <button
              onClick={handleClearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto border border-neutral-200 rounded-lg">
        <table className="w-full" role="table" aria-label="Issued credentials table">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={credentials.length > 0 && selectedRows.size === credentials.length}
                  onChange={handleSelectAll}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  aria-label="Select all credentials"
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Holder
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                <button
                  onClick={handleSortToggle}
                  className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
                  aria-label={`Sort by issued date ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                >
                  Issued At
                  <svg
                    className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
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
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {isFetching && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-600">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading...
                  </div>
                </td>
              </tr>
            )}
            
            {!isFetching && credentials.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <svg
                    className="w-12 h-12 text-neutral-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-neutral-600 font-medium">No credentials found</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    {hasActiveFilters ? 'Try adjusting your filters' : 'No credentials have been issued yet'}
                  </p>
                </td>
              </tr>
            )}
            
            {!isFetching && credentials.map((credential) => (
              <tr
                key={credential.id}
                className="hover:bg-neutral-50 transition-colors"
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(credential.id)}
                    onChange={() => handleSelectRow(credential.id)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    aria-label={`Select credential for ${credential.holderName}`}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-900">
                      {credential.holderName}
                    </span>
                    <span className="text-sm text-neutral-500">
                      {credential.holderEmail}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-neutral-900">
                    {credential.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${getStatusBadgeClass(credential.status)}`}>
                    {credential.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <time
                    dateTime={credential.issuedAt}
                    className="text-sm text-neutral-900"
                  >
                    {formatDate(credential.issuedAt)}
                  </time>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewCredential?.(credential)}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                      aria-label={`View credential for ${credential.holderName}`}
                    >
                      View
                    </button>
                    
                    {credential.status === 'active' && (
                      <button
                        onClick={() => handleRevoke(credential.id)}
                        disabled={revokingId === credential.id}
                        className="text-danger-600 hover:text-danger-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Revoke credential for ${credential.holderName}`}
                      >
                        {revokingId === credential.id ? 'Revoking...' : 'Revoke'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={pagination.currentPage === 1}
              className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to previous page"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNumber;
                if (pagination.totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNumber = pagination.totalPages - 4 + i;
                } else {
                  pageNumber = pagination.currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      pagination.currentPage === pageNumber
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                    aria-label={`Go to page ${pageNumber}`}
                    aria-current={pagination.currentPage === pageNumber ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuerCredentialsTable;
