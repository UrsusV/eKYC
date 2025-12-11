import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertCircle } from "lucide-react";
import { bankService } from "@/services/bankService";
import LoadingSpinner from "@/components/LoadingSpinner";

export const IssueCredentialPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requestId, setRequestId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestId.trim()) {
      setError("Please enter a KYC Request ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Calculate expiry date (1 year from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      await bankService.issueCredential({
        requestId,
        credentialType: "identity_verification",
        expiryDate: expiryDate.toISOString(),
      });
      setSuccess(true);
      setRequestId("");

      setTimeout(() => {
        navigate("/officer/kyc-requests");
      }, 2000);
    } catch (err: any) {
      console.error("Failed to issue credential:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to issue credential"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Issue Blockchain Credential
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Issue a blockchain-verified credential for an approved KYC request.
        </p>
      </div>

      {success && (
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-3 text-green-800 dark:text-green-400">
            <Shield className="w-6 h-6" />
            <div>
              <p className="font-semibold">Credential Issued Successfully!</p>
              <p className="text-sm">
                The blockchain credential has been created and recorded.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3 text-red-800 dark:text-red-400">
            <AlertCircle className="w-6 h-6" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-400 text-sm">
              <strong>Important:</strong> Only approved KYC requests can receive
              blockchain credentials. The credential will be permanently
              recorded on the blockchain.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              KYC Request ID *
            </label>
            <input
              type="text"
              value={requestId}
              onChange={(e) => {
                setRequestId(e.target.value);
                setError(null);
              }}
              className="input w-full"
              placeholder="Enter the KYC Request ID (e.g., KYC-2024-001 or ObjectId)"
              disabled={loading}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              You can find the Request ID in the KYC queue or review page.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Credential Details
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>
                Credential will be issued to the customer's wallet address
              </li>
              <li>Transaction will be recorded on the Ethereum blockchain</li>
              <li>
                Credential includes: identity verification, document
                verification, and address verification
              </li>
              <li>
                Once issued, the credential cannot be modified (only revoked if
                necessary)
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/officer/kyc-requests")}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !requestId.trim()}
              className="btn btn-primary flex items-center space-x-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              <Shield className="w-4 h-4" />
              <span>
                {loading
                  ? "Issuing Credential..."
                  : "Issue Blockchain Credential"}
              </span>
            </button>
          </div>
        </form>
      </div>

      <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          Prerequisites
        </h3>
        <ol className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-decimal list-inside">
          <li>The KYC request must be in "approved" status</li>
          <li>Customer must have a valid wallet address</li>
          <li>No existing credential should be issued for this request</li>
          <li>All required verification checks must be completed</li>
        </ol>
      </div>
    </div>
  );
};

export default IssueCredentialPage;
