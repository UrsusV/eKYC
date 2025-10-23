import type { Meta, StoryObj } from '@storybook/react';
import Layout from './Layout';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof Layout> = {
  title: 'Components/Layout',
  component: Layout,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Layout>;

export const Default: Story = {
  args: {
    pageTitle: 'Dashboard',
    children: (
      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome to e-KYC System</h2>
          <p className="text-muted-foreground mb-4">
            This is the main content area. The layout includes a collapsible sidebar with role
            selection and a responsive top bar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 bg-primary/10 border border-primary">
              <h3 className="font-semibold text-primary mb-2">Total Credentials</h3>
              <p className="text-3xl font-bold">24</p>
            </div>
            <div className="card p-4 bg-success/10 border border-success">
              <h3 className="font-semibold text-success mb-2">Verified</h3>
              <p className="text-3xl font-bold">18</p>
            </div>
            <div className="card p-4 bg-warning/10 border border-warning">
              <h3 className="font-semibold text-warning mb-2">Pending</h3>
              <p className="text-3xl font-bold">6</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Credential Issued</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <span className="badge badge-success">Success</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
};

export const WithCustomTitle: Story = {
  args: {
    pageTitle: 'Credentials Management',
    children: (
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-4">Credentials</h2>
        <p className="text-muted-foreground">View and manage your credentials here.</p>
      </div>
    ),
  },
};

export const VerificationPage: Story = {
  args: {
    pageTitle: 'Verification Center',
    children: (
      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Verify Credentials</h2>
          <form className="space-y-4">
            <div>
              <label className="label">Credential ID</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter credential ID"
              />
            </div>
            <div>
              <label className="label">Verification Code</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter verification code"
              />
            </div>
            <button className="btn-primary px-6 py-2">Verify</button>
          </form>
        </div>
      </div>
    ),
  },
};

export const AdminPanel: Story = {
  args: {
    pageTitle: 'Admin Panel',
    children: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-4">System Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Users</span>
                <span className="font-bold">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Sessions</span>
                <span className="font-bold">89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Credentials</span>
                <span className="font-bold">5,678</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="btn-primary w-full py-2">Add New User</button>
              <button className="btn-secondary w-full py-2">Export Data</button>
              <button className="btn-outline w-full py-2">System Settings</button>
            </div>
          </div>
        </div>
      </div>
    ),
  },
};

export const EmptyState: Story = {
  args: {
    pageTitle: 'Getting Started',
    children: (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">No credentials yet</h2>
          <p className="text-muted-foreground mb-6">
            Get started by creating your first credential or importing existing ones.
          </p>
          <button className="btn-primary px-6 py-2">Create Credential</button>
        </div>
      </div>
    ),
  },
};
