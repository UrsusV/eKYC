import React, { useState } from 'react';
import type { AuditEvent } from '../components/ui/AuditTimeline';

const AuditLogsPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Fetch audit events on mount
  React.useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/audit');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    
    let matchesDate = true;
    if (dateRange.start || dateRange.end) {
      const eventDate = new Date(event.timestamp);
      if (dateRange.start) matchesDate = matchesDate && eventDate >= new Date(dateRange.start);
      if (dateRange.end) matchesDate = matchesDate && eventDate <= new Date(dateRange.end);
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  // Stats
  const stats = {
    total: events.length,
    today: events.filter(e => {
      const eventDate = new Date(e.timestamp);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    }).length,
    issued: events.filter(e => e.type === 'issued').length,
    verified: events.filter(e => e.type === 'verified').length,
    consents: events.filter(e => e.type === 'consent_granted' || e.type === 'consent_revoked').length,
    revoked: events.filter(e => e.type === 'revoked').length,
  };

  const getEventIcon = (type: string) => {
    const icons = {
      issued: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      verified: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      consent_granted: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      consent_revoked: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
        </svg>
      ),
      revoked: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      accessed: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    };
    return icons[type as keyof typeof icons] || icons.accessed;
  };

  const getEventColor = (type: string) => {
    const colors = {
      issued: 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400',
      verified: 'bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400',
      consent_granted: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/20 dark:text-secondary-400',
      consent_revoked: 'bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400',
      revoked: 'bg-danger-100 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400',
      accessed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    return colors[type as keyof typeof colors] || colors.accessed;
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Type', 'Actor', 'Details'];
    const rows = filteredEvents.map(event => [
      event.timestamp,
      event.type,
      event.actor,
      event.details,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Audit Logs</h1>
            <p className="text-muted-foreground">System-wide activity and security audit trail</p>
          </div>
          <button
            onClick={exportToCSV}
            className="btn-primary flex items-center gap-2"
            disabled={filteredEvents.length === 0}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="card p-3">
            <p className="text-xs text-muted-foreground mb-1">Total Events</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-muted-foreground mb-1">Today</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.today}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-muted-foreground mb-1">Issued</p>
            <p className="text-2xl font-bold text-foreground">{stats.issued}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-muted-foreground mb-1">Verified</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">{stats.verified}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-muted-foreground mb-1">Consents</p>
            <p className="text-2xl font-bold text-foreground">{stats.consents}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-muted-foreground mb-1">Revoked</p>
            <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">{stats.revoked}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">Search</label>
              <input
                type="text"
                placeholder="Search by actor or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Event Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Types</option>
                <option value="issued">Issued</option>
                <option value="verified">Verified</option>
                <option value="consent_granted">Consent Granted</option>
                <option value="consent_revoked">Consent Revoked</option>
                <option value="revoked">Revoked</option>
                <option value="accessed">Accessed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="input-field w-full text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Audit Events List */}
        <div className="card">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              <p className="mt-2 text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No audit events found matching your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getEventColor(event.type)}`}>
                              {event.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-foreground">{event.actor}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.details}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {event.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results Summary */}
        {!loading && filteredEvents.length > 0 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Showing {filteredEvents.length} of {events.length} events
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
