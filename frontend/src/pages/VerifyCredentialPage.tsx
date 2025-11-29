import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface VerificationPayload {
  hash?: string;
  proof?: string;
  verifierId: string;
}

export interface ProofChainItem {
  issuer: string;
  issuedAt: string;
  credentialType: string;
}

export interface VerificationResult {
  status: 'verified' | 'invalid' | 'revoked' | 'expired' | 'consent_required';
  message: string;
  credentialHash: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  holderName?: string;
  credentialType: string;
  proofChain: ProofChainItem[];
  consentRequired: boolean;
  consentId?: string;
  verificationId: string;
  verifiedAt: string;
}

export interface VerifyCredentialPageProps {
  apiBaseUrl?: string;
  verifierId: string;
  verifierName: string;
  onConsentRequest?: (result: VerificationResult) => void;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'verified':
      return 'success';
    case 'invalid':
    case 'revoked':
      return 'danger';
    case 'expired':
      return 'warning';
    case 'consent_required':
      return 'primary';
    default:
      return 'neutral';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'verified':
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      );
    case 'invalid':
    case 'revoked':
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case 'expired':
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'consent_required':
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      );
    default:
      return null;
  }
};

const parseJSONProof = (jsonString: string): { hash: string; proof: any } => {
  try {
    const parsed = JSON.parse(jsonString);
    return {
      hash: parsed.credentialHash || parsed.hash || '',
      proof: parsed,
    };
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

const generateVerificationPDF = (result: VerificationResult, verifierName: string) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(24);
  doc.setTextColor(34, 139, 34); // Green
  doc.text('CREDENTIAL VERIFICATION CERTIFICATE', 105, 30, { align: 'center' });
  
  // Add border
  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(2);
  doc.rect(10, 10, 190, 277);
  
  // Add verification badge
  doc.setFontSize(16);
  doc.setTextColor(34, 139, 34);
  doc.text('✓ VERIFIED', 105, 50, { align: 'center' });
  
  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, 60, 190, 60);
  
  // Add credential details
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  let yPos = 75;
  const lineHeight = 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Verification ID:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(result.verificationId, 70, yPos);
  yPos += lineHeight;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Verified At:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(result.verifiedAt), 70, yPos);
  yPos += lineHeight;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Verified By:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(verifierName, 70, yPos);
  yPos += lineHeight + 5;
  
  // Credential Information section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Credential Information', 20, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Type:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(result.credentialType, 70, yPos);
  yPos += lineHeight;
  
  if (result.holderName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Holder:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(result.holderName, 70, yPos);
    yPos += lineHeight;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Issuer:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(result.issuer, 70, yPos);
  yPos += lineHeight;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Issued At:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(result.issuedAt), 70, yPos);
  yPos += lineHeight;
  
  if (result.expiresAt) {
    doc.setFont('helvetica', 'bold');
    doc.text('Expires At:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(result.expiresAt), 70, yPos);
    yPos += lineHeight;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Credential Hash:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(result.credentialHash, 20, yPos + 5, { maxWidth: 170 });
  yPos += lineHeight + 5;
  
  // Proof Chain section
  if (result.proofChain.length > 0) {
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Proof Chain', 20, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(10);
    result.proofChain.forEach((item, index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${item.issuer}`, 25, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`Type: ${item.credentialType}`, 30, yPos);
      yPos += 5;
      doc.text(`Issued: ${formatDateShort(item.issuedAt)}`, 30, yPos);
      yPos += lineHeight;
    });
  }
  
  // Add footer
  yPos = 270;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('This certificate was generated electronically and is valid without signature.', 105, yPos, {
    align: 'center',
  });
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, yPos + 5, {
    align: 'center',
  });
  
  // Save the PDF
  const filename = `verification-certificate-${result.verificationId}.pdf`;
  doc.save(filename);
};

// ============================================================================
// Main Component
// ============================================================================

const VerifyCredentialPage: React.FC<VerifyCredentialPageProps> = ({
  apiBaseUrl = '/api',
  verifierId,
  verifierName,
  onConsentRequest,
  className = '',
}) => {
  // State
  const [inputMethod, setInputMethod] = useState<'hash' | 'upload'>('hash');
  const [credentialHash, setCredentialHash] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofData, setProofData] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  // Handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setError('Please upload a valid JSON file');
        return;
      }
      
      setProofFile(file);
      setError(null);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = parseJSONProof(content);
          setProofData(parsed.proof);
          setCredentialHash(parsed.hash);
        } catch (err) {
          setError('Invalid JSON proof file');
          setProofFile(null);
        }
      };
      reader.readAsText(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentialHash && !proofData) {
      setError('Please provide a credential hash or upload a proof file');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    setResult(null);
    
    try {
      const payload: VerificationPayload = {
        verifierId,
      };
      
      if (inputMethod === 'hash') {
        payload.hash = credentialHash;
      } else {
        payload.proof = JSON.stringify(proofData);
        payload.hash = credentialHash;
      }
      
      const response = await fetch(`${apiBaseUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Verification failed');
      }
      
      const verificationResult: VerificationResult = await response.json();
      setResult(verificationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleReset = () => {
    setCredentialHash('');
    setProofFile(null);
    setProofData(null);
    setError(null);
    setResult(null);
  };
  
  const handleDownloadPDF = () => {
    if (result) {
      generateVerificationPDF(result, verifierName);
    }
  };
  
  const handleConsentRequest = () => {
    if (result && onConsentRequest) {
      onConsentRequest(result);
    }
  };
  
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Verify Credential</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Verify the authenticity and validity of a verifiable credential
          </p>
        </div>
      
        {/* Verification Form */}
        {!result && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-5">
            <form onSubmit={handleSubmit}>
              {/* Input Method Selection */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Method
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInputMethod('hash')}
                    className={`group relative flex-1 px-3 py-2.5 rounded-lg border-2 transition-colors ${
                      inputMethod === 'hash'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      <span className="text-sm font-medium">Credential Hash</span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                      Enter the unique credential hash for verification
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setInputMethod('upload')}
                    className={`group relative flex-1 px-3 py-2.5 rounded-lg border-2 transition-colors ${
                      inputMethod === 'upload'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-sm font-medium">Upload Proof File</span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                      Upload a JSON proof file containing credential data
                    </div>
                  </button>
                </div>
              </div>
            
              {/* Hash Input */}
              {inputMethod === 'hash' && (
                <div className="mb-5">
                  <label htmlFor="credential-hash" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Credential Hash
                  </label>
                  <textarea
                    id="credential-hash"
                    rows={3}
                    value={credentialHash}
                    onChange={(e) => setCredentialHash(e.target.value)}
                    placeholder="Paste the credential hash here..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono transition-colors"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the unique hash identifier for the credential you want to verify
                  </p>
                </div>
              )}
            
              {/* File Upload */}
              {inputMethod === 'upload' && (
                <div className="mb-5">
                  <label htmlFor="proof-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Proof File (JSON)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-5 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-700/50">
                    <input
                      id="proof-file"
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="proof-file"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <svg
                        className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      {proofFile ? (
                        <div>
                          <p className="text-sm font-medium text-primary-700 dark:text-primary-400">
                            {proofFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Click to change file
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            JSON proof file
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}
            
              {/* Error Message */}
              {error && (
                <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3" role="alert">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">Verification Error</h3>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            
              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isVerifying || (!credentialHash && !proofData)}
                  className="flex-1 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Verify Credential
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}
      
      {/* Verification Result */}
      {result && (
        <div className="space-y-4">
          {/* Status Card */}
          <div
            className={`card border-2 ${
              result.status === 'verified'
                ? 'border-success-300 bg-success-50'
                : result.status === 'consent_required'
                ? 'border-primary-300 bg-primary-50'
                : result.status === 'expired'
                ? 'border-warning-300 bg-warning-50'
                : 'border-danger-300 bg-danger-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`text-${getStatusColor(result.status)}-600 flex-shrink-0`}
              >
                {getStatusIcon(result.status)}
              </div>
              
              <div className="flex-1">
                <h2
                  className={`text-xl font-bold text-${getStatusColor(
                    result.status
                  )}-900 mb-1`}
                >
                  {result.status === 'verified'
                    ? 'Credential Verified'
                    : result.status === 'consent_required'
                    ? 'Consent Required'
                    : result.status === 'expired'
                    ? 'Credential Expired'
                    : result.status === 'revoked'
                    ? 'Credential Revoked'
                    : 'Verification Failed'}
                </h2>
                <p className={`text-sm text-${getStatusColor(result.status)}-800`}>
                  {result.message}
                </p>
              </div>
            </div>
          </div>
          
          {/* Verified Certificate Card (only for successful verification) */}
          {result.status === 'verified' && (
            <div className="card border-2 border-success-200 bg-gradient-to-br from-white to-success-50">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 mb-3">
                  <svg
                    className="w-10 h-10 text-success-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-success-900 mb-1">
                  Verification Certificate
                </h3>
                <p className="text-sm text-success-700">
                  This credential has been successfully verified
                </p>
              </div>
              
              <div className="border-t border-success-200 pt-4">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs font-medium text-neutral-600">Verification ID</dt>
                    <dd className="text-xs font-mono text-neutral-900 mt-0.5">
                      {result.verificationId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-neutral-600">Verified At</dt>
                    <dd className="text-xs text-neutral-900 mt-0.5">
                      {formatDate(result.verifiedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-neutral-600">Verified By</dt>
                    <dd className="text-xs text-neutral-900 mt-0.5">{verifierName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-neutral-600">Status</dt>
                    <dd className="mt-0.5">
                      <span className="badge-success text-xs">Valid & Verified</span>
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div className="mt-4 flex justify-center group relative">
                <button
                  onClick={handleDownloadPDF}
                  className="btn-primary flex items-center gap-2 text-sm py-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Download PDF Certificate
                </button>
                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none w-52 text-center">
                  Download an official PDF certificate with verification details and QR code for sharing
                </span>
              </div>
            </div>
          )}
          
          {/* Credential Details Card */}
          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              Credential Details
            </h3>
            
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <dt className="text-xs font-medium text-neutral-600">Credential Type</dt>
                <dd className="text-sm text-neutral-900 mt-0.5">{result.credentialType}</dd>
              </div>
              
              {result.holderName && (
                <div>
                  <dt className="text-xs font-medium text-neutral-600">Holder</dt>
                  <dd className="text-sm text-neutral-900 mt-0.5">{result.holderName}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-xs font-medium text-neutral-600">Issuer</dt>
                <dd className="text-sm text-neutral-900 mt-0.5">{result.issuer}</dd>
              </div>
              
              <div>
                <dt className="text-xs font-medium text-neutral-600">Issued At</dt>
                <dd className="text-sm text-neutral-900 mt-0.5">
                  {formatDate(result.issuedAt)}
                </dd>
              </div>
              
              {result.expiresAt && (
                <div>
                  <dt className="text-xs font-medium text-neutral-600">Expires At</dt>
                  <dd className="text-sm text-neutral-900 mt-0.5">
                    {formatDate(result.expiresAt)}
                  </dd>
                </div>
              )}
              
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-neutral-600">Credential Hash</dt>
                <dd className="text-xs font-mono text-neutral-900 mt-0.5 break-all">
                  {result.credentialHash}
                </dd>
              </div>
            </dl>
          </div>
          
          {/* Proof Chain Card */}
          {result.proofChain.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Proof Chain
              </h3>
              <p className="text-xs text-neutral-600 mb-3">
                The credential's chain of trust through verified issuers
              </p>
              
              <div className="space-y-2">
                {result.proofChain.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-neutral-900">{item.issuer}</h4>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        Type: {item.credentialType}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Issued: {formatDate(item.issuedAt)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-success-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Consent Request Button */}
          {result.consentRequired && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-primary-600 dark:text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-primary-900 dark:text-primary-200 mb-1">
                    Additional Consent Required
                  </h3>
                  <p className="text-sm text-primary-800 dark:text-primary-300 mb-3">
                    The credential holder must grant explicit consent before you can access
                    full credential details.
                  </p>
                  <button
                    onClick={handleConsentRequest}
                    className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Request Consent
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 group relative">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-300 dark:border-gray-600 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Verify Another Credential
            </button>
            <span className="absolute bottom-full mb-2 left-0 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Start a new verification with a different credential
            </span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default VerifyCredentialPage;
