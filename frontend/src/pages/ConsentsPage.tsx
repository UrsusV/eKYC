import React from "react";

export const ConsentsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Consent Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your data sharing consents and permissions.
        </p>
      </div>

      <div className="card text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Consents are automatically managed during KYC submission
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your consent preferences are collected as part of the KYC process.
        </p>
      </div>
    </div>
  );
};

export default ConsentsPage;
