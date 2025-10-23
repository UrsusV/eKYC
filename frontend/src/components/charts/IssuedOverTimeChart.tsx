import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Data point for issued credentials per day
 */
export interface IssuedPerDayData {
  date: string; // Format: "YYYY-MM-DD" or "MMM DD"
  issued: number; // Number of credentials issued on this day
  revoked?: number; // Optional: Number of credentials revoked on this day
  verified?: number; // Optional: Number of credentials verified on this day
}

export interface IssuedOverTimeChartProps {
  /**
   * Array of daily credential statistics
   */
  data: IssuedPerDayData[];
  
  /**
   * Chart title
   */
  title?: string;
  
  /**
   * Chart height in pixels
   */
  height?: number;
  
  /**
   * Show legend
   */
  showLegend?: boolean;
  
  /**
   * Show grid lines
   */
  showGrid?: boolean;
  
  /**
   * Loading state
   */
  isLoading?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Line colors
   */
  colors?: {
    issued?: string;
    revoked?: string;
    verified?: string;
  };
  
  /**
   * Lines to display
   */
  showLines?: {
    issued?: boolean;
    revoked?: boolean;
    verified?: boolean;
  };
}

// ============================================================================
// Default Colors
// ============================================================================

const DEFAULT_COLORS = {
  issued: '#3b82f6', // blue-500
  revoked: '#ef4444', // red-500
  verified: '#10b981', // green-500
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

// ============================================================================
// Custom Tooltip Component
// ============================================================================

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-4">
      <p className="text-sm font-semibold text-neutral-900 mb-2">
        {formatDate(label)}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-neutral-700 capitalize">
                {entry.name}:
              </span>
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              {formatNumber(entry.value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Loading Skeleton Component
// ============================================================================

const ChartSkeleton: React.FC<{ height: number }> = ({ height }) => {
  return (
    <div className="card">
      <div className="animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-48 mb-6" />
        <div className="space-y-4">
          <div className="flex items-end justify-between h-48">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="bg-neutral-200 rounded-t"
                style={{
                  width: '12%',
                  height: `${Math.random() * 80 + 20}%`,
                }}
              />
            ))}
          </div>
          <div className="flex justify-center gap-6">
            <div className="h-4 bg-neutral-200 rounded w-20" />
            <div className="h-4 bg-neutral-200 rounded w-20" />
            <div className="h-4 bg-neutral-200 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Empty State Component
// ============================================================================

const EmptyState: React.FC = () => {
  return (
    <div className="card">
      <div className="flex flex-col items-center justify-center py-12">
        <svg
          className="w-16 h-16 text-neutral-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-neutral-600 text-center">
          No data available for the selected period
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const IssuedOverTimeChart: React.FC<IssuedOverTimeChartProps> = ({
  data,
  title = 'Credentials Issued Over Time',
  height = 400,
  showLegend = true,
  showGrid = true,
  isLoading = false,
  className = '',
  colors = DEFAULT_COLORS,
  showLines = {
    issued: true,
    revoked: true,
    verified: true,
  },
}) => {
  // Loading state
  if (isLoading) {
    return <ChartSkeleton height={height} />;
  }
  
  // Empty state
  if (!data || data.length === 0) {
    return <EmptyState />;
  }
  
  // Merge default colors with provided colors
  const finalColors = { ...DEFAULT_COLORS, ...colors };
  
  return (
    <div className={`card ${className}`}>
      {/* Title */}
      {title && (
        <h3 className="text-lg font-semibold text-neutral-900 mb-6">
          {title}
        </h3>
      )}
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {/* Grid */}
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
          )}
          
          {/* X Axis */}
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          
          {/* Y Axis */}
          <YAxis
            tickFormatter={formatNumber}
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          
          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} />
          
          {/* Legend */}
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
              iconType="line"
              formatter={(value) => (
                <span style={{ color: '#374151', fontSize: '14px' }}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
              )}
            />
          )}
          
          {/* Lines */}
          {showLines.issued !== false && (
            <Line
              type="monotone"
              dataKey="issued"
              stroke={finalColors.issued}
              strokeWidth={2}
              dot={{ fill: finalColors.issued, r: 4 }}
              activeDot={{ r: 6 }}
              name="issued"
            />
          )}
          
          {showLines.revoked !== false && (
            <Line
              type="monotone"
              dataKey="revoked"
              stroke={finalColors.revoked}
              strokeWidth={2}
              dot={{ fill: finalColors.revoked, r: 4 }}
              activeDot={{ r: 6 }}
              name="revoked"
            />
          )}
          
          {showLines.verified !== false && (
            <Line
              type="monotone"
              dataKey="verified"
              stroke={finalColors.verified}
              strokeWidth={2}
              dot={{ fill: finalColors.verified, r: 4 }}
              activeDot={{ r: 6 }}
              name="verified"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <p className="text-sm text-neutral-600 text-center">
          Showing data for {data.length} days
          {data.length > 0 && (
            <> from {formatDate(data[0].date)} to {formatDate(data[data.length - 1].date)}</>
          )}
        </p>
      </div>
    </div>
  );
};

export default IssuedOverTimeChart;

// ============================================================================
// Example Mock Dataset
// ============================================================================

/**
 * Example mock dataset for testing and Storybook
 * 
 * This dataset represents 30 days of credential activity with:
 * - Daily issued credentials trending upward
 * - Occasional revocations
 * - High verification activity
 */
export const MOCK_ISSUED_OVER_TIME_DATA: IssuedPerDayData[] = [
  { date: '2025-09-18', issued: 45, revoked: 2, verified: 120 },
  { date: '2025-09-19', issued: 52, revoked: 1, verified: 135 },
  { date: '2025-09-20', issued: 48, revoked: 3, verified: 142 },
  { date: '2025-09-21', issued: 38, revoked: 0, verified: 98 },
  { date: '2025-09-22', issued: 41, revoked: 1, verified: 105 },
  { date: '2025-09-23', issued: 55, revoked: 2, verified: 148 },
  { date: '2025-09-24', issued: 61, revoked: 1, verified: 156 },
  { date: '2025-09-25', issued: 58, revoked: 4, verified: 163 },
  { date: '2025-09-26', issued: 63, revoked: 2, verified: 171 },
  { date: '2025-09-27', issued: 59, revoked: 1, verified: 158 },
  { date: '2025-09-28', issued: 44, revoked: 0, verified: 112 },
  { date: '2025-09-29', issued: 47, revoked: 2, verified: 118 },
  { date: '2025-09-30', issued: 68, revoked: 3, verified: 182 },
  { date: '2025-10-01', issued: 72, revoked: 1, verified: 195 },
  { date: '2025-10-02', issued: 69, revoked: 2, verified: 188 },
  { date: '2025-10-03', issued: 75, revoked: 1, verified: 201 },
  { date: '2025-10-04', issued: 71, revoked: 3, verified: 193 },
  { date: '2025-10-05', issued: 53, revoked: 0, verified: 142 },
  { date: '2025-10-06', issued: 56, revoked: 1, verified: 151 },
  { date: '2025-10-07', issued: 78, revoked: 2, verified: 209 },
  { date: '2025-10-08', issued: 82, revoked: 4, verified: 218 },
  { date: '2025-10-09', issued: 79, revoked: 1, verified: 212 },
  { date: '2025-10-10', issued: 85, revoked: 2, verified: 227 },
  { date: '2025-10-11', issued: 81, revoked: 3, verified: 221 },
  { date: '2025-10-12', issued: 62, revoked: 1, verified: 167 },
  { date: '2025-10-13', issued: 65, revoked: 0, verified: 175 },
  { date: '2025-10-14', issued: 88, revoked: 2, verified: 236 },
  { date: '2025-10-15', issued: 91, revoked: 1, verified: 243 },
  { date: '2025-10-16', issued: 87, revoked: 3, verified: 238 },
  { date: '2025-10-17', issued: 93, revoked: 2, verified: 251 },
];

/**
 * Simple 7-day mock dataset
 */
export const MOCK_ISSUED_WEEK_DATA: IssuedPerDayData[] = [
  { date: '2025-10-11', issued: 81, revoked: 3, verified: 221 },
  { date: '2025-10-12', issued: 62, revoked: 1, verified: 167 },
  { date: '2025-10-13', issued: 65, revoked: 0, verified: 175 },
  { date: '2025-10-14', issued: 88, revoked: 2, verified: 236 },
  { date: '2025-10-15', issued: 91, revoked: 1, verified: 243 },
  { date: '2025-10-16', issued: 87, revoked: 3, verified: 238 },
  { date: '2025-10-17', issued: 93, revoked: 2, verified: 251 },
];

/**
 * Issued only dataset (without revoked/verified)
 */
export const MOCK_ISSUED_ONLY_DATA: IssuedPerDayData[] = [
  { date: '2025-10-01', issued: 72 },
  { date: '2025-10-02', issued: 69 },
  { date: '2025-10-03', issued: 75 },
  { date: '2025-10-04', issued: 71 },
  { date: '2025-10-05', issued: 53 },
  { date: '2025-10-06', issued: 56 },
  { date: '2025-10-07', issued: 78 },
  { date: '2025-10-08', issued: 82 },
  { date: '2025-10-09', issued: 79 },
  { date: '2025-10-10', issued: 85 },
  { date: '2025-10-11', issued: 81 },
  { date: '2025-10-12', issued: 62 },
  { date: '2025-10-13', issued: 65 },
  { date: '2025-10-14', issued: 88 },
  { date: '2025-10-15', issued: 91 },
  { date: '2025-10-16', issued: 87 },
  { date: '2025-10-17', issued: 93 },
];
