import React from 'react';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getColorClasses = (color: string): { bg: string; text: string; icon: string } => {
  switch (color) {
    case 'primary':
      return {
        bg: 'bg-primary-50',
        text: 'text-primary-900',
        icon: 'text-primary-600',
      };
    case 'success':
      return {
        bg: 'bg-success-50',
        text: 'text-success-900',
        icon: 'text-success-600',
      };
    case 'warning':
      return {
        bg: 'bg-warning-50',
        text: 'text-warning-900',
        icon: 'text-warning-600',
      };
    case 'danger':
      return {
        bg: 'bg-danger-50',
        text: 'text-danger-900',
        icon: 'text-danger-600',
      };
    default:
      return {
        bg: 'bg-neutral-50',
        text: 'text-neutral-900',
        icon: 'text-neutral-600',
      };
  }
};

const getTrendColorClass = (direction: string): string => {
  switch (direction) {
    case 'up':
      return 'text-success-600';
    case 'down':
      return 'text-danger-600';
    default:
      return 'text-neutral-600';
  }
};

const getTrendIcon = (direction: string) => {
  if (direction === 'up') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    );
  }
  
  if (direction === 'down') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
        />
      </svg>
    );
  }
  
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 12h14"
      />
    </svg>
  );
};

// ============================================================================
// Loading Skeleton Component
// ============================================================================

const StatCardSkeleton: React.FC<{ color: string }> = ({ color }) => {
  const colors = getColorClasses(color);
  
  return (
    <div className={`card ${colors.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 bg-neutral-200 rounded w-24 mb-3 animate-pulse" />
          <div className="h-8 bg-neutral-200 rounded w-32 mb-2 animate-pulse" />
          <div className="h-3 bg-neutral-200 rounded w-20 animate-pulse" />
        </div>
        <div className="w-12 h-12 bg-neutral-200 rounded-full animate-pulse" />
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'neutral',
  isLoading = false,
  className = '',
}) => {
  const colors = getColorClasses(color);
  
  if (isLoading) {
    return <StatCardSkeleton color={color} />;
  }
  
  return (
    <div className={`card ${colors.bg} ${className}`}>
      <div className="flex items-start justify-between">
        {/* Left Content */}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-neutral-600 mb-2">
            {title}
          </h3>
          
          <div className={`text-3xl font-bold ${colors.text} mb-2`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {/* Subtitle or Trend */}
          {trend ? (
            <div className="flex items-center gap-1">
              <span className={`flex items-center gap-0.5 ${getTrendColorClass(trend.direction)}`}>
                {getTrendIcon(trend.direction)}
                <span className="text-sm font-semibold">
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
              </span>
              <span className="text-sm text-neutral-600">
                {trend.label}
              </span>
            </div>
          ) : subtitle ? (
            <p className="text-sm text-neutral-600">{subtitle}</p>
          ) : null}
        </div>
        
        {/* Icon */}
        {icon && (
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center ${colors.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
