import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';

const meta: Meta<typeof ProfilePage> = {
  title: 'Pages/ProfilePage',
  component: ProfilePage,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Profile Page

A comprehensive user profile page for managing personal information and account settings.

## Features

### Profile Information
- Full name
- Email address
- Phone number
- National ID (NID) - non-editable
- Organization
- Role
- Member since date

### Profile Avatar
- Initial-based avatar display
- Upload photo button (in edit mode)
- Customizable background colors

### Edit Mode
- Toggle between view and edit modes
- Input fields for editable information
- Save and cancel actions
- Form validation

### Security Section
- Change password button
- Enable two-factor authentication
- Account security settings

### Recent Activity
- Timeline of recent profile changes
- Login history
- Activity timestamps

## User Flow

1. **View Mode** - Display all profile information
2. **Edit Mode** - Click "Edit Profile" to enable editing
3. **Make Changes** - Update profile fields
4. **Save** - Click "Save Changes" to persist updates
5. **Cancel** - Click "Cancel" to discard changes

## Permissions
- NID field is read-only for security
- Some fields may require admin approval for changes
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProfilePage>;

/**
 * Default profile page view with user information.
 */
export const Default: Story = {};

/**
 * Profile page in edit mode with editable fields.
 */
export const EditMode: Story = {
  play: async () => {
    // Simulate clicking edit button
    setTimeout(() => {
      const editButton = document.querySelector(
        'button[class*="btn"]'
      ) as HTMLButtonElement;
      if (editButton && editButton.textContent?.includes('Edit')) {
        editButton.click();
      }
    }, 100);
  },
  parameters: {
    docs: {
      description: {
        story: 'Profile page in edit mode with input fields enabled for updating information.',
      },
    },
  },
};

/**
 * Profile page showing the security section.
 */
export const SecurityFocus: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Focus on the security section with password and 2FA options.',
      },
    },
  },
};

/**
 * Profile page for an admin user with additional privileges.
 */
export const AdminProfile: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Profile page for a user with admin role and additional permissions.',
      },
    },
  },
};

/**
 * Profile page for an issuer organization.
 */
export const IssuerProfile: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Profile page for a credential issuer with organization details.',
      },
    },
  },
};

/**
 * Profile page showing extensive recent activity.
 */
export const ExtensiveActivity: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Profile page with a detailed history of recent account activities.',
      },
    },
  },
};
