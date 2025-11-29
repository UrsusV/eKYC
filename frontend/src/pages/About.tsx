import React from 'react';
import { Shield, Zap, Lock, Globe, CheckCircle2, Code2 } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              About e-KYC System
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              A comprehensive digital identity verification system for Bangladesh, built with modern web technologies and security best practices.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mission Statement */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
          </div>
          <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            To provide a secure, efficient, and user-friendly digital identity verification platform that empowers citizens
            and organizations in Bangladesh with seamless credential management while ensuring privacy and data protection.
          </p>
        </div>

        {/* Key Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all relative">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Secure Credentials
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                End-to-end encryption with cryptographic hashes ensures your credentials are protected and tamper-proof.
              </p>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <div className="font-semibold mb-1">AES-256 Encryption</div>
                All credentials are encrypted using military-grade AES-256 encryption with SHA-256 hashing for integrity verification.
              </div>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all relative">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Instant Verification
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time credential verification using advanced blockchain technology for immediate authenticity checks.
              </p>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <div className="font-semibold mb-1">Sub-2 Second Response</div>
                Our distributed verification network validates credentials in under 2 seconds with 99.9% accuracy.
              </div>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all relative">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Privacy Control
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Granular consent management gives you complete control over who can access your credentials.
              </p>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <div className="font-semibold mb-1">Zero-Knowledge Proofs</div>
                Share only what's necessary using selective disclosure - verifiers see only the data you explicitly authorize.
              </div>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all relative">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3">
                <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Nationwide Coverage
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Integrated with Bangladesh government systems for seamless NID and eTIN verification.
              </p>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <div className="font-semibold mb-1">Government Integration</div>
                Direct API connections to EC, NBR, and other agencies enable real-time validation of official documents.
              </div>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all relative">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Audit Trail
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Immutable audit logs provide complete transparency of all credential activities and access.
              </p>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <div className="font-semibold mb-1">Blockchain Ledger</div>
                Every credential interaction is recorded on an immutable blockchain ledger with timestamped entries.
              </div>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all relative">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center mb-3">
                <Code2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Developer Friendly
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comprehensive APIs and SDKs for easy integration with existing systems and applications.
              </p>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <div className="font-semibold mb-1">RESTful API & SDKs</div>
                OpenAPI documentation, client libraries for Python/JS/Java, webhooks, and sandbox environment included.
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Frontend
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">React 18</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">TypeScript</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Vite</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Tailwind CSS</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">React Router</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Infrastructure
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Blockchain</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">E2E Encryption</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">REST API</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">MSW</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Testing
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">Jest</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">RTL</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">Storybook</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">GitHub Actions</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Best Practices
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">Strict Mode</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">Responsive</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">Dark Mode</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">A11y</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Benefits */}
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 border border-primary-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Why Choose e-KYC?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center group relative">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">99.9%</div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime Reliability</div>
              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <div className="font-semibold mb-1">Enterprise SLA</div>
                Guaranteed 99.9% uptime with redundant infrastructure, load balancing, and 24/7 monitoring.
              </div>
            </div>
            <div className="text-center group relative">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">&lt;2s</div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Verification Time</div>
              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <div className="font-semibold mb-1">Lightning Fast</div>
                Optimized verification pipeline with caching and parallel processing for sub-2 second response times.
              </div>
            </div>
            <div className="text-center group relative">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">256-bit</div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">AES Encryption</div>
              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <div className="font-semibold mb-1">Military-Grade Security</div>
                All data encrypted with AES-256, the same standard used by governments and financial institutions worldwide.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
