import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Award, Mail, Lock, User, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { handleApiError, validateEmail, validatePassword } from "@/utils";

const RegisterCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerCustomer } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    nid_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

    // NID validation
    if (!formData.nid_number) {
      errors.nid_number = "NID number is required";
    } else if (!/^\d{10}$|^\d{13}$|^\d{17}$/.test(formData.nid_number)) {
      errors.nid_number = "NID number must be 10, 13, or 17 digits";
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
      const { confirmPassword, firstName, lastName, ...rest } = formData;
      const registrationData = {
        ...rest,
        name: `${firstName} ${lastName}`.trim(),
      };
      await registerCustomer(registrationData);
      navigate("/dashboard");
    } catch (err) {
      setError(handleApiError(err));
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
            Create Customer Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Register to submit KYC requests and manage your credentials
          </p>
        </div>

        <div className="card">
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
                placeholder="you@example.com"
                required
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* First Name */}
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

            {/* Last Name */}
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

            {/* NID Number */}
            <div>
              <label className="label">
                <User className="h-4 w-4 inline mr-2" />
                NID Number *
              </label>
              <input
                type="text"
                value={formData.nid_number}
                onChange={handleChange("nid_number")}
                className={`input ${
                  fieldErrors.nid_number ? "border-red-500" : ""
                }`}
                placeholder="1234567890"
                required
              />
              {fieldErrors.nid_number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.nid_number}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                10, 13, or 17 digit National ID number
              </p>
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
                "Create Account"
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
              Are you a bank officer?{" "}
              <Link
                to="/register/bank-officer"
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

export default RegisterCustomerPage;
