import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { kycService } from "@/services/kycService";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { KycRequest, Credential } from "@/types";
import { getStatusColor, formatDate } from "@/utils";

interface DashboardStats {
  totalKycRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  totalCredentials: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
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

    // Auto-refresh when window gains focus
    const handleFocus = () => {
      loadDashboardData(true);
    };

    window.addEventListener('focus', handleFocus);

    // Optional: Set up polling every 30 seconds
    const intervalId = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch KYC requests with error handling
      let requests: KycRequest[] = [];
      try {
        const kycResponse = await kycService.getKycHistory({ limit: 100 });
        // Handle nested response structure from backend
        if (kycResponse.data) {
          requests = Array.isArray(kycResponse.data) 
            ? kycResponse.data 
            : (kycResponse.data as any).requests || [];
        }
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
        // Handle nested response structure from backend
        if (credentialsResponse.data) {
          credentials = Array.isArray(credentialsResponse.data)
            ? credentialsResponse.data
            : (credentialsResponse.data as any).credentials || [];
        }
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
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.personalInfo?.fullName?.split(' ')[0] || user?.email.split('@')[0]}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's an overview of your KYC status and credentials.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
            Last updated: {formatDate(lastUpdated, "relative")}
          </p>
        </div>
        <button
          onClick={handleRefresh}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/kyc/history"
          className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
        >
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
        </Link>

        <Link
          to="/kyc/history"
          className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
        >
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
        </Link>

        <Link
          to="/kyc/history"
          className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
        >
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
        </Link>

        <Link
          to="/credentials"
          className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
        >
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
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/kyc/submit"
            className="btn btn-primary text-center justify-center"
          >
            Submit New KYC Request
          </Link>
          <Link
            to="/kyc/history"
            className="btn btn-secondary text-center justify-center"
          >
            Check KYC Status
          </Link>
          <Link
            to="/credentials"
            className="btn btn-secondary text-center justify-center"
          >
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
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No KYC Requests Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Submit your identity verification to get started with our services.
              </p>
              <Link
                to="/kyc/submit"
                className="inline-flex items-center space-x-2 btn btn-primary"
              >
                <span>Submit KYC Request</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
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
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Level: {request.kycLevel || "N/A"}
                        </p>
                        <span className="text-gray-400">•</span>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          {formatDate(request.createdAt, "relative")}
                        </p>
                      </div>
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
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Credentials Issued
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Blockchain credentials are automatically issued once your KYC verification is approved.
              </p>
              {stats.totalKycRequests === 0 ? (
                <Link
                  to="/kyc/submit"
                  className="inline-flex items-center space-x-2 btn btn-primary"
                >
                  <span>Start Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : stats.pendingRequests > 0 ? (
                <Link
                  to="/kyc/history"
                  className="inline-flex items-center space-x-2 btn btn-secondary"
                >
                  <span>View Pending KYC</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your credentials will appear here once approved.
                </p>
              )}
            </div>
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
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Issued: {new Date(
                            credential.issuedAt || credential.createdAt
                          ).toLocaleDateString()}
                        </p>
                        <span className="text-gray-400">•</span>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          {formatDate(credential.issuedAt || credential.createdAt, "relative")}
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
