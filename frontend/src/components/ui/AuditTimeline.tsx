import React, { useState } from 'react';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AuditEventType = 'issued' | 'consent_granted' | 'consent_revoked' | 'verified' | 'revoked';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  actor: string;
  timestamp: string | Date;
  details: string;
}

export interface AuditTimelineProps {
  events: AuditEvent[];
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats a timestamp into a human-readable string
 */
const formatTimestamp = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  return `${dateStr} at ${timeStr}`;
};

/**
 * Gets relative time description (e.g., "2 hours ago")
 */
const getRelativeTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  
  return formatTimestamp(date);
};

/**
 * Gets event metadata based on event type
 */
const getEventMetadata = (type: AuditEventType) => {
  switch (type) {
    case 'issued':
      return {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        label: 'Issued',
        colorClass: 'bg-success-100 text-success-700 border-success-300',
        iconBgClass: 'bg-success-500',
      };
    case 'consent_granted':
      return {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
        ),
        label: 'Consent Granted',
        colorClass: 'bg-primary-100 text-primary-700 border-primary-300',
        iconBgClass: 'bg-primary-500',
      };
    case 'consent_revoked':
      return {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        label: 'Consent Revoked',
        colorClass: 'bg-warning-100 text-warning-700 border-warning-300',
        iconBgClass: 'bg-warning-500',
      };
    case 'verified':
      return {
        icon: (
          <svg
            className="w-5 h-5"
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
        ),
        label: 'Verified',
        colorClass: 'bg-secondary-100 text-secondary-700 border-secondary-300',
        iconBgClass: 'bg-secondary-500',
      };
    case 'revoked':
      return {
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        label: 'Revoked',
        colorClass: 'bg-danger-100 text-danger-700 border-danger-300',
        iconBgClass: 'bg-danger-500',
      };
  }
};

/**
 * Converts events array to CSV format
 */
const convertToCSV = (events: AuditEvent[]): string => {
  if (events.length === 0) {
    return 'ID,Type,Actor,Timestamp,Details\n';
  }
  
  const headers = ['ID', 'Type', 'Actor', 'Timestamp', 'Details'];
  const csvHeaders = headers.join(',');
  
  const csvRows = events.map((event) => {
    const timestamp = typeof event.timestamp === 'string' 
      ? event.timestamp 
      : event.timestamp.toISOString();
    
    // Escape fields that contain commas or quotes
    const escapeField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    
    return [
      escapeField(event.id),
      escapeField(event.type),
      escapeField(event.actor),
      escapeField(timestamp),
      escapeField(event.details),
    ].join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};

/**
 * Triggers CSV download in browser
 */
const downloadCSV = (events: AuditEvent[], filename: string = 'audit-timeline.csv') => {
  const csv = convertToCSV(events);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// ============================================================================
// Main Component
// ============================================================================

const AuditTimeline: React.FC<AuditTimelineProps> = ({ events, className = '' }) => {
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  
  // Sort events by timestamp (most recent first)
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp;
    const dateB = typeof b.timestamp === 'string' ? new Date(b.timestamp) : b.timestamp;
    return dateB.getTime() - dateA.getTime();
  });
  
  const handleDownloadCSV = () => {
    downloadCSV(sortedEvents);
  };
  
  const handleEventKeyDown = (event: React.KeyboardEvent, eventId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setFocusedEventId(eventId === focusedEventId ? null : eventId);
    }
  };
  
  if (events.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Audit Timeline</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Track all credential-related activities
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            className="w-16 h-16 text-neutral-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-neutral-600 font-medium">No audit events yet</p>
          <p className="text-sm text-neutral-500 mt-1">
            Events will appear here as activities occur
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`card ${className}`}>
      {/* Header with Download Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Audit Timeline</h2>
          <p className="text-sm text-neutral-600 mt-1">
            {sortedEvents.length} {sortedEvents.length === 1 ? 'event' : 'events'} recorded
          </p>
        </div>
        
        <button
          onClick={handleDownloadCSV}
          className="btn-outline flex items-center gap-2 text-sm"
          aria-label="Download audit timeline as CSV"
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
          Download CSV
        </button>
      </div>
      
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-neutral-200"
          aria-hidden="true"
        />
        
        {/* Events */}
        <ul className="space-y-6" role="list" aria-label="Audit events timeline">
          {sortedEvents.map((event, index) => {
            const metadata = getEventMetadata(event.type);
            const isExpanded = focusedEventId === event.id;
            const isLastEvent = index === sortedEvents.length - 1;
            
            return (
              <li
                key={event.id}
                className="relative pl-14"
                role="listitem"
              >
                {/* Icon */}
                <div
                  className={`absolute left-0 flex items-center justify-center w-12 h-12 rounded-full ${metadata.iconBgClass} text-white ring-4 ring-white shadow-md`}
                  aria-hidden="true"
                >
                  {metadata.icon}
                </div>
                
                {/* Event Card */}
                <div
                  className={`
                    border-2 rounded-lg p-4 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    hover:shadow-md cursor-pointer
                    ${metadata.colorClass}
                    ${isExpanded ? 'shadow-lg scale-[1.02]' : 'shadow-sm'}
                  `}
                  tabIndex={0}
                  role="article"
                  aria-expanded={isExpanded}
                  aria-label={`${metadata.label} event by ${event.actor}`}
                  onFocus={() => setFocusedEventId(event.id)}
                  onBlur={() => setFocusedEventId(null)}
                  onKeyDown={(e) => handleEventKeyDown(e, event.id)}
                  onClick={() => setFocusedEventId(event.id === focusedEventId ? null : event.id)}
                >
                  {/* Event Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base">
                          {metadata.label}
                        </span>
                        {index === 0 && (
                          <span className="badge-primary text-xs px-2 py-0.5">
                            Latest
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium opacity-90">
                        by {event.actor}
                      </p>
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-right flex-shrink-0">
                      <time
                        dateTime={
                          typeof event.timestamp === 'string'
                            ? event.timestamp
                            : event.timestamp.toISOString()
                        }
                        className="text-sm font-medium opacity-90"
                        title={formatTimestamp(event.timestamp)}
                      >
                        {getRelativeTime(event.timestamp)}
                      </time>
                      <p className="text-xs opacity-70 mt-0.5">
                        {new Date(event.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Event Details */}
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <p className="text-sm leading-relaxed opacity-90">
                      {event.details}
                    </p>
                    
                    {/* Event ID (shown on focus/hover) */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                        <p className="text-xs font-mono opacity-70">
                          Event ID: {event.id}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatTimestamp(event.timestamp)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Visual connector for last event */}
                {isLastEvent && (
                  <div
                    className="absolute left-[23px] top-12 w-0.5 h-6 bg-gradient-to-b from-neutral-200 to-transparent"
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Footer Summary */}
      <div className="mt-8 pt-6 border-t border-neutral-200">
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <div className="flex items-center gap-2">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Timeline shows events from most recent to oldest
            </span>
          </div>
          
          <button
            onClick={() => {
              const firstEvent = document.querySelector('[role="article"]') as HTMLElement;
              firstEvent?.focus();
            }}
            className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
            aria-label="Jump to most recent event"
          >
            Jump to top
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditTimeline;
