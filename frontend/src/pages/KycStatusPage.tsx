import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { kycService } from "@/services/kycService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { KycRequest } from "@/types";
import { getStatusColor } from "@/utils";

export const KycStatusPage: React.FC = () => {
  const { requestId } = useParams<{ requestId?: string }>();
  const [request, setRequest] = useState<KycRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestId) {
      loadKycStatus(requestId);
    } else {
      loadLatestKycRequest();
    }
  }, [requestId]);

  const loadKycStatus = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await kycService.getKycStatus(id);
      setRequest(response);
    } catch (err: any) {
      console.error("Failed to load KYC status:", err);
      setError(err.response?.data?.message || "Failed to load KYC status");
    } finally {
      setLoading(false);
    }
  };

  const loadLatestKycRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await kycService.getKycHistory({ limit: 1 });
      const requests = (response.data || []) as KycRequest[];
      if (requests.length > 0) {
        setRequest(requests[0]);
      } else {
        setError("No KYC requests found");
      }
    } catch (err: any) {
      console.error("Failed to load latest KYC request:", err);
      setError(err.response?.data?.message || "Failed to load KYC request");
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

  if (error || !request) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || "Request Not Found"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "The KYC request you are looking for does not exist."}
          </p>
          <Link to="/kyc/submit" className="btn btn-primary">
            Submit New Request
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (request.status) {
      case "approved":
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case "rejected":
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return <Clock className="w-12 h-12 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (request.status) {
      case "approved":
        return "Your KYC request has been approved! You can now view your credentials.";
      case "rejected":
        return "Your KYC request was rejected. Please review the comments and submit a new request.";
      case "under_review":
        return "Your KYC request is currently being reviewed by our team.";
      case "pending":
      case "submitted":
        return "Your KYC request has been submitted and is waiting for review.";
      default:
        return "Your KYC request is being processed.";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/kyc/history" className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          KYC Request Status
        </h1>
      </div>

      {/* Status Card */}
      <div className="card text-center">
        <div className="flex flex-col items-center mb-6">
          {getStatusIcon()}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-2">
            Request{" "}
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            {getStatusMessage()}
          </p>
        </div>

        <div className="inline-flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Status:
          </span>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
              request.status
            )}`}
          >
            {request.status}
          </span>
        </div>
      </div>

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
                Request ID
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.requestId || request._id}
              </p>
            </div>
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
                {request.documentType.replace("_", " ")}
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
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Submission Date
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(request.createdAt).toLocaleDateString()}
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
                {request.address.street}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">City</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.address.city}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">State</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.address.state}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Zip Code
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.address.zipCode}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Country
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.address.country}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Information */}
      {request.workflow && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Workflow Information
          </h3>
          <div className="space-y-4">
            {request.workflow.submittedAt && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Submitted At
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(request.workflow.submittedAt).toLocaleString()}
                </p>
              </div>
            )}
            {request.workflow.approvedAt && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Approved At
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(request.workflow.approvedAt).toLocaleString()}
                </p>
              </div>
            )}
            {request.workflow.rejectedAt && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rejected At
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(request.workflow.rejectedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {request.status === "approved" && (
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Congratulations!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your KYC has been approved. You can now view your blockchain
              credentials.
            </p>
            <Link to="/credentials" className="btn btn-primary">
              View My Credentials
            </Link>
          </div>
        </div>
      )}

      {request.status === "rejected" && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Request Rejected
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please review the comments above and submit a new request with
              corrected information.
            </p>
            <Link to="/kyc/submit" className="btn btn-primary">
              Submit New Request
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycStatusPage;
