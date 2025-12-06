import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { Credential } from '@/types';

interface RevokeCredentialModalProps {
  credential: Credential;
  isOpen: boolean;
  onClose: () => void;
  onRevoke: (reason: string, details?: string) => Promise<void>;
}

const REVOCATION_REASONS = [
  { value: 'fraud_detected', label: 'Fraud Detected' },
  { value: 'data_inaccuracy', label: 'Data Inaccuracy' },
  { value: 'user_request', label: 'User Request' },
  { value: 'expired_documents', label: 'Expired Documents' },
  { value: 'compliance_violation', label: 'Compliance Violation' },
  { value: 'duplicate_credential', label: 'Duplicate Credential' },
  { value: 'other', label: 'Other' },
];

export const RevokeCredentialModal: React.FC<RevokeCredentialModalProps> = ({
  credential,
  isOpen,
  onClose,
  onRevoke,
}) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      setError('Please select a revocation reason');
      return;
    }

    setError('');
    setIsRevoking(true);

    try {
      await onRevoke(reason, details || undefined);
      onClose();
      // Reset form
      setReason('');
      setDetails('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke credential');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleClose = () => {
    if (!isRevoking) {
      setReason('');
      setDetails('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Revoke Credential
          </h2>
          <button
            onClick={handleClose}
            disabled={isRevoking}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Warning */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Warning: This action cannot be undone</p>
              <p>
                Revoking this credential will mark it as invalid on the blockchain
                and the user will no longer be able to use it for verification.
              </p>
            </div>
          </div>

          {/* Credential Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Credential ID</p>
            <p className="text-sm font-mono font-medium text-gray-900 break-all">
              {credential.credentialId}
            </p>
            <p className="text-sm text-gray-600 mt-3 mb-1">Type</p>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {credential.credentialType?.replace(/_/g, ' ')}
            </p>
          </div>

          {/* Reason Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Revocation Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isRevoking}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              required
            >
              <option value="">Select a reason...</option>
              {REVOCATION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Details Textarea */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={isRevoking}
              rows={4}
              maxLength={500}
              placeholder="Provide additional context for this revocation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              {details.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isRevoking}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRevoking || !reason}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRevoking ? 'Revoking...' : 'Revoke Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
