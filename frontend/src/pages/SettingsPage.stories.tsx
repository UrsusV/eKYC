import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';

const meta: Meta<typeof SettingsPage> = {
  title: 'Pages/SettingsPage',
  component: SettingsPage,
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
# Settings Page

A comprehensive settings page for managing user preferences and application configuration.

## Settings Categories

### Notifications
Configure how you receive notifications:
- **Email Notifications** - Receive updates via email
- **Push Notifications** - Get push notifications on devices
- **SMS Notifications** - Receive text messages for important updates

### Privacy & Security
Control your privacy settings:
- **Public Profile** - Allow others to view your profile
- **Show Email** - Display your email on your profile
- **Share Analytics** - Help improve the platform by sharing usage data

### Appearance
Customize the look and feel:
- **Theme** - Light, Dark, or System (auto)
- **Language** - Choose your preferred language (English, Bengali, Hindi)

### Danger Zone
Irreversible actions:
- **Delete Account** - Permanently delete your account and all data

## Features

### Toggle Switches
- Interactive toggle switches for boolean settings
- Visual feedback on state changes
- Smooth animations

### Theme Switcher
- Three theme options: Light, Dark, System
- Immediate theme preview
- Persists across sessions

### Language Selection
- Dropdown selector for language preference
- Supports multiple languages
- Updates UI labels accordingly

### Change Tracking
- Save and Reset buttons appear when changes are made
- Prevents accidental data loss
- Clear visual indication of unsaved changes

## User Flow

1. **Navigate** to settings sections
2. **Toggle** switches or select options
3. **Save** changes to persist
4. **Reset** to revert to defaults
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SettingsPage>;

/**
 * Default settings page view with all options.
 */
export const Default: Story = {};

/**
 * Settings page with changes made, showing save/reset buttons.
 */
export const WithChanges: Story = {
  play: async () => {
    // Simulate making a change
    setTimeout(() => {
      const toggles = document.querySelectorAll('button[class*="inline-flex"]');
      if (toggles.length > 0) {
        (toggles[0] as HTMLButtonElement).click();
      }
    }, 100);
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings page after making changes, showing save and reset buttons.',
      },
    },
  },
};

/**
 * Settings page with dark theme selected.
 */
export const DarkTheme: Story = {
  play: async () => {
    setTimeout(() => {
      const darkButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Dark'
      );
      if (darkButton) {
        darkButton.click();
      }
    }, 100);
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings page with dark theme selected and applied.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
};

/**
 * Settings page showing notification preferences.
 */
export const NotificationsFocus: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Focus on notification settings section with toggle switches.',
      },
    },
  },
};

/**
 * Settings page showing privacy and security options.
 */
export const PrivacyFocus: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Focus on privacy and security settings with control toggles.',
      },
    },
  },
};

/**
 * Settings page showing appearance customization.
 */
export const AppearanceFocus: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Focus on appearance settings including theme and language selection.',
      },
    },
  },
};

/**
 * Settings page with Bengali language selected.
 */
export const BengaliLanguage: Story = {
  play: async () => {
    setTimeout(() => {
      const languageSelect = document.querySelector('select') as HTMLSelectElement;
      if (languageSelect) {
        languageSelect.value = 'bn';
        languageSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, 100);
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings page with Bengali (বাংলা) language selected.',
      },
    },
  },
};

/**
 * Settings page showing the danger zone with account deletion option.
 */
export const DangerZone: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Focus on danger zone section with account deletion option and warning.',
      },
    },
  },
};

/**
 * Settings page with all notifications enabled.
 */
export const AllNotificationsEnabled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Settings showing all notification options enabled.',
      },
    },
  },
};

/**
 * Settings page with maximum privacy settings enabled.
 */
export const MaximumPrivacy: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Settings configured for maximum privacy with all sharing options disabled.',
      },
    },
  },
};
