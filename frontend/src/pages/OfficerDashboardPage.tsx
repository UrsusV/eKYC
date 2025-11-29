import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { bankService } from "@/services/bankService";
import LoadingSpinner from "@/components/LoadingSpinner";

interface OfficerStats {
  totalRequests: number;
  pendingRequests: number;
  approvedToday: number;
  rejectedToday: number;
}

export const OfficerDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OfficerStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all KYC requests
      const response = await bankService.getKycRequests({
        status: "all",
        limit: 1000,
      });
      const requests = (response.data || []) as any[];

      // Calculate stats
      const pending = requests.filter(
        (r: any) =>
          r.status === "pending" ||
          r.status === "submitted" ||
          r.status === "under_review"
      ).length;

      const today = new Date().toDateString();
      const approvedToday = requests.filter(
        (r: any) =>
          r.status === "approved" &&
          new Date(r.updatedAt).toDateString() === today
      ).length;

      const rejectedToday = requests.filter(
        (r: any) =>
          r.status === "rejected" &&
          new Date(r.updatedAt).toDateString() === today
      ).length;

      setStats({
        totalRequests: requests.length,
        pendingRequests: pending,
        approvedToday,
        rejectedToday,
      });
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
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
          Officer Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage and review KYC verification requests.
        </p>
      </div>

      {error && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Total Requests
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                {stats.totalRequests}
              </p>
            </div>
            <FileText className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Pending Review
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
                Approved Today
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                {stats.approvedToday}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Rejected Today
              </p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">
                {stats.rejectedToday}
              </p>
            </div>
            <XCircle className="w-12 h-12 text-red-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/officer/kyc-requests"
            className="btn btn-primary text-center"
          >
            View KYC Queue
          </Link>
          <Link
            to="/officer/issue-credential"
            className="btn btn-secondary text-center"
          >
            Issue Credential
          </Link>
          <Link to="/profile" className="btn btn-secondary text-center">
            My Profile
          </Link>
        </div>
      </div>

      {/* Info Card */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Bank Officer Responsibilities
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Review and verify customer KYC requests</li>
              <li>
                Approve or reject verification requests with detailed comments
              </li>
              <li>Issue blockchain credentials for approved KYC requests</li>
              <li>Maintain accurate records of all verification activities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboardPage;
