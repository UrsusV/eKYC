import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import IssuedOverTimeChart, {
  MOCK_ISSUED_OVER_TIME_DATA,
  MOCK_ISSUED_WEEK_DATA,
  MOCK_ISSUED_ONLY_DATA,
} from './IssuedOverTimeChart';
import type { IssuedPerDayData } from './IssuedOverTimeChart';

const meta = {
  title: 'Components/Charts/IssuedOverTimeChart',
  component: IssuedOverTimeChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A responsive line chart component using Recharts to visualize credential issuance, revocation, and verification trends over time. Supports multiple data series, custom colors, and interactive tooltips.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Chart title',
    },
    height: {
      control: { type: 'number', min: 200, max: 800, step: 50 },
      description: 'Chart height in pixels',
    },
    showLegend: {
      control: 'boolean',
      description: 'Show/hide legend',
    },
    showGrid: {
      control: 'boolean',
      description: 'Show/hide grid lines',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading skeleton',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof IssuedOverTimeChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Stories
// ============================================================================

export const Default: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
  },
};

export const WithCustomTitle: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    title: 'Monthly Credential Activity Report',
  },
};

export const WeekView: Story = {
  args: {
    data: MOCK_ISSUED_WEEK_DATA,
    title: 'This Week\'s Activity',
  },
  parameters: {
    docs: {
      description: {
        story: 'Chart showing just 7 days of data for a weekly view.',
      },
    },
  },
};

export const IssuedOnly: Story = {
  args: {
    data: MOCK_ISSUED_ONLY_DATA,
    title: 'Credentials Issued (Last 17 Days)',
    showLines: {
      issued: true,
      revoked: false,
      verified: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Chart showing only issued credentials data, hiding revoked and verified lines.',
      },
    },
  },
};

// ============================================================================
// Configuration Stories
// ============================================================================

export const WithoutLegend: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    showLegend: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Chart without legend for a cleaner, more compact display.',
      },
    },
  },
};

export const WithoutGrid: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    showGrid: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Chart without grid lines for a minimalist look.',
      },
    },
  },
};

export const TallChart: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    height: 600,
  },
  parameters: {
    docs: {
      description: {
        story: 'Taller chart (600px) for better readability with large datasets.',
      },
    },
  },
};

export const CompactChart: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    height: 300,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact chart (300px) for dashboard widgets or space-constrained layouts.',
      },
    },
  },
};

// ============================================================================
// Custom Colors
// ============================================================================

export const CustomColors: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    colors: {
      issued: '#8b5cf6', // purple
      revoked: '#f97316', // orange
      verified: '#06b6d4', // cyan
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Chart with custom color scheme using purple, orange, and cyan.',
      },
    },
  },
};

export const MonochromeTheme: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    colors: {
      issued: '#1f2937', // gray-800
      revoked: '#6b7280', // gray-500
      verified: '#9ca3af', // gray-400
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Monochrome color scheme in shades of gray.',
      },
    },
  },
};

export const BrandColors: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    title: 'Credential Activity - Brand Theme',
    colors: {
      issued: '#6366f1', // indigo-500
      revoked: '#ec4899', // pink-500
      verified: '#14b8a6', // teal-500
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Chart using brand-specific colors.',
      },
    },
  },
};

// ============================================================================
// Line Visibility
// ============================================================================

export const IssuedAndRevoked: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    title: 'Issued vs Revoked Credentials',
    showLines: {
      issued: true,
      revoked: true,
      verified: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Showing only issued and revoked lines for comparison.',
      },
    },
  },
};

export const IssuedAndVerified: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    title: 'Issued vs Verified Credentials',
    showLines: {
      issued: true,
      revoked: false,
      verified: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Showing only issued and verified lines to track verification rates.',
      },
    },
  },
};

export const RevokedOnly: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    title: 'Credential Revocations',
    showLines: {
      issued: false,
      revoked: true,
      verified: false,
    },
    colors: {
      revoked: '#dc2626', // red-600
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Showing only revoked credentials to monitor security concerns.',
      },
    },
  },
};

export const VerifiedOnly: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    title: 'Credential Verifications',
    showLines: {
      issued: false,
      revoked: false,
      verified: true,
    },
    colors: {
      verified: '#059669', // emerald-600
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Showing only verified credentials to track verification activity.',
      },
    },
  },
};

// ============================================================================
// Loading and Empty States
// ============================================================================

export const Loading: Story = {
  args: {
    data: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with animated skeleton placeholder.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    data: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no data is available.',
      },
    },
  },
};

// ============================================================================
// Real-World Data Patterns
// ============================================================================

const growingTrendData: IssuedPerDayData[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2025, 8, 18 + i).toISOString().split('T')[0]!,
  issued: Math.floor(40 + i * 2.5 + Math.random() * 10),
  revoked: Math.floor(1 + Math.random() * 3),
  verified: Math.floor((40 + i * 2.5) * 2.8 + Math.random() * 20),
}));

export const GrowingTrend: Story = {
  args: {
    data: growingTrendData,
    title: 'Growing Platform - 30 Day Trend',
  },
  parameters: {
    docs: {
      description: {
        story: 'Simulated data showing steady growth in credential issuance over 30 days.',
      },
    },
  },
};

const volatileData: IssuedPerDayData[] = Array.from({ length: 20 }, (_, i) => ({
  date: new Date(2025, 9, i + 1).toISOString().split('T')[0]!,
  issued: Math.floor(50 + Math.random() * 60),
  revoked: Math.floor(Math.random() * 10),
  verified: Math.floor(100 + Math.random() * 100),
}));

export const VolatileActivity: Story = {
  args: {
    data: volatileData,
    title: 'Volatile Activity Pattern',
  },
  parameters: {
    docs: {
      description: {
        story: 'Data with high variance showing unpredictable usage patterns.',
      },
    },
  },
};

const weekdayPatternData: IssuedPerDayData[] = Array.from({ length: 28 }, (_, i) => {
  const dayOfWeek = i % 7;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const baseIssued = isWeekend ? 30 : 80;
  const baseVerified = isWeekend ? 60 : 200;
  
  return {
    date: new Date(2025, 8, 20 + i).toISOString().split('T')[0]!,
    issued: Math.floor(baseIssued + Math.random() * 10),
    revoked: Math.floor(1 + Math.random() * 3),
    verified: Math.floor(baseVerified + Math.random() * 20),
  };
});

export const WeekdayPattern: Story = {
  args: {
    data: weekdayPatternData,
    title: 'Weekday vs Weekend Activity (4 Weeks)',
  },
  parameters: {
    docs: {
      description: {
        story: 'Data showing clear weekday peaks and weekend drops, simulating business hours activity.',
      },
    },
  },
};

const spikeData: IssuedPerDayData[] = [
  { date: '2025-10-08', issued: 55, revoked: 2, verified: 145 },
  { date: '2025-10-09', issued: 58, revoked: 1, verified: 152 },
  { date: '2025-10-10', issued: 62, revoked: 3, verified: 168 },
  { date: '2025-10-11', issued: 245, revoked: 8, verified: 612 }, // Spike
  { date: '2025-10-12', issued: 68, revoked: 2, verified: 178 },
  { date: '2025-10-13', issued: 63, revoked: 1, verified: 165 },
  { date: '2025-10-14', issued: 71, revoked: 4, verified: 188 },
];

export const AnomalousSpike: Story = {
  args: {
    data: spikeData,
    title: 'Activity with Anomalous Spike',
  },
  parameters: {
    docs: {
      description: {
        story: 'Data showing an unusual spike on Oct 11, potentially indicating a bulk import or marketing campaign.',
      },
    },
  },
};

// ============================================================================
// Layout Examples
// ============================================================================

export const InDashboard: Story = {
  render: (args) => (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Analytics Dashboard</h1>
          <p className="text-neutral-600">
            Comprehensive view of credential activity over time
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IssuedOverTimeChart {...args} height={350} />
          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Summary Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Issued:</span>
                <span className="font-semibold text-neutral-900">2,134</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Revoked:</span>
                <span className="font-semibold text-neutral-900">52</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Verified:</span>
                <span className="font-semibold text-neutral-900">5,487</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
  },
  parameters: {
    docs: {
      description: {
        story: 'Chart integrated into a dashboard layout with related statistics.',
      },
    },
  },
};

export const FullWidthReport: Story = {
  render: (args) => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Monthly Activity Report
        </h1>
        <p className="text-neutral-600">
          September 18 - October 17, 2025
        </p>
      </div>
      
      <IssuedOverTimeChart {...args} />
      
      <div className="grid grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-1">2,134</div>
          <div className="text-sm text-neutral-600">Total Issued</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-danger-600 mb-1">52</div>
          <div className="text-sm text-neutral-600">Total Revoked</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-success-600 mb-1">5,487</div>
          <div className="text-sm text-neutral-600">Total Verified</div>
        </div>
      </div>
    </div>
  ),
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
    title: 'Credential Activity Over Time',
    height: 450,
  },
  parameters: {
    docs: {
      description: {
        story: 'Full-width chart for detailed reporting with summary cards below.',
      },
    },
  },
};

// ============================================================================
// Responsive Examples
// ============================================================================

export const MobileView: Story = {
  args: {
    data: MOCK_ISSUED_WEEK_DATA,
    title: 'This Week',
    height: 300,
    showLegend: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Optimized for mobile with shorter data range, compact height, and no legend.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA.slice(0, 14),
    title: 'Last 2 Weeks',
    height: 350,
  },
  parameters: {
    docs: {
      description: {
        story: 'Optimized for tablet with 2 weeks of data.',
      },
    },
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

// ============================================================================
// Interactive Demo
// ============================================================================

export const InteractiveDemo: Story = {
  args: {
    data: MOCK_ISSUED_OVER_TIME_DATA,
  },
  render: () => {
    const [dataRange, setDataRange] = React.useState<'week' | 'month'>('month');
    const [showGrid, setShowGrid] = React.useState(true);
    const [showLegend, setShowLegend] = React.useState(true);
    
    const data = dataRange === 'week' ? MOCK_ISSUED_WEEK_DATA : MOCK_ISSUED_OVER_TIME_DATA;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Interactive Chart Demo</h2>
          <div className="flex gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setDataRange('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dataRange === 'week'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setDataRange('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dataRange === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Month
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="btn-outline"
              >
                Grid: {showGrid ? 'On' : 'Off'}
              </button>
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="btn-outline"
              >
                Legend: {showLegend ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>
        
        <IssuedOverTimeChart
          data={data}
          title={`Credential Activity - ${dataRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}`}
          showGrid={showGrid}
          showLegend={showLegend}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demonstration with toggles for data range, grid, and legend.',
      },
    },
  },
};
