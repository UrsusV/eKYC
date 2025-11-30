import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, FileText, RefreshCw, Eye } from "lucide-react";
import { kycService } from "@/services/kycService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { KycRequest } from "@/types";
import { getStatusColor, formatDate } from "@/utils";

export const KycHistoryPage: React.FC = () => {
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadKycHistory();
  }, [statusFilter]);

  const loadKycHistory = async (isRefresh = false) => {
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
      
      const response = await kycService.getKycHistory(params);
      // Handle nested response structure from backend
      let requestsData: KycRequest[] = [];
      if (response.data) {
        requestsData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).requests || [];
      }
      setRequests(requestsData);
    } catch (err: any) {
      console.error("Failed to load KYC history:", err);
      setError(err.response?.data?.message || "Failed to load KYC history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.requestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase());
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
            KYC History
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View all your KYC verification requests and their status.
          </p>
        </div>
        <button
          onClick={() => loadKycHistory(true)}
          disabled={refreshing}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by request ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full pl-10 appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {filteredRequests.length} Request
            {filteredRequests.length !== 1 ? "s" : ""}
          </h2>
          <Link to="/kyc/submit" className="btn btn-primary btn-sm">
            New KYC Request
          </Link>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "No requests match your search criteria."
                : "No KYC requests found."}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Link to="/kyc/submit" className="btn btn-primary">
                Submit Your First KYC Request
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Document Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRequests.map((request) => (
                    <tr
                      key={request._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {request.requestId || request._id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {request.fullName || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 capitalize">
                        {request.documentType?.replace("_", " ") || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {formatDate(request.createdAt, "short")}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(request.createdAt, "relative")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/kyc/status/${request._id}`}
                          className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredRequests.map((request) => (
                <Link
                  key={request._id}
                  to={`/kyc/status/${request._id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.requestId || request._id.substring(0, 8)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {request.fullName || "N/A"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Document</p>
                      <p className="text-gray-900 dark:text-gray-300 capitalize">
                        {request.documentType?.replace("_", " ") || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Submitted</p>
                      <p className="text-gray-900 dark:text-gray-300">
                        {formatDate(request.createdAt, "relative")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KycHistoryPage;
