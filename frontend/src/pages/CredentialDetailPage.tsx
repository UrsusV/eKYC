import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

export const CredentialDetailPage: React.FC = () => {
  const { credentialId } = useParams<{ credentialId: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/credentials" className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Credentials
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Credential Details
        </h1>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-4 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
            <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Blockchain Credential
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              ID: {credentialId}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-400 text-sm">
            Detailed credential view will be implemented with blockchain
            verification details, issuer information, and complete credential
            data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CredentialDetailPage;
