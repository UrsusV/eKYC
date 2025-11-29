import React from "react";
import { Link } from "react-router-dom";
import { Shield, Award, Lock, CheckCircle } from "lucide-react";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <Award className="h-20 w-20 text-primary-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            eKYC System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Blockchain-based Digital Identity Verification Platform
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/login" className="btn btn-primary px-8 py-3 text-lg">
              Login
            </Link>
            <Link
              to="/register/customer"
              className="btn btn-outline px-8 py-3 text-lg"
            >
              Register as Customer
            </Link>
            <Link
              to="/register/bank-officer"
              className="btn btn-secondary px-8 py-3 text-lg"
            >
              Register as Bank Officer
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="card text-center">
            <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure Verification</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Blockchain-backed identity verification with cryptographic
              security
            </p>
          </div>
          <div className="card text-center">
            <Lock className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">GDPR Compliant</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Full consent management and data privacy protection
            </p>
          </div>
          <div className="card text-center">
            <CheckCircle className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Instant Credentials</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Receive immutable, verifiable digital credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
