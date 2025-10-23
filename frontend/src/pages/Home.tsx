import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, Search, BarChart3 } from 'lucide-react';
import { QuickVerifyWidget } from '../components/ui/QuickVerifyWidget';

const Home: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section - More compact */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900 px-4 sm:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              Welcome to e-KYC System
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              Secure digital identity verification for Bangladesh
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/credentials" 
                className="group inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <Shield className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                View My Credentials
              </Link>
              <Link 
                to="/about" 
                className="group inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Learn More
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Section - NEW */}
      <div className="px-4 sm:px-6 py-8 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400">99.9%</div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">&lt;2s</div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Verification</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">256-bit</div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Encryption</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Verification Widget Section */}
      <div className="px-4 sm:px-6 py-10 md:py-12 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-3xl mx-auto">
          <QuickVerifyWidget />
        </div>
      </div>

      {/* Features Section - More compact with tooltips */}
      <div className="px-4 sm:px-6 py-10 md:py-12 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Key Features
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Everything you need for secure digital identity management
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature 1 */}
            <div className="group bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Secure Credentials
                    </h3>
                    <div className="group/tooltip relative">
                      <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                        Military-grade AES-256 encryption protects all your credentials. Blockchain-based verification ensures tamper-proof storage.
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    NID, eTIN, and other credentials with end-to-end encryption and blockchain verification
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Consent Management
                    </h3>
                    <div className="group/tooltip relative">
                      <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                        Set time-limited access, specify which data can be viewed, and revoke permissions instantly. Full audit trail included.
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Granular access control with time limits and instant revocation
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Instant Verification
                    </h3>
                    <div className="group/tooltip relative">
                      <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                        Real-time validation using cryptographic hashes. QR code scanning supported. Average verification time under 2 seconds.
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Cryptographic validation with QR codes and real-time status checks
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Complete Audit Trail
                    </h3>
                    <div className="group/tooltip relative">
                      <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                        Immutable blockchain records of all activities. See who accessed what, when, and why. Export audit reports anytime.
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Immutable logs of all activities with full transparency and exportable reports
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-8 text-center">
            <Link 
              to="/verify" 
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Search className="w-4 h-4 mr-2" />
              Verify a Credential Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
