import { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import ConsentModal from './ConsentModal';

const meta: Meta<typeof ConsentModal> = {
  title: 'Components/ConsentModal',
  component: ConsentModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'ConsentModal allows users to select credential fields to share with consent duration management. Features optimistic UI, toast notifications, and accessible form validation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls modal visibility',
    },
    availableFields: {
      control: 'object',
      description: 'Array of field names available for sharing',
    },
    onClose: {
      action: 'closed',
      description: 'Called when user cancels or closes the modal',
    },
    onConfirm: {
      action: 'confirmed',
      description: 'Async function called with selected fields and duration',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConsentModal>;

// Interactive wrapper to demonstrate modal behavior
const InteractiveWrapper = (args: any) => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    args.onClose?.();
    // Reopen after a delay for demo purposes
    setTimeout(() => setOpen(true), 500);
  };

  const handleConfirm = async (fields: string[], duration: number) => {
    await args.onConfirm?.(fields, duration);
  };

  return (
    <div>
      <ConsentModal
        {...args}
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

/**
 * Default state with a typical set of credential fields.
 */
export const Default: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    open: true,
    availableFields: [
      'full_name',
      'email',
      'phone_number',
      'date_of_birth',
      'address',
    ],
    onConfirm: async (fields, duration) => {
      console.log('Confirming with fields:', fields, 'duration:', duration);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
    },
  },
};

/**
 * Modal with many fields to demonstrate scrolling and layout.
 */
export const ManyFields: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    open: true,
    availableFields: [
      'full_name',
      'email',
      'phone_number',
      'date_of_birth',
      'address',
      'city',
      'state',
      'postal_code',
      'country',
      'social_security_number',
      'passport_number',
      'drivers_license',
      'nationality',
      'employment_status',
      'company_name',
      'job_title',
    ],
    onConfirm: async (fields, duration) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    },
  },
};

/**
 * Modal with minimal fields (e.g., basic identity verification).
 */
export const MinimalFields: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    open: true,
    availableFields: ['full_name', 'email'],
    onConfirm: async (fields, duration) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    },
  },
};

/**
 * Modal with a single field.
 */
export const SingleField: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    open: true,
    availableFields: ['email'],
    onConfirm: async (fields, duration) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    },
  },
};

/**
 * Modal with no available fields (edge case).
 */
export const NoFields: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    open: true,
    availableFields: [],
    onConfirm: async (fields, duration) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    },
  },
};

/**
 * Demonstrates successful confirmation flow with optimistic UI.
 */
export const SuccessScenario: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    open: true,
    availableFields: ['full_name', 'email', 'phone_number'],
    onConfirm: async (fields, duration) => {
      console.log('✅ Success! Fields:', fields, 'Duration:', duration);
      // Quick success
      await new Promise((resolve) => setTimeout(resolve, 800));
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the optimistic UI flow: Loading toast → Success toast with consent ID → Auto-close.',
      },
    },
  },
};

/**
 * Demonstrates error handling during confirmation.
 */
export const ErrorScenario: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    open: true,
    availableFields: ['full_name', 'email', 'phone_number'],
    onConfirm: async (fields, duration) => {
      console.log('❌ Simulating error...');
      // Simulate API failure
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network connection failed')), 1000)
      );
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows error toast with shake animation when confirmation fails. Modal remains open for user to retry.',
      },
    },
  },
};

/**
 * Demonstrates slow network scenario with extended loading state.
 */
export const SlowNetwork: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    open: true,
    availableFields: ['full_name', 'email', 'phone_number'],
    onConfirm: async (fields, duration) => {
      console.log('🐌 Slow network...');
      // Simulate slow API
      await new Promise((resolve) => setTimeout(resolve, 5000));
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates loading state for slow networks. Loading toast persists until completion.',
      },
    },
  },
};

/**
 * Modal with short consent duration (1 hour).
 */
export const ShortDuration: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);

    const handleClose = () => {
      setOpen(false);
      setTimeout(() => setOpen(true), 500);
    };

    return (
      <div>
        <ConsentModal
          {...args}
          open={open}
          onClose={handleClose}
        />
      </div>
    );
  },
  args: {
    open: true,
    availableFields: ['full_name', 'email'],
    onConfirm: async (fields, duration) => {
      console.log('Duration:', duration, 'hours');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Set duration input to 1 hour to see short-term consent preview.',
      },
    },
  },
};

/**
 * Modal with long consent duration (1 year = 8760 hours).
 */
export const LongDuration: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);

    const handleClose = () => {
      setOpen(false);
      setTimeout(() => setOpen(true), 500);
    };

    return (
      <div>
        <ConsentModal
          {...args}
          open={open}
          onClose={handleClose}
        />
      </div>
    );
  },
  args: {
    open: true,
    availableFields: ['full_name', 'email'],
    onConfirm: async (fields, duration) => {
      console.log('Duration:', duration, 'hours');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Set duration input to 8760 hours (1 year) to see long-term consent preview.',
      },
    },
  },
};

/**
 * Demonstrates field name formatting (snake_case → Title Case).
 */
export const ComplexFieldNames: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    open: true,
    availableFields: [
      'first_name',
      'last_name',
      'email_address',
      'phone_number_mobile',
      'date_of_birth',
      'social_security_number',
      'drivers_license_number',
      'passport_number',
    ],
    onConfirm: async (fields, duration) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how complex snake_case field names are formatted into readable Title Case labels.',
      },
    },
  },
};

/**
 * Playground for testing all modal features interactively.
 */
export const Playground: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [lastConfirmed, setLastConfirmed] = useState<{
      fields: string[];
      duration: number;
    } | null>(null);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
      setOpen(false);
      args.onClose?.();
    };

    const handleConfirm = async (fields: string[], duration: number) => {
      await args.onConfirm?.(fields, duration);
      setLastConfirmed({ fields, duration });
    };

    return (
      <div className="p-8">
        <div className="mb-8">
          <button
            onClick={handleOpen}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Open Consent Modal
          </button>
        </div>

        {lastConfirmed && (
          <div className="p-4 bg-neutral-100 rounded-md">
            <h3 className="font-semibold mb-2">Last Confirmed:</h3>
            <p className="text-sm">
              <strong>Fields:</strong> {lastConfirmed.fields.join(', ')}
            </p>
            <p className="text-sm">
              <strong>Duration:</strong> {lastConfirmed.duration} hours
            </p>
          </div>
        )}

        <ConsentModal
          {...args}
          open={open}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      </div>
    );
  },
  args: {
    availableFields: [
      'full_name',
      'email',
      'phone_number',
      'date_of_birth',
      'address',
    ],
    onConfirm: async (fields, duration) => {
      console.log('Confirmed:', { fields, duration });
      await new Promise((resolve) => setTimeout(resolve, 1500));
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground with button to open modal and display last confirmed values.',
      },
    },
  },
};

/**
 * Demonstrates keyboard navigation and accessibility features.
 */
export const AccessibilityDemo: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    open: true,
    availableFields: ['full_name', 'email', 'phone_number'],
    onConfirm: async (fields, duration) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Test accessibility: Use Tab to navigate, Space to toggle checkboxes, ESC to close. Screen reader announcements for errors and toasts.',
      },
    },
  },
};

/**
 * Demonstrates backdrop click behavior.
 */
export const BackdropClickDemo: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    open: true,
    availableFields: ['full_name', 'email'],
    onConfirm: async (fields, duration) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Click outside the modal (on the dark backdrop) to close it. Backdrop clicks are disabled during confirmation to prevent accidental dismissal.',
      },
    },
  },
};
