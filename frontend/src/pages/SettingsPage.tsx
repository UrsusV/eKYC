import React, { useState } from 'react';

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    publicProfile: boolean;
    showEmail: boolean;
    shareAnalytics: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      publicProfile: false,
      showEmail: false,
      shareAnalytics: true,
    },
    appearance: {
      theme: 'system',
      language: 'en',
    },
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleNotificationChange = (key: keyof Settings['notifications']) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    });
    setHasChanges(true);
  };

  const handlePrivacyChange = (key: keyof Settings['privacy']) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: !settings.privacy[key],
      },
    });
    setHasChanges(true);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings({
      ...settings,
      appearance: { ...settings.appearance, theme },
    });
    setHasChanges(true);

    // Apply theme immediately
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  };

  const handleLanguageChange = (language: string) => {
    setSettings({
      ...settings,
      appearance: { ...settings.appearance, language },
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    // TODO: API call to save settings
    console.log('Saving settings:', settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    // Reset to default settings
    setSettings({
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      privacy: {
        publicProfile: false,
        showEmail: false,
        shareAnalytics: true,
      },
      appearance: {
        theme: 'system',
        language: 'en',
      },
    });
    setHasChanges(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage your account preferences
              </p>
            </div>
            {hasChanges && (
              <div className="flex gap-2">
                <button 
                  onClick={handleReset} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Reset
                </button>
                <button 
                  onClick={handleSave} 
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">

          {/* Notifications Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Section Header with Background */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                Notifications
              </h2>
            </div>
            
            {/* Compact Settings List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* Email Notifications */}
              <div className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer" htmlFor="email-notifications">
                        Email Notifications
                      </label>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                          Receive email updates about credential issuance, verification requests, and important account activities
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Updates about credentials and account activity
                    </p>
                  </div>
                  <button
                    id="email-notifications"
                    onClick={() => handleNotificationChange('email')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-shrink-0 ${
                      settings.notifications.email ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={settings.notifications.email}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer" htmlFor="push-notifications">
                        Push Notifications
                      </label>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                          Real-time browser notifications for immediate alerts on your desktop or mobile device
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Real-time browser alerts on your devices
                    </p>
                  </div>
                  <button
                    id="push-notifications"
                    onClick={() => handleNotificationChange('push')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-shrink-0 ${
                      settings.notifications.push ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={settings.notifications.push}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        settings.notifications.push ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer" htmlFor="sms-notifications">
                        SMS Notifications
                      </label>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                          Text messages for critical security alerts and verification requests (standard SMS rates may apply)
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Text messages for important updates
                    </p>
                  </div>
                  <button
                    id="sms-notifications"
                    onClick={() => handleNotificationChange('sms')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-shrink-0 ${
                      settings.notifications.sms ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={settings.notifications.sms}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        settings.notifications.sms ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Security Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Section Header with Background */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-green-600 dark:text-green-400"
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
                Privacy & Security
              </h2>
            </div>
            
            {/* Compact Settings List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* Public Profile */}
              <div className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer" htmlFor="public-profile">
                        Public Profile
                      </label>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                          When enabled, other users can view your basic profile information including name and public credentials
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Allow others to view your profile information
                    </p>
                  </div>
                  <button
                    id="public-profile"
                    onClick={() => handlePrivacyChange('publicProfile')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-shrink-0 ${
                      settings.privacy.publicProfile ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={settings.privacy.publicProfile}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        settings.privacy.publicProfile ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Show Email */}
              <div className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer" htmlFor="show-email">
                        Show Email Address
                      </label>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                          Display your email address on your public profile. Only visible if "Public Profile" is enabled
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Display your email on your public profile
                    </p>
                  </div>
                  <button
                    id="show-email"
                    onClick={() => handlePrivacyChange('showEmail')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-shrink-0 ${
                      settings.privacy.showEmail ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={settings.privacy.showEmail}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        settings.privacy.showEmail ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Share Analytics */}
              <div className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer" htmlFor="share-analytics">
                        Share Analytics Data
                      </label>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                          Help us improve the platform by sharing anonymous usage statistics. No personal information or credential data is collected. You can opt out anytime.
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Help improve the app with anonymous usage data
                    </p>
                  </div>
                  <button
                    id="share-analytics"
                    onClick={() => handlePrivacyChange('shareAnalytics')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-shrink-0 ${
                      settings.privacy.shareAnalytics ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={settings.privacy.shareAnalytics}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        settings.privacy.shareAnalytics ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Section Header with Background */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                Appearance
              </h2>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Theme Preference
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handleThemeChange(theme)}
                      className={`relative py-3 px-4 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        settings.appearance.theme === theme
                          ? 'border-primary-600 bg-primary-600 text-white shadow-md'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-400'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {theme === 'light' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                        {theme === 'dark' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        )}
                        {theme === 'system' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                        <span className="text-xs font-medium">
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </span>
                        {settings.appearance.theme === theme && (
                          <svg className="w-4 h-4 absolute top-2 right-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  System theme automatically adjusts based on your device preferences
                </p>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2" htmlFor="language-select">
                  Language
                </label>
                <select
                  id="language-select"
                  value={settings.appearance.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-red-200 dark:border-red-900/50 overflow-hidden">
            {/* Section Header with Background */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-b border-red-200 dark:border-red-900/50 px-5 py-3">
              <h2 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Danger Zone
              </h2>
            </div>
            
            <div className="p-5">
              <button 
                className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    console.log('Account deletion confirmed');
                  }
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Account
              </button>
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                Permanently delete your account and all associated data. This action cannot be undone and you will lose access to all your credentials.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
