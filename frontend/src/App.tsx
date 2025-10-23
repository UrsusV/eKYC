import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '@components/Layout';
import Home from '@pages/Home';
import About from '@pages/About';
import CredentialsPage from '@pages/CredentialsPage';
import CredentialDetailPage from '@pages/CredentialDetailPage';
import IssuerDashboardPage from '@pages/IssuerDashboardPage';
import VerifyCredentialPage from '@pages/VerifyCredentialPage';
import VerificationPage from '@pages/VerificationPage';
import ProfilePage from '@pages/ProfilePage';
import SettingsPage from '@pages/SettingsPage';
import UsersManagementPage from '@pages/UsersManagementPage';
import AuditLogsPage from '@pages/AuditLogsPage';
import { ToastProvider } from '@/components/Toast';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Routes>
          <Route
            path="/"
            element={
              <Layout pageTitle="Dashboard">
                <Home />
              </Layout>
            }
          />
          <Route
            path="/about"
            element={
              <Layout pageTitle="About">
                <About />
              </Layout>
            }
          />
          <Route
            path="/credentials"
            element={
              <Layout pageTitle="My Credentials">
                <CredentialsPage />
              </Layout>
            }
          />
          <Route
            path="/credentials/:id"
            element={
              <Layout pageTitle="Credential Details">
                <CredentialDetailPage />
              </Layout>
            }
          />
          <Route
            path="/issuer"
            element={
              <Layout pageTitle="Issuer Dashboard">
                <IssuerDashboardPage />
              </Layout>
            }
          />
          <Route
            path="/verify"
            element={
              <Layout pageTitle="Verify Credential">
                <VerifyCredentialPage 
                  verifierId="verifier-org-001"
                  verifierName="e-KYC Verification Service"
                />
              </Layout>
            }
          />
          <Route
            path="/verification"
            element={
              <Layout pageTitle="Verification">
                <VerificationPage />
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout pageTitle="Your Profile">
                <ProfilePage />
              </Layout>
            }
          />
          <Route
            path="/settings"
            element={
              <Layout pageTitle="Settings">
                <SettingsPage />
              </Layout>
            }
          />
          <Route
            path="/users"
            element={
              <Layout pageTitle="User Management">
                <UsersManagementPage />
              </Layout>
            }
          />
          <Route
            path="/audit"
            element={
              <Layout pageTitle="Audit Logs">
                <AuditLogsPage />
              </Layout>
            }
          />
          
          {/* Add more routes as needed */}
        </Routes>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
