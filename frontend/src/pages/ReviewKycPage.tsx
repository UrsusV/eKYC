import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  User,
  MapPin,
  Shield,
  AlertCircle,
} from "lucide-react";
import { bankService } from "@/services/bankService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { KycRequest } from "@/types";
import { getStatusColor } from "@/utils";

export const ReviewKycPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const requestId = id;
  const [request, setRequest] = useState<KycRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectionCategory, setRejectionCategory] = useState<string>("");

  useEffect(() => {
    if (requestId) {
      loadKycRequest();
    }
  }, [requestId]);

  const loadKycRequest = async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await bankService.getKycRequestDetails(requestId);
      setRequest(data);
    } catch (err: any) {
      console.error("Failed to load KYC request:", err);
      setError(err.response?.data?.message || "Failed to load KYC request");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!requestId || !action) return;

    if (!notes.trim()) {
      setError("Please provide review notes");
      return;
    }

    if (action === "reject" && !rejectionCategory) {
      setError("Please select a rejection category");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await bankService.verifyKyc(requestId, action, notes, rejectionCategory);
      navigate("/officer/kyc-queue");
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      console.error("Error response:", err.response?.data);
      console.error("Full error response:", JSON.stringify(err.response?.data, null, 2));
      const errorMsg = err.response?.data?.message || "Failed to submit review";
      const validationErrors = err.response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        setError(`${errorMsg}: ${validationErrors.map((e: any) => e.message).join(", ")}`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link to="/officer/kyc-requests" className="btn btn-primary">
            Back to Queue
          </Link>
        </div>
      </div>
    );
  }

  if (!request) return null;

  // Allow review if not already approved, rejected, cancelled, or expired
  const canReview = !["approved", "rejected", "cancelled", "expired"].includes(
    request.status
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/officer/kyc-requests" className="btn btn-secondary">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Queue
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Review KYC Request
        </h1>
      </div>

      {/* Status Card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Request ID: {request.requestId || request._id}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Submitted on {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
              request.status
            )}`}
          >
            {request.status}
          </span>
        </div>
      </div>

      {/* Shared Credential Details - Show only if using existing credential */}
      {request.useExistingCredential && request.sharedCredentialId && (
        <div className="card mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Shared Credential Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Issuing Institution
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.sharedCredentialId.bank?.name || 'Unknown Bank'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Credential ID
              </p>
              <p className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                {request.sharedCredentialId.credentialId}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Issuance Date
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(request.sharedCredentialId.issuedAt).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Expiration Date
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(request.sharedCredentialId.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Blockchain Verification Status */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Blockchain Verification Status
            </h4>

            {request.credentialVerificationResult ? (
              <div className={`p-4 rounded-lg border-2 ${
                request.credentialVerificationResult.isValid
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start space-x-3">
                  {request.credentialVerificationResult.isValid ? (
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className={`text-lg font-semibold mb-2 ${
                      request.credentialVerificationResult.isValid
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>
                      {request.credentialVerificationResult.isValid
                        ? '✅ Credential Verified - Not Revoked'
                        : '❌ Credential Revoked'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Checked on blockchain at:{' '}
                      {new Date(request.credentialVerificationResult.checkedAt).toLocaleString()}
                    </p>

                    {request.credentialVerificationResult.blockchainData && (
                      <div className="bg-white dark:bg-gray-800 rounded p-3 text-xs space-y-2">
                        <p>
                          <strong>Issuer:</strong>{' '}
                          <span className="font-mono text-gray-600 dark:text-gray-400">
                            {request.credentialVerificationResult.blockchainData.issuer.substring(0, 10)}...
                            {request.credentialVerificationResult.blockchainData.issuer.substring(request.credentialVerificationResult.blockchainData.issuer.length - 8)}
                          </span>
                        </p>
                        <p>
                          <strong>Holder:</strong>{' '}
                          <span className="font-mono text-gray-600 dark:text-gray-400">
                            {request.credentialVerificationResult.blockchainData.holder.substring(0, 10)}...
                            {request.credentialVerificationResult.blockchainData.holder.substring(request.credentialVerificationResult.blockchainData.holder.length - 8)}
                          </span>
                        </p>
                        <p>
                          <strong>Issued At:</strong>{' '}
                          {new Date(request.credentialVerificationResult.blockchainData.issuedAt * 1000).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {!request.credentialVerificationResult.isValid && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                          ⚠️ Warning
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          This credential has been revoked by the issuing institution.
                          You should reject this KYC request or request new documentation.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  Verifying credential on blockchain...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Personal Information
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Full Name
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.fullName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Date of Birth
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.dateOfBirth}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nationality
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.nationality}
              </p>
            </div>
          </div>
        </div>

        {/* Document Information */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Document Information
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Document Type
              </p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {request.documentType?.replace("_", " ") || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Document Number
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.documentNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                KYC Level
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                Level {request.kycLevel}
              </p>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="card lg:col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <MapPin className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Address Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Street</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {typeof request.address === 'object' ? request.address?.street : request.address || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">City</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {typeof request.address === 'object' ? request.address?.city : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">State</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {typeof request.address === 'object' ? request.address?.state : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Zip Code
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {typeof request.address === 'object' ? request.address?.zipCode : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {canReview && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Submit Review
          </h3>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review Decision
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAction("approve")}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    action === "approve"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-green-500"
                  }`}
                >
                  <CheckCircle
                    className={`w-8 h-8 mx-auto mb-2 ${
                      action === "approve" ? "text-green-500" : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`font-medium ${
                      action === "approve"
                        ? "text-green-900 dark:text-green-100"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    Approve
                  </p>
                </button>

                <button
                  onClick={() => setAction("reject")}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    action === "reject"
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-red-500"
                  }`}
                >
                  <XCircle
                    className={`w-8 h-8 mx-auto mb-2 ${
                      action === "reject" ? "text-red-500" : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`font-medium ${
                      action === "reject"
                        ? "text-red-900 dark:text-red-100"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    Reject
                  </p>
                </button>
              </div>
            </div>

            {action === "reject" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Category *
                </label>
                <select
                  value={rejectionCategory}
                  onChange={(e) => setRejectionCategory(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select a category</option>
                  <option value="incomplete_documents">Incomplete Documents</option>
                  <option value="invalid_documents">Invalid Documents</option>
                  <option value="failed_verification">Failed Verification</option>
                  <option value="high_risk">High Risk</option>
                  <option value="aml_concerns">AML Concerns</option>
                  <option value="duplicate_account">Duplicate Account</option>
                  <option value="ineligible">Ineligible</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review Notes *
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input w-full min-h-[120px]"
                placeholder="Provide detailed notes about your review decision..."
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Link to="/officer/kyc-queue" className="btn btn-secondary">
                Cancel
              </Link>
              <button
                onClick={handleSubmitReview}
                disabled={!action || !notes.trim() || submitting}
                className="btn btn-primary"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  `Submit ${
                    action === "approve"
                      ? "Approval"
                      : action === "reject"
                      ? "Rejection"
                      : "Review"
                  }`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {!canReview && (
        <div className="card bg-gray-50 dark:bg-gray-800">
          <p className="text-center text-gray-600 dark:text-gray-400">
            {request.status === "approved" || request.status === "rejected" || request.status === "cancelled"
              ? "This request has already been reviewed and cannot be modified."
              : `This request cannot be reviewed yet. Current status: ${request.status}. The request must be in "under_review" status before approval or rejection.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewKycPage;
