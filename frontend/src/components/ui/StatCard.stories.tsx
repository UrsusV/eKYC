import type { Meta, StoryObj } from '@storybook/react';
import StatCard from './StatCard';

const meta = {
  title: 'Components/UI/StatCard',
  component: StatCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A reusable statistics card component for displaying key metrics with optional icons, trends, and color themes. Perfect for dashboards and analytics views.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title/label for the statistic',
    },
    value: {
      control: 'text',
      description: 'The main value to display (number or string)',
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle text below the value',
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger', 'neutral'],
      description: 'Color theme for the card',
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
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Icons for use in stories
const DocumentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const CheckShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const ClockIcon = () => (
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
// Basic Stories
// ============================================================================

export const Default: Story = {
  args: {
    title: 'Total Users',
    value: 1234,
    subtitle: 'All time',
    icon: <UsersIcon />,
    color: 'primary',
  },
};

export const WithStringValue: Story = {
  args: {
    title: 'Average Response Time',
    value: '2.5s',
    subtitle: 'Last 30 days',
    icon: <ClockIcon />,
    color: 'warning',
  },
};

export const WithLargeNumber: Story = {
  args: {
    title: 'Total Revenue',
    value: 1234567,
    subtitle: 'This year',
    color: 'success',
  },
};

export const WithoutIcon: Story = {
  args: {
    title: 'Pending Reviews',
    value: 42,
    subtitle: 'Awaiting approval',
    color: 'warning',
  },
};

export const WithoutSubtitle: Story = {
  args: {
    title: 'Active Sessions',
    value: 156,
    icon: <CheckShieldIcon />,
    color: 'success',
  },
};

// ============================================================================
// Color Variations
// ============================================================================

export const PrimaryColor: Story = {
  args: {
    title: 'Total Credentials',
    value: 5432,
    subtitle: 'All time',
    icon: <DocumentIcon />,
    color: 'primary',
  },
};

export const SuccessColor: Story = {
  args: {
    title: 'Active Credentials',
    value: 4821,
    subtitle: 'Currently valid',
    icon: <CheckShieldIcon />,
    color: 'success',
  },
};

export const WarningColor: Story = {
  args: {
    title: 'Expiring Soon',
    value: 23,
    subtitle: 'Next 30 days',
    icon: <ClockIcon />,
    color: 'warning',
  },
};

export const DangerColor: Story = {
  args: {
    title: 'Revoked',
    value: 89,
    subtitle: 'This month',
    color: 'danger',
  },
};

export const NeutralColor: Story = {
  args: {
    title: 'Drafts',
    value: 12,
    subtitle: 'Incomplete',
    color: 'neutral',
  },
};

// ============================================================================
// Trend Stories
// ============================================================================

export const WithUpTrend: Story = {
  args: {
    title: 'New Sign-ups',
    value: 324,
    icon: <UsersIcon />,
    color: 'primary',
    trend: {
      value: 12.5,
      direction: 'up',
      label: 'from last month',
    },
  },
};

export const WithDownTrend: Story = {
  args: {
    title: 'Error Rate',
    value: '0.8%',
    color: 'danger',
    trend: {
      value: -5.2,
      direction: 'down',
      label: 'from last week',
    },
  },
};

export const WithNeutralTrend: Story = {
  args: {
    title: 'Average Load Time',
    value: '1.2s',
    icon: <ClockIcon />,
    color: 'warning',
    trend: {
      value: 0,
      direction: 'neutral',
      label: 'no change',
    },
  },
};

export const WithLargeTrend: Story = {
  args: {
    title: 'Conversion Rate',
    value: '24.8%',
    color: 'success',
    trend: {
      value: 45.3,
      direction: 'up',
      label: 'from last quarter',
    },
  },
};

// ============================================================================
// Loading State
// ============================================================================

export const Loading: Story = {
  args: {
    title: 'Loading...',
    value: 0,
    color: 'primary',
    isLoading: true,
  },
};

export const LoadingSuccess: Story = {
  args: {
    title: 'Loading...',
    value: 0,
    color: 'success',
    isLoading: true,
  },
};

export const LoadingWarning: Story = {
  args: {
    title: 'Loading...',
    value: 0,
    color: 'warning',
    isLoading: true,
  },
};

export const LoadingDanger: Story = {
  args: {
    title: 'Loading...',
    value: 0,
    color: 'danger',
    isLoading: true,
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

export const TotalCredentials: Story = {
  args: {
    title: 'Total Credentials',
    value: 12458,
    icon: <DocumentIcon />,
    color: 'primary',
    trend: {
      value: 8.3,
      direction: 'up',
      label: 'from last month',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world example: Total credentials issued in the system.',
      },
    },
  },
};

export const ActiveCredentials: Story = {
  args: {
    title: 'Active Credentials',
    value: 11234,
    icon: <CheckShieldIcon />,
    color: 'success',
    trend: {
      value: 5.7,
      direction: 'up',
      label: 'from last month',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world example: Currently active and valid credentials.',
      },
    },
  },
};

export const RevokedThisMonth: Story = {
  args: {
    title: 'Revoked This Month',
    value: 47,
    color: 'danger',
    trend: {
      value: -12.8,
      direction: 'down',
      label: 'from last month',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world example: Credentials revoked in the current month.',
      },
    },
  },
};

export const AvgTimeToVerify: Story = {
  args: {
    title: 'Avg. Time to Verify',
    value: '2.3s',
    icon: <ClockIcon />,
    color: 'warning',
    trend: {
      value: -8.5,
      direction: 'down',
      label: 'from last month',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world example: Average credential verification time.',
      },
    },
  },
};

// ============================================================================
// Layout Examples
// ============================================================================

export const MultipleCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Credentials"
        value={12458}
        icon={<DocumentIcon />}
        color="primary"
        trend={{
          value: 8.3,
          direction: 'up',
          label: 'from last month',
        }}
      />
      <StatCard
        title="Active Credentials"
        value={11234}
        icon={<CheckShieldIcon />}
        color="success"
        trend={{
          value: 5.7,
          direction: 'up',
          label: 'from last month',
        }}
      />
      <StatCard
        title="Revoked This Month"
        value={47}
        color="danger"
        trend={{
          value: -12.8,
          direction: 'down',
          label: 'from last month',
        }}
      />
      <StatCard
        title="Avg. Time to Verify"
        value="2.3s"
        icon={<ClockIcon />}
        color="warning"
        trend={{
          value: -8.5,
          direction: 'down',
          label: 'from last month',
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of multiple StatCards in a grid layout.',
      },
    },
  },
};

export const ResponsiveGrid: Story = {
  render: () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={8432}
          icon={<UsersIcon />}
          color="primary"
          subtitle="All time"
        />
        <StatCard
          title="Active Users"
          value={6821}
          icon={<CheckShieldIcon />}
          color="success"
          subtitle="Last 30 days"
        />
        <StatCard
          title="New Today"
          value={156}
          color="primary"
          trend={{
            value: 12.5,
            direction: 'up',
            label: 'from yesterday',
          }}
        />
        <StatCard
          title="Avg. Session"
          value="8m 42s"
          icon={<ClockIcon />}
          color="warning"
          subtitle="Last 7 days"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive grid layout example with page heading.',
      },
    },
  },
};
