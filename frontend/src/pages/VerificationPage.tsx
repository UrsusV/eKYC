import React, { useState } from "react";
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  User,
  Calendar,
  Building2,
  QrCode,
  Download,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

interface VerificationResult {
  status: "verified" | "invalid" | "revoked" | "expired" | "consent_required";
  message: string;
  credentialHash: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  holderName?: string;
  credentialType: string;
  consentRequired: boolean;
  verificationId: string;
  verifiedAt: string;
  proofChain?: Array<{
    issuer: string;
    issuedAt: string;
    credentialType: string;
  }>;
}

const VerificationPage: React.FC = () => {
  const [verificationMethod, setVerificationMethod] = useState<"hash" | "qr">(
    "hash"
  );
  const [hash, setHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    if (!hash.trim()) {
      setError("Please enter a credential hash");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hash: hash.trim(),
          verifierId: "verification-page",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      setResult(data);
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = () => {
    if (!result) return null;

    switch (result.status) {
      case "verified":
        return {
          icon: CheckCircle,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800",
          badgeColor:
            "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
          title: "Verified",
        };
      case "invalid":
        return {
          icon: XCircle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          badgeColor:
            "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
          title: "Invalid",
        };
      case "revoked":
        return {
          icon: XCircle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          badgeColor:
            "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
          title: "Revoked",
        };
      case "expired":
        return {
          icon: Clock,
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          borderColor: "border-amber-200 dark:border-amber-800",
          badgeColor:
            "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300",
          title: "Expired",
        };
      case "consent_required":
        return {
          icon: AlertCircle,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          badgeColor:
            "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300",
          title: "Consent Required",
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-900 dark:via-primary-800 dark:to-primary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Credential Verification
            </h1>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto">
              Verify the authenticity and validity of digital credentials
              instantly using blockchain technology
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verification Method Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={() => setVerificationMethod("hash")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                verificationMethod === "hash"
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Search className="w-5 h-5" />
              Verify by Hash
            </button>
            <button
              onClick={() => setVerificationMethod("qr")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                verificationMethod === "qr"
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <QrCode className="w-5 h-5" />
              Scan QR Code
            </button>
          </div>

          {/* Hash Input Method */}
          {verificationMethod === "hash" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="hash-input"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Credential Hash
                </label>
                <div className="flex gap-2">
                  <input
                    id="hash-input"
                    type="text"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter credential hash (e.g., 0x1a2b3c4d...)"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleVerify}
                    disabled={isLoading || !hash.trim()}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-w-[120px]"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Verifying
                      </span>
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Scanner Method */}
          {verificationMethod === "qr" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <QrCode className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                QR Code Scanner
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                QR code scanning feature coming soon
              </p>
              <button
                onClick={() => setVerificationMethod("hash")}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Use hash verification instead
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Verification Result */}
        {result && statusConfig && (
          <div
            className={`${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-lg shadow-lg overflow-hidden`}
          >
            {/* Result Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div
                  className={`flex-shrink-0 w-16 h-16 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}
                >
                  <statusConfig.icon
                    className={`w-8 h-8 ${statusConfig.color}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statusConfig.title}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.badgeColor}`}
                    >
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {result.message}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(result.verificationId)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Copy ID
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Credential Details */}
            <div className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Credential Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <FileText className="w-4 h-4" />
                      Credential Type
                    </label>
                    <p className="text-base text-gray-900 dark:text-white font-medium">
                      {result.credentialType}
                    </p>
                  </div>

                  {result.holderName && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        <User className="w-4 h-4" />
                        Holder Name
                      </label>
                      <p className="text-base text-gray-900 dark:text-white font-medium">
                        {result.holderName}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <Building2 className="w-4 h-4" />
                      Issuing Authority
                    </label>
                    <p className="text-base text-gray-900 dark:text-white font-medium">
                      {result.issuer}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      Issue Date
                    </label>
                    <p className="text-base text-gray-900 dark:text-white font-medium">
                      {formatDate(result.issuedAt)}
                    </p>
                  </div>

                  {result.expiresAt && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        <Clock className="w-4 h-4" />
                        Expiry Date
                      </label>
                      <p className="text-base text-gray-900 dark:text-white font-medium">
                        {formatDate(result.expiresAt)}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <Shield className="w-4 h-4" />
                      Verification ID
                    </label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all">
                      {result.verificationId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Credential Hash */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Credential Hash
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <code className="flex-1 text-sm text-gray-900 dark:text-white font-mono break-all">
                    {result.credentialHash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.credentialHash)}
                    className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Copy hash"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Proof Chain */}
              {result.proofChain && result.proofChain.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Verification Chain
                  </h4>
                  <div className="space-y-2">
                    {result.proofChain.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.issuer}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {item.credentialType} • {formatDate(item.issuedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  View on Blockchain
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards */}
        {!result && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Secure Verification
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All verifications use blockchain technology for tamper-proof
                validation
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Instant Results
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get real-time verification results in less than 2 seconds
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Complete Audit Trail
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Every verification is logged with immutable proof chain
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;
