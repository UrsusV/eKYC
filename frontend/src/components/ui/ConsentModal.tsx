import { useState, useEffect } from 'react';

/**
 * ConsentModal component props
 */
export interface ConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (fields: string[], durationHours: number) => Promise<void>;
  availableFields: string[];
}

/**
 * Toast notification state
 */
interface ToastState {
  visible: boolean;
  message: string;
  type: 'loading' | 'success' | 'error';
  consentId?: string;
}

/**
 * Format field name for display (e.g., "full_name" -> "Full Name")
 */
const formatFieldName = (field: string): string => {
  return field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * ConsentModal component
 * 
 * A modal dialog for selecting credential fields to share with consent management.
 * Includes field selection, expiration duration, preview, and optimistic UI with toast notifications.
 */
export default function ConsentModal({
  open,
  onClose,
  onConfirm,
  availableFields,
}: ConsentModalProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [error, setError] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'loading',
  });

  /**
   * Reset state when modal opens
   */
  useEffect(() => {
    if (open) {
      setSelectedFields([]);
      setDurationHours(24);
      setError('');
      setIsConfirming(false);
      setToast({ visible: false, message: '', type: 'loading' });
    }
  }, [open]);

  /**
   * Handle field checkbox toggle
   */
  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
    // Clear error when user makes a selection
    if (error) setError('');
  };

  /**
   * Handle select all fields
   */
  const handleSelectAll = () => {
    if (selectedFields.length === availableFields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields([...availableFields]);
    }
  };

  /**
   * Handle duration change
   */
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setDurationHours(value);
    }
  };

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: ToastState['type'], consentId?: string) => {
    setToast({ visible: true, message, type, consentId });
    
    // Auto-hide toast after 5 seconds (except for loading)
    if (type !== 'loading') {
      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 5000);
    }
  };

  /**
   * Copy consent ID to clipboard
   */
  const handleCopyConsentId = async (consentId: string) => {
    try {
      await navigator.clipboard.writeText(consentId);
      showToast('Consent ID copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  /**
   * Handle confirm button click with optimistic UI
   */
  const handleConfirm = async () => {
    // Validation
    if (selectedFields.length === 0) {
      setError('Please select at least one field to share.');
      return;
    }

    if (durationHours < 1) {
      setError('Duration must be at least 1 hour.');
      return;
    }

    setError('');
    setIsConfirming(true);

    // Optimistic UI: Show loading toast immediately
    showToast('Sharing...', 'loading');

    try {
      // Call the confirm handler
      await onConfirm(selectedFields, durationHours);

      // Success: Generate a mock consent ID (in real app, this would come from API response)
      const consentId = `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Show success toast with consent ID
      showToast('Fields shared successfully!', 'success', consentId);

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      // Error: Show error message
      const errorMessage = err instanceof Error ? err.message : 'Failed to share fields. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  /**
   * Handle cancel button click
   */
  const handleCancel = () => {
    if (!isConfirming) {
      onClose();
    }
  };

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isConfirming) {
      onClose();
    }
  };

  /**
   * Calculate expiration date
   */
  const getExpirationDate = (): string => {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + durationHours);
    return expiration.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Don't render if modal is not open
  if (!open) return null;

  const isConfirmDisabled = selectedFields.length === 0 || isConfirming;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-modal-title"
        aria-describedby="consent-modal-description"
      >
        <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2
                id="consent-modal-title"
                className="text-2xl font-bold text-foreground"
              >
                Share Credential Fields
              </h2>
              <p
                id="consent-modal-description"
                className="text-sm text-muted-foreground mt-1"
              >
                Select the fields you want to share and set an expiration time
              </p>
            </div>
            <button
              onClick={handleCancel}
              disabled={isConfirming}
              className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg flex items-start"
              role="alert"
              aria-live="polite"
            >
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Field Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Select Fields to Share
              </label>
              <button
                onClick={handleSelectAll}
                disabled={isConfirming}
                className="text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                {selectedFields.length === availableFields.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableFields.map((field) => (
                <label
                  key={field}
                  className={`flex items-center p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedFields.includes(field)
                      ? 'bg-primary/5 border-primary'
                      : 'bg-muted/30 border-border hover:border-primary/50'
                  } ${isConfirming ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field)}
                    onChange={() => handleFieldToggle(field)}
                    disabled={isConfirming}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={`Share ${formatFieldName(field)}`}
                  />
                  <span className="ml-3 text-sm font-medium text-foreground">
                    {formatFieldName(field)}
                  </span>
                </label>
              ))}
            </div>

            {availableFields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No fields available to share
              </p>
            )}
          </div>

          {/* Duration Input */}
          <div className="space-y-2">
            <label
              htmlFor="duration-input"
              className="text-sm font-semibold text-foreground block"
            >
              Consent Duration (hours)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="duration-input"
                type="number"
                min="1"
                max="8760"
                value={durationHours}
                onChange={handleDurationChange}
                disabled={isConfirming}
                className="input-field flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-describedby="duration-hint"
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
            <p id="duration-hint" className="text-xs text-muted-foreground">
              Maximum: 8,760 hours (1 year)
            </p>
          </div>

          {/* Preview Section */}
          {selectedFields.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Preview
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fields to share:</span>
                  <span className="font-medium text-foreground">
                    {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedFields.map((field) => (
                    <span
                      key={field}
                      className="badge badge-primary text-xs"
                    >
                      {formatFieldName(field)}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Expires at:</span>
                  <span className="font-medium text-foreground">
                    {getExpirationDate()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={handleCancel}
              disabled={isConfirming}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className="btn-primary px-6 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-busy={isConfirming}
            >
              {isConfirming ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Confirming...
                </>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`fixed bottom-4 right-4 z-[60] max-w-md animate-fadeIn ${
            toast.type === 'error' ? 'animate-shake' : ''
          }`}
          role="status"
          aria-live="polite"
        >
          <div
            className={`card p-4 shadow-lg flex items-start gap-3 ${
              toast.type === 'error'
                ? 'bg-danger/10 border-danger/20'
                : toast.type === 'success'
                ? 'bg-success/10 border-success/20'
                : 'bg-primary/10 border-primary/20'
            }`}
          >
            {/* Toast Icon */}
            <div className="flex-shrink-0">
              {toast.type === 'loading' && (
                <svg
                  className="animate-spin h-5 w-5 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {toast.type === 'success' && (
                <svg
                  className="h-5 w-5 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg
                  className="h-5 w-5 text-danger"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>

            {/* Toast Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  toast.type === 'error'
                    ? 'text-danger'
                    : toast.type === 'success'
                    ? 'text-success'
                    : 'text-primary'
                }`}
              >
                {toast.message}
              </p>

              {/* Consent ID (only for success) */}
              {toast.type === 'success' && toast.consentId && (
                <div className="mt-2 flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-foreground break-all">
                    {toast.consentId}
                  </code>
                  <button
                    onClick={() => handleCopyConsentId(toast.consentId!)}
                    className="flex-shrink-0 p-1 hover:bg-accent rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Copy consent ID"
                    title="Copy consent ID"
                  >
                    <svg
                      className="w-4 h-4 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Close Button */}
            {toast.type !== 'loading' && (
              <button
                onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
                className="flex-shrink-0 p-1 hover:bg-accent rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close notification"
              >
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
