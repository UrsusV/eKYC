import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider, useToast } from './Toast';

// Demo component for showcasing toast functionality
const ToastDemo = () => {
  const toast = useToast();

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Toast Notifications Demo</h2>
      <p className="text-gray-600 mb-6">
        Click the buttons below to see different types of toast notifications.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => toast.success('Operation completed successfully!')}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Show Success Toast
        </button>

        <button
          onClick={() => toast.error('An error occurred. Please try again.')}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Show Error Toast
        </button>

        <button
          onClick={() => toast.warning('Please review your input before proceeding.')}
          className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Show Warning Toast
        </button>

        <button
          onClick={() => toast.info('Did you know? You can dismiss toasts manually.')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Show Info Toast
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Auto-dismiss after 5 seconds</li>
          <li>Manual close button</li>
          <li>Slide-in animation</li>
          <li>Multiple toasts can be shown simultaneously</li>
          <li>Fixed position at top-right</li>
          <li>Icons and colors for each type</li>
        </ul>
      </div>

      <div className="mt-4">
        <button
          onClick={() => {
            toast.success('First notification');
            setTimeout(() => toast.error('Second notification'), 500);
            setTimeout(() => toast.warning('Third notification'), 1000);
            setTimeout(() => toast.info('Fourth notification'), 1500);
          }}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Show Multiple Toasts
        </button>
      </div>
    </div>
  );
};

const meta: Meta<typeof ToastProvider> = {
  title: 'Components/Toast',
  component: ToastProvider,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Toast Notification System

A global toast notification system built with React Context for displaying temporary messages to users.

## Features

### Toast Types
- **Success** - Green color, checkmark icon
- **Error** - Red color, X icon
- **Warning** - Yellow color, exclamation icon
- **Info** - Blue color, info icon

### Behavior
- Auto-dismiss after 5 seconds (configurable)
- Manual close button
- Slide-in animation from right
- Multiple toasts can be displayed simultaneously
- Fixed position at top-right corner
- Responsive design

## Usage

\`\`\`tsx
import { ToastProvider, useToast } from '@/components/Toast';

function MyComponent() {
  const toast = useToast();

  return (
    <button onClick={() => toast.success('Success!')}>
      Show Toast
    </button>
  );
}

// Wrap your app with ToastProvider
<ToastProvider>
  <App />
</ToastProvider>
\`\`\`

## API

### useToast Hook
Returns an object with toast methods:

- \`toast.success(message, duration?)\` - Show success toast
- \`toast.error(message, duration?)\` - Show error toast
- \`toast.warning(message, duration?)\` - Show warning toast
- \`toast.info(message, duration?)\` - Show info toast

### Parameters
- \`message\`: string - The message to display
- \`duration\`: number (optional) - Duration in ms before auto-dismiss (default: 5000)
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

/**
 * Interactive demo showing all toast types and features.
 */
export const InteractiveDemo: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

/**
 * Success toast with green styling and checkmark icon.
 */
export const SuccessToast: Story = {
  render: () => {
    const Demo = () => {
      const toast = useToast();
      return (
        <div className="p-8">
          <button
            onClick={() => toast.success('Credential verified successfully!')}
            className="btn-primary"
          >
            Show Success
          </button>
        </div>
      );
    };
    return (
      <ToastProvider>
        <Demo />
      </ToastProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Success toast notification with green color scheme.',
      },
    },
  },
};

/**
 * Error toast with red styling and X icon.
 */
export const ErrorToast: Story = {
  render: () => {
    const Demo = () => {
      const toast = useToast();
      return (
        <div className="p-8">
          <button
            onClick={() => toast.error('Failed to verify credential. Please try again.')}
            className="btn-primary"
          >
            Show Error
          </button>
        </div>
      );
    };
    return (
      <ToastProvider>
        <Demo />
      </ToastProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Error toast notification with red color scheme.',
      },
    },
  },
};

/**
 * Warning toast with yellow styling and exclamation icon.
 */
export const WarningToast: Story = {
  render: () => {
    const Demo = () => {
      const toast = useToast();
      return (
        <div className="p-8">
          <button
            onClick={() => toast.warning('This credential will expire in 7 days.')}
            className="btn-primary"
          >
            Show Warning
          </button>
        </div>
      );
    };
    return (
      <ToastProvider>
        <Demo />
      </ToastProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning toast notification with yellow color scheme.',
      },
    },
  },
};

/**
 * Info toast with blue styling and info icon.
 */
export const InfoToast: Story = {
  render: () => {
    const Demo = () => {
      const toast = useToast();
      return (
        <div className="p-8">
          <button
            onClick={() => toast.info('You can share credentials using the share button.')}
            className="btn-primary"
          >
            Show Info
          </button>
        </div>
      );
    };
    return (
      <ToastProvider>
        <Demo />
      </ToastProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Info toast notification with blue color scheme.',
      },
    },
  },
};

/**
 * Demonstrates multiple toasts appearing simultaneously.
 */
export const MultipleToasts: Story = {
  render: () => {
    const Demo = () => {
      const toast = useToast();
      const showMultiple = () => {
        toast.success('Operation 1 completed');
        setTimeout(() => toast.info('Processing operation 2...'), 300);
        setTimeout(() => toast.warning('Operation 3 needs attention'), 600);
        setTimeout(() => toast.error('Operation 4 failed'), 900);
      };
      return (
        <div className="p-8">
          <button onClick={showMultiple} className="btn-primary">
            Show Multiple Toasts
          </button>
        </div>
      );
    };
    return (
      <ToastProvider>
        <Demo />
      </ToastProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple toasts can be displayed simultaneously, stacked vertically.',
      },
    },
  },
};

/**
 * Toast with custom duration (10 seconds instead of default 5).
 */
export const CustomDuration: Story = {
  render: () => {
    const Demo = () => {
      const toast = useToast();
      return (
        <div className="p-8">
          <button
            onClick={() => toast.info('This toast will stay for 10 seconds', 10000)}
            className="btn-primary"
          >
            Show Long Duration Toast
          </button>
        </div>
      );
    };
    return (
      <ToastProvider>
        <Demo />
      </ToastProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Toast with custom duration of 10 seconds instead of the default 5.',
      },
    },
  },
};
