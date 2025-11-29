import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { kycService } from "@/services/kycService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { KycRequest, Credential } from "@/types";

interface DashboardStats {
  totalKycRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  totalCredentials: number;
}

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalKycRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalCredentials: 0,
  });
  const [recentRequests, setRecentRequests] = useState<KycRequest[]>([]);
  const [recentCredentials, setRecentCredentials] = useState<Credential[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch KYC requests with error handling
      let requests: KycRequest[] = [];
      try {
        const kycResponse = await kycService.getKycHistory({ limit: 100 });
        requests = (kycResponse.data || []) as KycRequest[];
      } catch (kycErr) {
        console.warn("Could not load KYC history:", kycErr);
        // Continue with empty array
      }

      // Calculate stats
      const pending = requests.filter(
        (r: KycRequest) => r.status === "pending" || r.status === "submitted"
      ).length;
      const approved = requests.filter(
        (r: KycRequest) => r.status === "approved"
      ).length;

      // Fetch credentials with error handling
      let credentials: Credential[] = [];
      try {
        const credentialsResponse = await kycService.getCredentials({
          limit: 100,
        });
        credentials = (credentialsResponse.data || []) as Credential[];
      } catch (credErr) {
        console.warn("Could not load credentials:", credErr);
        // Continue with empty array
      }

      setStats({
        totalKycRequests: requests.length,
        pendingRequests: pending,
        approvedRequests: approved,
        totalCredentials: credentials.length,
      });

      // Get recent items (last 3)
      setRecentRequests(requests.slice(0, 3));
      setRecentCredentials(credentials.slice(0, 3));
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
      case "submitted":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "rejected":
      case "revoked":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400";
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
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back! Here's an overview of your KYC status and credentials.
        </p>
      </div>

      {error && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 text-red-800 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Total KYC Requests
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                {stats.totalKycRequests}
              </p>
            </div>
            <FileText className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Pending Reviews
              </p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-2">
                {stats.pendingRequests}
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Approved
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                {stats.approvedRequests}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Credentials
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                {stats.totalCredentials}
              </p>
            </div>
            <Shield className="w-12 h-12 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/kyc/submit" className="btn btn-primary text-center">
            Submit New KYC Request
          </Link>
          <Link to="/kyc/history" className="btn btn-secondary text-center">
            Check KYC Status
          </Link>
          <Link to="/credentials" className="btn btn-secondary text-center">
            View My Credentials
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent KYC Requests */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent KYC Requests
            </h2>
            <Link
              to="/kyc/history"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All →
            </Link>
          </div>
          {recentRequests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No KYC requests yet. Submit your first request to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div
                  key={request._id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.requestId || request._id}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Level: {request.kycLevel || "N/A"}
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Credentials */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Credentials
            </h2>
            <Link
              to="/credentials"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All →
            </Link>
          </div>
          {recentCredentials.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No credentials issued yet. Complete KYC verification to receive
              credentials.
            </p>
          ) : (
            <div className="space-y-3">
              {recentCredentials.map((credential) => (
                <Link
                  key={credential._id}
                  to={`/credentials/${credential._id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {credential.credentialId || "Credential"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Issued:{" "}
                        {new Date(
                          credential.issuedAt || credential.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        credential.status
                      )}`}
                    >
                      {credential.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
