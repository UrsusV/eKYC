import React, { useEffect, useState } from "react";
import { Shield, CheckCircle, XCircle, AlertCircle, Eye, RefreshCw, Search } from "lucide-react";
import { consentService } from "@/services/consentService";
import { useToast } from "@/contexts/ToastContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Consent } from "@/types";
import { getStatusColor, formatDate } from "@/utils";

export const ConsentsPage: React.FC = () => {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    loadConsents();
  }, [statusFilter]);

  const loadConsents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params: any = { limit: 100 };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await consentService.getMyConsents(params);
      
      // Handle nested response structure
      let consentsData: Consent[] = [];
      if (response.data) {
        consentsData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).consents || [];
      }
      setConsents(consentsData);
    } catch (err: any) {
      console.error("Failed to load consents:", err);
      setError(err.response?.data?.message || "Failed to load consents");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGrantConsent = async (consentId: string) => {
    try {
      setActionLoading(true);
      await consentService.grantConsent(consentId);
      showSuccess("Consent granted successfully");
      setShowModal(false);
      loadConsents(true);
    } catch (err: any) {
      showError(err.message || "Failed to grant consent");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDenyConsent = async (consentId: string, reason: string) => {
    try {
      setActionLoading(true);
      await consentService.denyConsent(consentId, reason);
      showSuccess("Consent denied");
      setShowModal(false);
      loadConsents(true);
    } catch (err: any) {
      showError(err.message || "Failed to deny consent");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeConsent = async (consentId: string, reason: string) => {
    try {
      setActionLoading(true);
      await consentService.revokeConsent(consentId, reason);
      showSuccess("Consent revoked successfully");
      setShowModal(false);
      loadConsents(true);
    } catch (err: any) {
      showError(err.message || "Failed to revoke consent");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredConsents = consents.filter((consent) => {
    const matchesSearch =
      consent.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consent.bankName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consent._id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Consent Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your data sharing consents and permissions.
          </p>
        </div>
        <button
          onClick={() => loadConsents(true)}
          disabled={refreshing}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 text-red-800 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by purpose or bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="granted">Granted</option>
              <option value="denied">Denied</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consents List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {filteredConsents.length} Consent{filteredConsents.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {filteredConsents.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Consents Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== "all"
                ? "No consents match your search criteria."
                : "Consents will appear here when banks request access to your data."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsents.map((consent) => (
              <div
                key={consent._id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {consent.purpose || "Data Consent Request"}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          consent.status
                        )}`}
                      >
                        {consent.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {consent.bankName && (
                        <p>
                          <span className="font-medium">Bank:</span> {consent.bankName}
                        </p>
                      )}
                      {consent.createdAt && (
                        <p>
                          <span className="font-medium">Requested:</span>{" "}
                          {formatDate(consent.createdAt, "relative")}
                        </p>
                      )}
                      {consent.expiresAt && (
                        <p>
                          <span className="font-medium">Expires:</span>{" "}
                          {formatDate(consent.expiresAt, "short")}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedConsent(consent);
                      setShowModal(true);
                    }}
                    className="btn btn-secondary btn-sm flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for consent details and actions */}
      {showModal && selectedConsent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Consent Details
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      selectedConsent.status
                    )}`}
                  >
                    {selectedConsent.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purpose
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedConsent.purpose || "N/A"}
                  </p>
                </div>

                {selectedConsent.bankName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Requesting Bank
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedConsent.bankName}
                    </p>
                  </div>
                )}

                {selectedConsent.dataCategories && selectedConsent.dataCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Categories
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedConsent.dataCategories.map((category, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-sm"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedConsent.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Requested On
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(selectedConsent.createdAt, "long")}
                    </p>
                  </div>
                )}

                {selectedConsent.expiresAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expires On
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(selectedConsent.expiresAt, "long")}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons based on status */}
              <div className="mt-6 flex flex-wrap gap-3">
                {selectedConsent.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleGrantConsent(selectedConsent._id)}
                      disabled={actionLoading}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Grant Consent</span>
                    </button>
                    <button
                      onClick={() => handleDenyConsent(selectedConsent._id, "User declined")}
                      disabled={actionLoading}
                      className="btn btn-secondary flex items-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Deny</span>
                    </button>
                  </>
                )}

                {selectedConsent.status === "granted" && (
                  <button
                    onClick={() => handleRevokeConsent(selectedConsent._id, "User revoked access")}
                    disabled={actionLoading}
                    className="btn btn-secondary flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Revoke Consent</span>
                  </button>
                )}

                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentsPage;
