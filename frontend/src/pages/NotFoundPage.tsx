import React from "react";
import { Link } from "react-router-dom";
import { Home, LogIn } from "lucide-react";

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">
            404
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            Session Expired
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            For security purposes, please re-login to continue.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login" className="btn btn-primary inline-flex items-center justify-center">
            <LogIn className="w-4 h-4 mr-2" />
            Re-login
          </Link>
          <Link to="/" className="btn btn-secondary inline-flex items-center justify-center">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
