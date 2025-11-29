import React from "react";
import { useAuth } from "@/contexts/AuthContext";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Profile
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account information and settings.
        </p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Personal Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="input w-full bg-gray-100 dark:bg-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={user.personalInfo?.firstName || ""}
                disabled
                className="input w-full bg-gray-100 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={user.personalInfo?.lastName || ""}
                disabled
                className="input w-full bg-gray-100 dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={user.contactInfo?.phoneNumber || ""}
              disabled
              className="input w-full bg-gray-100 dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <input
              type="text"
              value={user.role}
              disabled
              className="input w-full bg-gray-100 dark:bg-gray-800 capitalize"
            />
          </div>

          {user.walletAddress && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wallet Address
              </label>
              <input
                type="text"
                value={user.walletAddress}
                disabled
                className="input w-full bg-gray-100 dark:bg-gray-800 font-mono text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {user.bankOfficerInfo && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Bank Officer Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Officer ID
              </label>
              <input
                type="text"
                value={user.bankOfficerInfo.officerIdNumber}
                disabled
                className="input w-full bg-gray-100 dark:bg-gray-800"
              />
            </div>
            {user.bankOfficerInfo.branch && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={user.bankOfficerInfo.branch}
                  disabled
                  className="input w-full bg-gray-100 dark:bg-gray-800"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Account Status
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Account Status
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {user.isActive ? "Active" : "Inactive"}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              user.isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {user.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
