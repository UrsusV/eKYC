import React from 'react';
import StatCard from './StatCard';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface StatsData {
  totalCredentials: number;
  activeCredentials: number;
  revokedThisMonth: number;
  avgTimeToVerify: string; // e.g., "2.5s" or "1.2 hrs"
  
  // Optional trend data
  totalCredentialsTrend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  activeCredentialsTrend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  revokedThisMonthTrend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  avgTimeToVerifyTrend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

export interface StatsGridProps {
  data: StatsData;
  isLoading?: boolean;
  className?: string;
  showTrends?: boolean;
}

// ============================================================================
// Icons
// ============================================================================

const TotalCredentialsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ActiveCredentialsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const RevokedIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
    />
  </svg>
);

const TimeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// ============================================================================
// Main Component
// ============================================================================

const StatsGrid: React.FC<StatsGridProps> = ({
  data,
  isLoading = false,
  className = '',
  showTrends = true,
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {/* Total Credentials */}
      <StatCard
        title="Total Credentials"
        value={data.totalCredentials}
        subtitle={showTrends && !data.totalCredentialsTrend ? 'All time' : undefined}
        icon={<TotalCredentialsIcon />}
        trend={
          showTrends && data.totalCredentialsTrend
            ? {
                value: data.totalCredentialsTrend.value,
                direction: data.totalCredentialsTrend.direction,
                label: 'from last month',
              }
            : undefined
        }
        color="primary"
        isLoading={isLoading}
      />
      
      {/* Active Credentials */}
      <StatCard
        title="Active Credentials"
        value={data.activeCredentials}
        subtitle={showTrends && !data.activeCredentialsTrend ? 'Currently valid' : undefined}
        icon={<ActiveCredentialsIcon />}
        trend={
          showTrends && data.activeCredentialsTrend
            ? {
                value: data.activeCredentialsTrend.value,
                direction: data.activeCredentialsTrend.direction,
                label: 'from last month',
              }
            : undefined
        }
        color="success"
        isLoading={isLoading}
      />
      
      {/* Revoked This Month */}
      <StatCard
        title="Revoked This Month"
        value={data.revokedThisMonth}
        subtitle={showTrends && !data.revokedThisMonthTrend ? 'Current month' : undefined}
        icon={<RevokedIcon />}
        trend={
          showTrends && data.revokedThisMonthTrend
            ? {
                value: data.revokedThisMonthTrend.value,
                direction: data.revokedThisMonthTrend.direction,
                label: 'from last month',
              }
            : undefined
        }
        color="danger"
        isLoading={isLoading}
      />
      
      {/* Average Time to Verify */}
      <StatCard
        title="Avg. Time to Verify"
        value={data.avgTimeToVerify}
        subtitle={showTrends && !data.avgTimeToVerifyTrend ? 'Last 30 days' : undefined}
        icon={<TimeIcon />}
        trend={
          showTrends && data.avgTimeToVerifyTrend
            ? {
                value: data.avgTimeToVerifyTrend.value,
                direction: data.avgTimeToVerifyTrend.direction,
                label: 'from last month',
              }
            : undefined
        }
        color="warning"
        isLoading={isLoading}
      />
    </div>
  );
};

export default StatsGrid;
