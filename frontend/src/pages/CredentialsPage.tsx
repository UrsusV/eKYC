import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { kycService } from "@/services/kycService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Credential } from "@/types";
import { getStatusColor, truncateHash, copyToClipboard } from "@/utils";

export const CredentialsPage: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await kycService.getCredentials({ limit: 100 });
      setCredentials((response.data || []) as Credential[]);
    } catch (err: any) {
      console.error("Failed to load credentials:", err);
      setError(err.response?.data?.message || "Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = async (hash: string) => {
    try {
      await copyToClipboard(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Credentials
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View your blockchain-verified credentials and verification history.
        </p>
      </div>

      {error && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {credentials.length === 0 ? (
        <div className="card text-center py-12">
          <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Credentials Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have any blockchain credentials yet. Complete your KYC
            verification to receive credentials.
          </p>
          <Link to="/kyc/submit" className="btn btn-primary">
            Submit KYC Request
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {credentials.map((credential) => (
            <div
              key={credential._id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                    <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {credential.credentialType
                        ?.replace(/_/g, " ")
                        .toUpperCase() || "Credential"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID:{" "}
                      {credential.credentialId || truncateHash(credential._id)}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    credential.status
                  )}`}
                >
                  {credential.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Issued Date
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(
                      credential.issuedAt || credential.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>

                {credential.expiresAt && (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Expires On
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(credential.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {credential.blockchain && (
                  <>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Transaction Hash
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-300">
                          {truncateHash(credential.blockchain.transactionHash)}
                        </code>
                        <button
                          onClick={() =>
                            handleCopyHash(
                              credential.blockchain.transactionHash
                            )
                          }
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                          title="Copy transaction hash"
                        >
                          {copiedHash ===
                          credential.blockchain.transactionHash ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <a
                          href={`https://etherscan.io/tx/${credential.blockchain.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                          title="View on blockchain explorer"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </a>
                      </div>
                    </div>

                    {credential.blockchain.blockNumber && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Block Number
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {credential.blockchain.blockNumber}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <Link
                to={`/credentials/${credential._id}`}
                className="btn btn-secondary w-full text-center"
              >
                View Full Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CredentialsPage;
