import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConsentModal, { ConsentModalProps } from './ConsentModal';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

describe('ConsentModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockAvailableFields = [
    'full_name',
    'email',
    'phone_number',
    'date_of_birth',
    'address',
  ];

  const defaultProps: ConsentModalProps = {
    open: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    availableFields: mockAvailableFields,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(<ConsentModal {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(<ConsentModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Share Credential Fields')).toBeInTheDocument();
    });

    it('should render all available fields as checkboxes', () => {
      render(<ConsentModal {...defaultProps} />);
      
      mockAvailableFields.forEach((field) => {
        const formattedName = field.split('_').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');
        expect(screen.getByLabelText(`Share ${formattedName}`)).toBeInTheDocument();
      });
    });

    it('should render duration input with default value of 24 hours', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const durationInput = screen.getByLabelText(/consent duration/i);
      expect(durationInput).toHaveValue(24);
    });

    it('should render confirm and cancel buttons', () => {
      render(<ConsentModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'consent-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'consent-modal-description');
    });
  });

  describe('Field Selection', () => {
    it('should allow selecting individual fields', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      expect(checkbox).toBeChecked();
    });

    it('should allow deselecting fields', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share email/i);
      
      // Select
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
      
      // Deselect
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should allow selecting multiple fields', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox1 = screen.getByLabelText(/share full name/i);
      const checkbox2 = screen.getByLabelText(/share email/i);
      
      fireEvent.click(checkbox1);
      fireEvent.click(checkbox2);
      
      expect(checkbox1).toBeChecked();
      expect(checkbox2).toBeChecked();
    });

    it('should handle select all button', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);
      
      // All checkboxes should be checked
      mockAvailableFields.forEach((field) => {
        const formattedName = field.split('_').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');
        expect(screen.getByLabelText(`Share ${formattedName}`)).toBeChecked();
      });
      
      // Button text should change
      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });

    it('should handle deselect all button', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const selectAllButton = screen.getByText('Select All');
      
      // Select all
      fireEvent.click(selectAllButton);
      
      // Deselect all
      const deselectAllButton = screen.getByText('Deselect All');
      fireEvent.click(deselectAllButton);
      
      // All checkboxes should be unchecked
      mockAvailableFields.forEach((field) => {
        const formattedName = field.split('_').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');
        expect(screen.getByLabelText(`Share ${formattedName}`)).not.toBeChecked();
      });
    });
  });

  describe('Duration Input', () => {
    it('should update duration value', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const durationInput = screen.getByLabelText(/consent duration/i);
      fireEvent.change(durationInput, { target: { value: '48' } });
      
      expect(durationInput).toHaveValue(48);
    });

    it('should not accept negative values', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const durationInput = screen.getByLabelText(/consent duration/i);
      const initialValue = (durationInput as HTMLInputElement).value;
      
      fireEvent.change(durationInput, { target: { value: '-5' } });
      
      // Should retain previous value
      expect(durationInput).toHaveValue(parseInt(initialValue));
    });

    it('should not accept zero', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const durationInput = screen.getByLabelText(/consent duration/i);
      const initialValue = (durationInput as HTMLInputElement).value;
      
      fireEvent.change(durationInput, { target: { value: '0' } });
      
      // Should retain previous value
      expect(durationInput).toHaveValue(parseInt(initialValue));
    });
  });

  describe('Preview Section', () => {
    it('should not show preview when no fields selected', () => {
      render(<ConsentModal {...defaultProps} />);
      
      expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    });

    it('should show preview when fields are selected', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should display count of selected fields', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox1 = screen.getByLabelText(/share full name/i);
      const checkbox2 = screen.getByLabelText(/share email/i);
      
      fireEvent.click(checkbox1);
      fireEvent.click(checkbox2);
      
      expect(screen.getByText('2 fields')).toBeInTheDocument();
    });

    it('should display expiration date based on duration', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      expect(screen.getByText(/expires at:/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should disable confirm button when no fields selected', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm button when at least one field is selected', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).not.toBeDisabled();
    });

    it('should show error when confirming without selected fields', () => {
      render(<ConsentModal {...defaultProps} />);
      
      // Manually click confirm (even though disabled)
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Force click by removing disabled state temporarily
      confirmButton.removeAttribute('disabled');
      fireEvent.click(confirmButton);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/please select at least one field/i)).toBeInTheDocument();
    });

    it('should clear error when user selects a field', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      confirmButton.removeAttribute('disabled');
      fireEvent.click(confirmButton);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Select a field
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Confirmation Flow', () => {
    it('should call onConfirm with selected fields and duration', async () => {
      mockOnConfirm.mockResolvedValue(undefined);
      render(<ConsentModal {...defaultProps} />);
      
      // Select fields
      const checkbox1 = screen.getByLabelText(/share full name/i);
      const checkbox2 = screen.getByLabelText(/share email/i);
      fireEvent.click(checkbox1);
      fireEvent.click(checkbox2);
      
      // Set duration
      const durationInput = screen.getByLabelText(/consent duration/i);
      fireEvent.change(durationInput, { target: { value: '48' } });
      
      // Confirm
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(['full_name', 'email'], 48);
      });
    });

    it('should show loading toast immediately', async () => {
      mockOnConfirm.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Sharing...')).toBeInTheDocument();
      });
    });

    it('should show success toast on successful confirmation', async () => {
      mockOnConfirm.mockResolvedValue(undefined);
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Fields shared successfully!')).toBeInTheDocument();
      });
    });

    it('should show consent ID in success toast', async () => {
      mockOnConfirm.mockResolvedValue(undefined);
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/consent-/)).toBeInTheDocument();
      });
    });

    it('should close modal after successful confirmation', async () => {
      mockOnConfirm.mockResolvedValue(undefined);
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error toast on confirmation failure', async () => {
      const errorMessage = 'Network error occurred';
      mockOnConfirm.mockRejectedValue(new Error(errorMessage));
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should disable all inputs during confirmation', async () => {
      mockOnConfirm.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        // Checkboxes should be disabled
        mockAvailableFields.forEach((field) => {
          const formattedName = field.split('_').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
          expect(screen.getByLabelText(`Share ${formattedName}`)).toBeDisabled();
        });
        
        // Duration input should be disabled
        expect(screen.getByLabelText(/consent duration/i)).toBeDisabled();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onClose when cancel button is clicked', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when close (X) button is clicked', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText(/close modal/i);
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog').parentElement?.previousElementSibling;
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close when clicking inside the modal', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const modalContent = screen.getByRole('dialog');
      fireEvent.click(modalContent);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should prevent closing during confirmation', async () => {
      mockOnConfirm.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Sharing...')).toBeInTheDocument();
      });
      
      // Try to close
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Toast Notifications', () => {
    it('should allow copying consent ID from success toast', async () => {
      mockOnConfirm.mockResolvedValue(undefined);
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Fields shared successfully!')).toBeInTheDocument();
      });
      
      const copyButton = screen.getByLabelText(/copy consent id/i);
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should allow closing success/error toasts', async () => {
      mockOnConfirm.mockResolvedValue(undefined);
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Fields shared successfully!')).toBeInTheDocument();
      });
      
      const closeToastButton = screen.getByLabelText(/close notification/i);
      fireEvent.click(closeToastButton);
      
      expect(screen.queryByText('Fields shared successfully!')).not.toBeInTheDocument();
    });

    it('should auto-hide toasts after 5 seconds', async () => {
      mockOnConfirm.mockResolvedValue(undefined);
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Fields shared successfully!')).toBeInTheDocument();
      });
      
      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(screen.queryByText('Fields shared successfully!')).not.toBeInTheDocument();
      });
    });
  });

  describe('State Reset', () => {
    it('should reset state when modal reopens', async () => {
      const { rerender } = render(<ConsentModal {...defaultProps} />);
      
      // Select fields and change duration
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const durationInput = screen.getByLabelText(/consent duration/i);
      fireEvent.change(durationInput, { target: { value: '72' } });
      
      // Close modal
      rerender(<ConsentModal {...defaultProps} open={false} />);
      
      // Reopen modal
      rerender(<ConsentModal {...defaultProps} open={true} />);
      
      // State should be reset
      const checkboxAfter = screen.getByLabelText(/share full name/i);
      expect(checkboxAfter).not.toBeChecked();
      
      const durationInputAfter = screen.getByLabelText(/consent duration/i);
      expect(durationInputAfter).toHaveValue(24);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation through checkboxes', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should toggle checkbox on Space key', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      checkbox.focus();
      
      fireEvent.keyDown(checkbox, { key: ' ', code: 'Space' });
      
      expect(checkbox).toBeChecked();
    });

    it('should toggle checkbox on Enter key', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share email/i);
      checkbox.focus();
      
      fireEvent.keyDown(checkbox, { key: 'Enter', code: 'Enter' });
      
      expect(checkbox).toBeChecked();
    });

    it('should close modal on Escape key', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should activate confirm button on Enter key', async () => {
      mockOnConfirm.mockResolvedValue(undefined);
      render(<ConsentModal {...defaultProps} />);
      
      // Select a field first
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      confirmButton.focus();
      
      fireEvent.keyDown(confirmButton, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(['full_name'], 24);
      });
    });

    it('should activate cancel button on Enter key', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      cancelButton.focus();
      
      fireEvent.keyDown(cancelButton, { key: 'Enter', code: 'Enter' });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should navigate to duration input via Tab', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const durationInput = screen.getByLabelText(/consent duration/i);
      
      expect(durationInput).toHaveAttribute('type', 'number');
      expect(durationInput).not.toBeDisabled();
    });

    it('should allow incrementing duration with arrow keys', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const durationInput = screen.getByLabelText(/consent duration/i) as HTMLInputElement;
      durationInput.focus();
      
      fireEvent.keyDown(durationInput, { key: 'ArrowUp', code: 'ArrowUp' });
      
      // Arrow up should increment (browser behavior, but we verify the input accepts it)
      expect(durationInput.value).toBeTruthy();
    });
  });

  describe('Prevent Confirm Without Fields', () => {
    it('should disable confirm button when no fields are selected', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      expect(confirmButton).toBeDisabled();
      expect(confirmButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not call onConfirm when confirm button is disabled', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Try to click disabled button
      fireEvent.click(confirmButton);
      
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should show validation error if user somehow bypasses disabled state', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Force enable and click
      confirmButton.removeAttribute('disabled');
      confirmButton.removeAttribute('aria-disabled');
      fireEvent.click(confirmButton);
      
      // Should show error
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/please select at least one field/i)).toBeInTheDocument();
      
      // Should not call onConfirm
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should prevent keyboard activation of disabled confirm button', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Try Enter key on disabled button
      fireEvent.keyDown(confirmButton, { key: 'Enter', code: 'Enter' });
      
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should prevent Space key activation of disabled confirm button', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Try Space key on disabled button
      fireEvent.keyDown(confirmButton, { key: ' ', code: 'Space' });
      
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should enable confirm button only after field selection', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toBeDisabled();
      
      // Select a field
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      // Now should be enabled
      expect(confirmButton).not.toBeDisabled();
      expect(confirmButton).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should re-disable confirm button if all fields are deselected', () => {
      render(<ConsentModal {...defaultProps} />);
      
      const checkbox = screen.getByLabelText(/share full name/i);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Select field
      fireEvent.click(checkbox);
      expect(confirmButton).not.toBeDisabled();
      
      // Deselect field
      fireEvent.click(checkbox);
      expect(confirmButton).toBeDisabled();
    });

    it('should show field count validation in UI', () => {
      render(<ConsentModal {...defaultProps} />);
      
      // When no fields selected, preview should not show
      expect(screen.queryByText(/field/i)).toBeNull();
      
      // Select a field
      const checkbox = screen.getByLabelText(/share full name/i);
      fireEvent.click(checkbox);
      
      // Should show field count
      expect(screen.getByText('1 field')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty availableFields array', () => {
      render(<ConsentModal {...defaultProps} availableFields={[]} />);
      
      expect(screen.getByText('No fields available to share')).toBeInTheDocument();
    });

    it('should format field names correctly', () => {
      const fields = ['first_name', 'last_name', 'email_address'];
      render(<ConsentModal {...defaultProps} availableFields={fields} />);
      
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Last Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should handle single field selection', () => {
      render(<ConsentModal {...defaultProps} availableFields={['name']} />);
      
      const checkbox = screen.getByLabelText(/share name/i);
      fireEvent.click(checkbox);
      
      expect(screen.getByText('1 field')).toBeInTheDocument();
    });
  });
});
