import type { Meta, StoryObj } from '@storybook/react';
import StatsGrid from './StatsGrid';
import type { StatsData } from './StatsGrid';

const meta = {
  title: 'Components/UI/StatsGrid',
  component: StatsGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A grid layout component displaying four key statistics: Total Credentials, Active Credentials, Revoked This Month, and Average Time to Verify. Designed for dashboard overviews.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isLoading: {
      control: 'boolean',
      description: 'Show loading skeletons for all cards',
    },
    showTrends: {
      control: 'boolean',
      description: 'Show trend indicators when trend data is available',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof StatsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Mock Data
// ============================================================================

const mockData: StatsData = {
  totalCredentials: 12458,
  activeCredentials: 11234,
  revokedThisMonth: 47,
  avgTimeToVerify: '2.3s',
};

const mockDataWithTrends: StatsData = {
  totalCredentials: 12458,
  activeCredentials: 11234,
  revokedThisMonth: 47,
  avgTimeToVerify: '2.3s',
  totalCredentialsTrend: {
    value: 8.3,
    direction: 'up',
  },
  activeCredentialsTrend: {
    value: 5.7,
    direction: 'up',
  },
  revokedThisMonthTrend: {
    value: -12.8,
    direction: 'down',
  },
  avgTimeToVerifyTrend: {
    value: -8.5,
    direction: 'down',
  },
};

const mockDataHighVolume: StatsData = {
  totalCredentials: 1245832,
  activeCredentials: 987654,
  revokedThisMonth: 1234,
  avgTimeToVerify: '1.8s',
  totalCredentialsTrend: {
    value: 15.2,
    direction: 'up',
  },
  activeCredentialsTrend: {
    value: 12.4,
    direction: 'up',
  },
  revokedThisMonthTrend: {
    value: 23.5,
    direction: 'up',
  },
  avgTimeToVerifyTrend: {
    value: -15.3,
    direction: 'down',
  },
};

const mockDataLowActivity: StatsData = {
  totalCredentials: 156,
  activeCredentials: 142,
  revokedThisMonth: 3,
  avgTimeToVerify: '3.7s',
  totalCredentialsTrend: {
    value: 2.1,
    direction: 'up',
  },
  activeCredentialsTrend: {
    value: 1.5,
    direction: 'up',
  },
  revokedThisMonthTrend: {
    value: -40.0,
    direction: 'down',
  },
  avgTimeToVerifyTrend: {
    value: 5.2,
    direction: 'up',
  },
};

const mockDataNegativeTrends: StatsData = {
  totalCredentials: 8456,
  activeCredentials: 7234,
  revokedThisMonth: 89,
  avgTimeToVerify: '4.2s',
  totalCredentialsTrend: {
    value: -3.5,
    direction: 'down',
  },
  activeCredentialsTrend: {
    value: -5.2,
    direction: 'down',
  },
  revokedThisMonthTrend: {
    value: 45.8,
    direction: 'up',
  },
  avgTimeToVerifyTrend: {
    value: 18.3,
    direction: 'up',
  },
};

// ============================================================================
// Basic Stories
// ============================================================================

export const Default: Story = {
  args: {
    data: mockData,
    showTrends: false,
  },
};

export const WithTrends: Story = {
  args: {
    data: mockDataWithTrends,
    showTrends: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Stats grid with trend indicators showing percentage change from previous period.',
      },
    },
  },
};

export const WithoutTrends: Story = {
  args: {
    data: mockData,
    showTrends: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Stats grid without trend indicators, showing only subtitle text.',
      },
    },
  },
};

// ============================================================================
// Loading State
// ============================================================================

export const Loading: Story = {
  args: {
    data: mockData,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with animated skeleton loaders for all cards.',
      },
    },
  },
};

// ============================================================================
// Different Data Scales
// ============================================================================

export const HighVolumeEnterprise: Story = {
  args: {
    data: mockDataHighVolume,
    showTrends: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Stats for a high-volume enterprise system with over 1 million credentials.',
      },
    },
  },
};

export const LowActivityStartup: Story = {
  args: {
    data: mockDataLowActivity,
    showTrends: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Stats for a startup or small organization with lower activity.',
      },
    },
  },
};

export const NegativeTrends: Story = {
  args: {
    data: mockDataNegativeTrends,
    showTrends: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing negative trends with declining active users and increasing revocations.',
      },
    },
  },
};

// ============================================================================
// Real-World Scenarios
// ============================================================================

export const GrowingPlatform: Story = {
  args: {
    data: {
      totalCredentials: 45623,
      activeCredentials: 42108,
      revokedThisMonth: 156,
      avgTimeToVerify: '1.9s',
      totalCredentialsTrend: {
        value: 22.4,
        direction: 'up',
      },
      activeCredentialsTrend: {
        value: 19.8,
        direction: 'up',
      },
      revokedThisMonthTrend: {
        value: -8.3,
        direction: 'down',
      },
      avgTimeToVerifyTrend: {
        value: -12.5,
        direction: 'down',
      },
    },
    showTrends: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Growing platform with positive trends: increasing credentials, decreasing revocations, and improving verification speed.',
      },
    },
  },
};

export const MaturePlatform: Story = {
  args: {
    data: {
      totalCredentials: 987456,
      activeCredentials: 892341,
      revokedThisMonth: 523,
      avgTimeToVerify: '1.5s',
      totalCredentialsTrend: {
        value: 2.1,
        direction: 'up',
      },
      activeCredentialsTrend: {
        value: 1.8,
        direction: 'up',
      },
      revokedThisMonthTrend: {
        value: -3.2,
        direction: 'down',
      },
      avgTimeToVerifyTrend: {
        value: 0,
        direction: 'neutral',
      },
    },
    showTrends: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Mature platform with stable, modest growth and optimized performance.',
      },
    },
  },
};

export const SecurityConcern: Story = {
  args: {
    data: {
      totalCredentials: 34567,
      activeCredentials: 28456,
      revokedThisMonth: 892,
      avgTimeToVerify: '5.2s',
      totalCredentialsTrend: {
        value: -1.5,
        direction: 'down',
      },
      activeCredentialsTrend: {
        value: -8.7,
        direction: 'down',
      },
      revokedThisMonthTrend: {
        value: 156.3,
        direction: 'up',
      },
      avgTimeToVerifyTrend: {
        value: 42.8,
        direction: 'up',
      },
    },
    showTrends: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Concerning scenario with high revocation rate and degrading performance - may indicate security issues.',
      },
    },
  },
};

// ============================================================================
// Edge Cases
// ============================================================================

export const ZeroValues: Story = {
  args: {
    data: {
      totalCredentials: 0,
      activeCredentials: 0,
      revokedThisMonth: 0,
      avgTimeToVerify: 'N/A',
    },
    showTrends: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case with zero values - new system or after data reset.',
      },
    },
  },
};

export const AllRevoked: Story = {
  args: {
    data: {
      totalCredentials: 1000,
      activeCredentials: 0,
      revokedThisMonth: 1000,
      avgTimeToVerify: '2.1s',
      totalCredentialsTrend: {
        value: 0,
        direction: 'neutral',
      },
      activeCredentialsTrend: {
        value: -100,
        direction: 'down',
      },
      revokedThisMonthTrend: {
        value: 1000,
        direction: 'up',
      },
      avgTimeToVerifyTrend: {
        value: 0,
        direction: 'neutral',
      },
    },
    showTrends: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical edge case where all credentials have been revoked.',
      },
    },
  },
};

export const LongVerificationTime: Story = {
  args: {
    data: {
      totalCredentials: 5432,
      activeCredentials: 4821,
      revokedThisMonth: 23,
      avgTimeToVerify: '45m 32s',
      avgTimeToVerifyTrend: {
        value: 125.5,
        direction: 'up',
      },
    },
    showTrends: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case with very long verification times - may indicate system performance issues.',
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
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
          <p className="text-neutral-600">
            Overview of credential system performance and metrics
          </p>
        </div>
        
        <StatsGrid {...args} />
        
        <div className="card">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Additional Content
          </h2>
          <p className="text-neutral-600">
            Charts, tables, and other dashboard components would appear here.
          </p>
        </div>
      </div>
    </div>
  ),
  args: {
    data: mockDataWithTrends,
    showTrends: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'StatsGrid integrated into a full dashboard layout.',
      },
    },
  },
};

export const ResponsiveLayout: Story = {
  render: (args) => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Credential Analytics
        </h1>
        <p className="text-neutral-600">
          Resize your browser to see the responsive behavior
        </p>
      </div>
      
      <StatsGrid {...args} />
      
      <div className="text-center text-sm text-neutral-500">
        <p>Mobile: 1 column | Tablet: 2 columns | Desktop: 4 columns</p>
      </div>
    </div>
  ),
  args: {
    data: mockDataWithTrends,
    showTrends: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of responsive grid layout across different screen sizes.',
      },
    },
  },
};

// ============================================================================
// Interactive Demo
// ============================================================================

export const InteractiveDemo: Story = {
  render: () => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [showTrends, setShowTrends] = React.useState(true);
    
    const refreshData = () => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Interactive Demo</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowTrends(!showTrends)}
              className="btn-outline"
            >
              {showTrends ? 'Hide' : 'Show'} Trends
            </button>
            <button
              onClick={refreshData}
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>
        
        <StatsGrid
          data={mockDataWithTrends}
          isLoading={isLoading}
          showTrends={showTrends}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demonstration with toggle for trends and refresh simulation.',
      },
    },
  },
};
