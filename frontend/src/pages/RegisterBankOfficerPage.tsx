import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building,
  Award,
  FileText,
  Mail,
  Lock,
  User,
  AlertCircle,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { handleApiError, validateEmail, validatePassword } from "@/utils";
import { apiClient } from "@/services/apiClient";

interface Bank {
  id: string;
  name: string;
  code: string;
  type: string;
}

const RegisterBankOfficerPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerBankOfficer } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    bank_id: "",
    officer_id: "",
    branch: "",
  });
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch available banks on component mount
  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true);
      try {
        const response = await apiClient.get<Bank[]>("/auth/banks");
        if (response.success && response.data) {
          setBanks(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch banks:", err);
        setError("Failed to load banks. Please refresh the page.");
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchBanks();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.errors[0];
      }
    }

    // Confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    // Bank officer specific validation
    if (!formData.bank_id.trim()) {
      errors.bank_id = "Please select a bank";
    }
    if (!formData.officer_id.trim()) {
      errors.officer_id = "Officer ID is required";
    } else if (!/^[a-zA-Z0-9]{3,50}$/.test(formData.officer_id)) {
      errors.officer_id = "Officer ID must be 3-50 alphanumeric characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, firstName, lastName, branch, ...rest } = formData;

      const registrationData = {
        email: rest.email,
        password: rest.password,
        bank_id: rest.bank_id,
        officer_id: rest.officer_id,
        name: `${firstName} ${lastName}`.trim(),
      };

      console.log("Sending registration data:", registrationData);

      await registerBankOfficer(registrationData);
      navigate("/officer/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      console.error("Error response data:", err?.response?.data);
      console.error("Error response status:", err?.response?.status);

      // Check if the error response contains field-specific errors
      if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const backendErrors: Record<string, string> = {};
        err.response.data.errors.forEach((error: any) => {
          if (error.field && error.message) {
            backendErrors[error.field] = error.message;
          }
        });

        if (Object.keys(backendErrors).length > 0) {
          setFieldErrors(backendErrors);
          setError("Please fix the validation errors below");
        } else {
          setError(handleApiError(err));
        }
      } else {
        setError(handleApiError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
      // Clear field error when user starts typing
      if (fieldErrors[field]) {
        setFieldErrors({ ...fieldErrors, [field]: "" });
      }
    };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Award className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bank Officer Registration
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Register to verify KYC requests and issue credentials
          </p>
        </div>

        <div className="card">
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              ⚠️ <strong>Note:</strong> Bank officer registration requires a
              bank to be created in the system first. Please contact your
              administrator or use customer registration instead.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">
                <Mail className="h-4 w-4 inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                className={`input ${fieldErrors.email ? "border-red-500" : ""}`}
                placeholder="officer@bank.com"
                required
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <User className="h-4 w-4 inline mr-2" />
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange("firstName")}
                  className={`input ${
                    fieldErrors.firstName ? "border-red-500" : ""
                  }`}
                  placeholder="John"
                  required
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  <User className="h-4 w-4 inline mr-2" />
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange("lastName")}
                  className={`input ${
                    fieldErrors.lastName ? "border-red-500" : ""
                  }`}
                  placeholder="Doe"
                  required
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Bank Selection */}
            <div>
              <label className="label">
                <Building className="h-4 w-4 inline mr-2" />
                Bank *
              </label>
              {loadingBanks ? (
                <div className="flex items-center justify-center py-2">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Loading banks...
                  </span>
                </div>
              ) : (
                <select
                  value={formData.bank_id}
                  onChange={handleChange("bank_id")}
                  className={`input ${
                    fieldErrors.bank_id ? "border-red-500" : ""
                  }`}
                  required
                >
                  <option value="">Select a bank</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} ({bank.code})
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.bank_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.bank_id}
                </p>
              )}
            </div>

            {/* Officer ID */}
            <div>
              <label className="label">
                <FileText className="h-4 w-4 inline mr-2" />
                Officer ID *
              </label>
              <input
                type="text"
                value={formData.officer_id}
                onChange={handleChange("officer_id")}
                className={`input ${
                  fieldErrors.officer_id ? "border-red-500" : ""
                }`}
                placeholder="OFF12345"
                required
              />
              {fieldErrors.officer_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.officer_id}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Alphanumeric only, 3-50 characters
              </p>
            </div>

            {/* Branch (Optional) */}
            <div>
              <label className="label">
                <Building className="h-4 w-4 inline mr-2" />
                Branch (Optional)
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={handleChange("branch")}
                className="input"
                placeholder="Dhaka Main Branch"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">
                <Lock className="h-4 w-4 inline mr-2" />
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={handleChange("password")}
                className={`input ${
                  fieldErrors.password ? "border-red-500" : ""
                }`}
                placeholder="••••••••"
                required
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.password}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Minimum 8 characters, including uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">
                <Lock className="h-4 w-4 inline mr-2" />
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                className={`input ${
                  fieldErrors.confirmPassword ? "border-red-500" : ""
                }`}
                placeholder="••••••••"
                required
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <LoadingSpinner
                  size="sm"
                  className="border-white border-t-transparent"
                />
              ) : (
                "Create Officer Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </Link>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you a customer?{" "}
              <Link
                to="/register/customer"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterBankOfficerPage;
