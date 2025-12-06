import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Dashboard Redirect Component
const DashboardRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "bank_officer") {
    return <Navigate to="/officer/dashboard" replace />;
  }

  return (
    <Layout>
      <DashboardPage />
    </Layout>
  );
};

// Pages
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import {
  RegisterCustomerPage,
  RegisterBankOfficerPage,
  DashboardPage,
  SubmitKycPage,
  KycStatusPage,
  KycHistoryPage,
  CredentialsPage,
  CredentialDetailPage,
  ConsentsPage,
  ProfilePage,
  OfficerDashboardPage,
  KycQueuePage,
  ReviewKycPage,
  CredentialManagementPage,
} from "@/pages";

// Components
import Layout from "@/components/Layout";
import PrivateRoute from "@/components/PrivateRoute";
import LoadingSpinner from "@/components/LoadingSpinner";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/customer" element={<RegisterCustomerPage />} />
      <Route
        path="/register/bank-officer"
        element={<RegisterBankOfficerPage />}
      />

      {/* Protected Routes - All Users */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardRedirect />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Protected Routes - Customer */}
      <Route
        path="/kyc/submit"
        element={
          <PrivateRoute allowedRoles={["customer"]}>
            <Layout>
              <SubmitKycPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/kyc/status/:requestId"
        element={
          <PrivateRoute allowedRoles={["customer"]}>
            <Layout>
              <KycStatusPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/kyc/history"
        element={
          <PrivateRoute allowedRoles={["customer"]}>
            <Layout>
              <KycHistoryPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/credentials"
        element={
          <PrivateRoute allowedRoles={["customer"]}>
            <Layout>
              <CredentialsPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/credentials/:credentialId"
        element={
          <PrivateRoute allowedRoles={["customer"]}>
            <Layout>
              <CredentialDetailPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/consents"
        element={
          <PrivateRoute allowedRoles={["customer"]}>
            <Layout>
              <ConsentsPage />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Protected Routes - Bank Officer */}
      <Route
        path="/officer/dashboard"
        element={
          <PrivateRoute allowedRoles={["bank_officer"]}>
            <Layout>
              <OfficerDashboardPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/officer/kyc-requests"
        element={
          <PrivateRoute allowedRoles={["bank_officer"]}>
            <Layout>
              <KycQueuePage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/officer/kyc-request/:id"
        element={
          <PrivateRoute allowedRoles={["bank_officer"]}>
            <Layout>
              <ReviewKycPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/officer/credentials"
        element={
          <PrivateRoute allowedRoles={["bank_officer"]}>
            <Layout>
              <CredentialManagementPage />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* 404 - Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
