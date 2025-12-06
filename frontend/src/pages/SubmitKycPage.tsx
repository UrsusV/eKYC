import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  User,
  MapPin,
  Upload,
  Shield,
  CheckCircle,
} from "lucide-react";
import { kycService } from "@/services/kycService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { KycFormData, SubmitKycRequest, Credential } from "@/types";

type Step = 0 | 1 | 2 | 3 | 4;

export const SubmitKycPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Credential sharing state
  const [useExistingCredential, setUseExistingCredential] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  const [formData, setFormData] = useState<Partial<KycFormData>>({
    documentType: "national_id",
    documentNumber: "",
    fullName: "",
    dateOfBirth: "",
    nationality: "Bangladesh",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Bangladesh",
    },
    documentFrontImage: "",
    documentBackImage: "",
    selfieImage: "",
  });

  // Load user's credentials on component mount
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        setLoadingCredentials(true);
        const result = await kycService.getCredentials({ status: 'active' });
        setCredentials(result.data || []);
      } catch (error) {
        console.error('Failed to load credentials:', error);
      } finally {
        setLoadingCredentials(false);
      }
    };
    loadCredentials();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        street: prev.address?.street || "",
        city: prev.address?.city || "",
        state: prev.address?.state || "",
        zipCode: prev.address?.zipCode || "",
        country: prev.address?.country || "",
        [field]: value,
      },
    }));
    if (errors[`address.${field}`]) {
      setErrors((prev) => ({ ...prev, [`address.${field}`]: "" }));
    }
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.documentType)
        newErrors.documentType = "Document type is required";
      if (!formData.documentNumber) {
        newErrors.documentNumber = "Document number is required";
      } else {
        // Validate NID number format (must be 10, 13, or 17 digits)
        const nidPattern = /^\d{10}$|^\d{13}$|^\d{17}$/;
        if (!nidPattern.test(formData.documentNumber.trim())) {
          newErrors.documentNumber = "NID number must be exactly 10, 13, or 17 digits";
        }
      }
    } else if (step === 2) {
      if (!formData.fullName) newErrors.fullName = "Full name is required";
      if (!formData.dateOfBirth)
        newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.nationality)
        newErrors.nationality = "Nationality is required";
    } else if (step === 3) {
      if (!formData.address?.street)
        newErrors["address.street"] = "Street address is required";
      if (!formData.address?.city)
        newErrors["address.city"] = "City is required";
      if (!formData.address?.zipCode)
        newErrors["address.zipCode"] = "Zip code is required";

      // Validate address length (backend requires min 10 characters)
      if (formData.address) {
        const addressString = `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zipCode}, ${formData.address.country}`;
        if (addressString.length < 10) {
          newErrors["address.street"] = "Please provide a complete address (at least 10 characters)";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1) as Step);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      let submissionData: SubmitKycRequest;

      if (useExistingCredential && selectedCredential) {
        // Credential sharing submission
        submissionData = {
          useExistingCredential: true,
          sharedCredentialId: selectedCredential._id,
        };
      } else {
        // Traditional KYC submission
        if (!validateStep(currentStep)) {
          setLoading(false);
          return;
        }

        // Check if all images are uploaded
        if (
          !formData.documentFrontImage ||
          !formData.documentBackImage ||
          !formData.selfieImage
        ) {
          setErrors({
            submit:
              "Please upload all required images (document front, back, and selfie)",
          });
          setLoading(false);
          return;
        }

        // Transform form data to match backend API format
        const addressString = formData.address
          ? `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zipCode}, ${formData.address.country}`
          : '';

        // Validate address length (backend requires min 10 characters)
        if (addressString.length < 10) {
          setErrors({
            submit: "Address must be at least 10 characters long. Please provide a complete address.",
          });
          setLoading(false);
          return;
        }

        // Validate NID number format (must be 10, 13, or 17 digits)
        const nidNumber = formData.documentNumber?.trim() || '';
        const nidPattern = /^\d{10}$|^\d{13}$|^\d{17}$/;
        if (!nidPattern.test(nidNumber)) {
          setErrors({
            submit: "NID number must be exactly 10, 13, or 17 digits.",
          });
          setLoading(false);
          return;
        }

        submissionData = {
          useExistingCredential: false,
          nid_number: nidNumber,
          full_name: formData.fullName?.trim() || '',
          date_of_birth: formData.dateOfBirth || '',
          address: addressString.trim(),
        };
      }

      const result = await kycService.submitKyc(submissionData);
      console.log("KYC submitted successfully:", result);
      navigate("/kyc/status");
    } catch (error: any) {
      console.error("Failed to submit KYC:", error);

      // Handle validation errors from backend
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors: Record<string, string> = {};
        // Map backend field names (snake_case) to frontend field names (camelCase)
        const fieldMapping: Record<string, string> = {
          'nid_number': 'documentNumber',
          'full_name': 'fullName',
          'date_of_birth': 'dateOfBirth',
          'address': 'submit',
          'father_name': 'submit',
          'mother_name': 'submit',
          'phone': 'submit'
        };

        error.response.data.errors.forEach((err: { field: string; message: string }) => {
          const frontendField = fieldMapping[err.field] || err.field;
          if (frontendField === 'submit') {
            validationErrors.submit = validationErrors.submit
              ? `${validationErrors.submit}; ${err.message}`
              : err.message;
          } else {
            validationErrors[frontendField] = err.message;
          }
        });

        if (Object.keys(validationErrors).length === 0) {
          validationErrors.submit = error.response?.data?.message || "Validation failed";
        }

        setErrors(validationErrors);
      } else {
        setErrors({
          submit:
            error.response?.data?.message ||
            error.message ||
            "Failed to submit KYC request",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (
    field: "documentFrontImage" | "documentBackImage" | "selfieImage",
    file: File | null
  ) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    try {
      const base64 = await kycService.fileToBase64(file);
      setFormData((prev) => ({ ...prev, [field]: base64 }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    } catch (error) {
      console.error("Failed to convert file to base64:", error);
      setErrors((prev) => ({ ...prev, [field]: "Failed to process image" }));
    }
  };

  const renderStepIndicator = () => {
    if (currentStep === 0) return null;

    return (
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step <= currentStep
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  step < currentStep
                    ? "bg-primary-600"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 text-primary-600 mb-6">
        <Shield className="w-8 h-8" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Choose Verification Method
        </h2>
      </div>

      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Select how you want to verify your identity
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Use Existing Credential */}
        <button
          type="button"
          onClick={() => {
            setUseExistingCredential(true);
            setErrors({});
          }}
          className={`p-6 border-2 rounded-lg transition-all ${
            useExistingCredential
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <CheckCircle className={`w-12 h-12 mb-3 ${useExistingCredential ? 'text-primary-600' : 'text-gray-400'}`} />
            <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Use Existing Credential</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Reuse your verified credential from another bank
            </p>
          </div>
        </button>

        {/* Option 2: Upload New Documents */}
        <button
          type="button"
          onClick={() => {
            setUseExistingCredential(false);
            setSelectedCredential(null);
            setErrors({});
          }}
          className={`p-6 border-2 rounded-lg transition-all ${
            !useExistingCredential
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <Upload className={`w-12 h-12 mb-3 ${!useExistingCredential ? 'text-primary-600' : 'text-gray-400'}`} />
            <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Upload New Documents</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Submit new KYC documents for verification
            </p>
          </div>
        </button>
      </div>

      {/* Show credential selection if using existing */}
      {useExistingCredential && (
        <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Your Credential
          </label>

          {loadingCredentials ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400">No active credentials found.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                You need to complete a traditional KYC process first.
              </p>
            </div>
          ) : (
            <>
              <select
                value={selectedCredential?._id || ''}
                onChange={(e) => {
                  const cred = credentials.find(c => c._id === e.target.value);
                  setSelectedCredential(cred || null);
                  setErrors({});
                }}
                className="input w-full mb-4"
              >
                <option value="">-- Select a credential --</option>
                {credentials.map(cred => (
                  <option key={cred._id} value={cred._id}>
                    {cred.bank?.name || 'Unknown Bank'} - Issued on {new Date(cred.issuedAt).toLocaleDateString()}
                    {cred.isExpired ? ' (Expired)' : ''}
                  </option>
                ))}
              </select>

              {selectedCredential && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h5 className="font-semibold mb-3 text-gray-900 dark:text-white">Credential Details:</h5>
                  <div className="space-y-2 text-sm">
                    <p><strong className="text-gray-700 dark:text-gray-300">ID:</strong> <span className="text-gray-600 dark:text-gray-400">{selectedCredential.credentialId}</span></p>
                    <p><strong className="text-gray-700 dark:text-gray-300">Issuing Bank:</strong> <span className="text-gray-600 dark:text-gray-400">{selectedCredential.bank?.name || 'N/A'}</span></p>
                    <p><strong className="text-gray-700 dark:text-gray-300">Issued:</strong> <span className="text-gray-600 dark:text-gray-400">{new Date(selectedCredential.issuedAt).toLocaleDateString()}</span></p>
                    <p><strong className="text-gray-700 dark:text-gray-300">Expires:</strong> <span className="text-gray-600 dark:text-gray-400">{new Date(selectedCredential.expiresAt).toLocaleDateString()}</span></p>
                    <p>
                      <strong className="text-gray-700 dark:text-gray-300">Status:</strong>{' '}
                      <span className={selectedCredential.isValid ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {selectedCredential.isValid ? '✓ Valid' : '✗ Invalid'}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (useExistingCredential && !selectedCredential) {
              setErrors({ submit: 'Please select a credential' });
              return;
            }
            if (useExistingCredential && credentials.length === 0) {
              setErrors({ submit: 'No credentials available. Please use the traditional KYC process.' });
              return;
            }
            setCurrentStep(useExistingCredential ? 4 : 1);
          }}
          className="btn-primary px-8 py-3 flex items-center space-x-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 text-primary-600 mb-6">
        <FileText className="w-8 h-8" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Document Information
        </h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Document Type *
        </label>
        <select
          value={formData.documentType}
          onChange={(e) => handleInputChange("documentType", e.target.value)}
          className="input w-full"
        >
          <option value="national_id">National ID</option>
          <option value="passport">Passport</option>
          <option value="drivers_license">Driver's License</option>
        </select>
        {errors.documentType && (
          <p className="text-red-500 text-sm mt-1">{errors.documentType}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Document Number *
        </label>
        <input
          type="text"
          value={formData.documentNumber}
          onChange={(e) => handleInputChange("documentNumber", e.target.value)}
          className="input w-full"
          placeholder="Enter your document number"
        />
        {errors.documentNumber && (
          <p className="text-red-500 text-sm mt-1">{errors.documentNumber}</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 text-primary-600 mb-6">
        <User className="w-8 h-8" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Personal Information
        </h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => handleInputChange("fullName", e.target.value)}
          className="input w-full"
          placeholder="As shown on document"
        />
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date of Birth *
        </label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
          className="input w-full"
        />
        {errors.dateOfBirth && (
          <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nationality *
        </label>
        <input
          type="text"
          value={formData.nationality}
          onChange={(e) => handleInputChange("nationality", e.target.value)}
          className="input w-full"
        />
        {errors.nationality && (
          <p className="text-red-500 text-sm mt-1">{errors.nationality}</p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 text-primary-600 mb-6">
        <MapPin className="w-8 h-8" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Address Information
        </h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Street Address *
        </label>
        <input
          type="text"
          value={formData.address?.street || ""}
          onChange={(e) => handleAddressChange("street", e.target.value)}
          className="input w-full"
          placeholder="Street address"
        />
        {errors["address.street"] && (
          <p className="text-red-500 text-sm mt-1">
            {errors["address.street"]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.address?.city || ""}
            onChange={(e) => handleAddressChange("city", e.target.value)}
            className="input w-full"
          />
          {errors["address.city"] && (
            <p className="text-red-500 text-sm mt-1">
              {errors["address.city"]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            State/Province
          </label>
          <input
            type="text"
            value={formData.address?.state || ""}
            onChange={(e) => handleAddressChange("state", e.target.value)}
            className="input w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Zip Code *
          </label>
          <input
            type="text"
            value={formData.address?.zipCode || ""}
            onChange={(e) => handleAddressChange("zipCode", e.target.value)}
            className="input w-full"
          />
          {errors["address.zipCode"] && (
            <p className="text-red-500 text-sm mt-1">
              {errors["address.zipCode"]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Country
          </label>
          <input
            type="text"
            value={formData.address?.country || ""}
            onChange={(e) => handleAddressChange("country", e.target.value)}
            className="input w-full"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    // If using existing credential, show confirmation instead of upload
    if (useExistingCredential && selectedCredential) {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 text-primary-600 mb-6">
            <CheckCircle className="w-8 h-8" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Review & Confirm
            </h2>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
              Using Existing Credential
            </h3>

            <div className="space-y-3 text-sm">
              <p className="text-green-800 dark:text-green-200">
                <strong>Credential ID:</strong> {selectedCredential.credentialId}
              </p>
              <p className="text-green-800 dark:text-green-200">
                <strong>Issued by:</strong> {selectedCredential.bank?.name || 'Unknown Bank'}
              </p>
              <p className="text-green-800 dark:text-green-200">
                <strong>Issued on:</strong> {new Date(selectedCredential.issuedAt).toLocaleDateString()}
              </p>
              <p className="text-green-800 dark:text-green-200">
                <strong>Status:</strong>{' '}
                <span className={selectedCredential.isValid ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {selectedCredential.isValid ? '✓ Valid' : '✗ Invalid'}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Consent Notice
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              By submitting this request, you consent to share your verified credential with the selected bank for KYC verification purposes. The bank will be able to verify your identity using your existing credential and check its revocation status on the blockchain.
            </p>
          </div>

          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-400">{errors.submit}</p>
            </div>
          )}
        </div>
      );
    }

    // Traditional upload flow
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 text-primary-600 mb-6">
          <Upload className="w-8 h-8" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upload Documents
          </h2>
        </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document Front Image *
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleFileChange(
                "documentFrontImage",
                e.target.files?.[0] || null
              )
            }
            className="input w-full"
          />
          {formData.documentFrontImage && (
            <p className="text-green-600 text-sm mt-1">✓ Image uploaded</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document Back Image *
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleFileChange("documentBackImage", e.target.files?.[0] || null)
            }
            className="input w-full"
          />
          {formData.documentBackImage && (
            <p className="text-green-600 text-sm mt-1">✓ Image uploaded</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selfie Image *
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleFileChange("selfieImage", e.target.files?.[0] || null)
            }
            className="input w-full"
          />
          {formData.selfieImage && (
            <p className="text-green-600 text-sm mt-1">✓ Image uploaded</p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
          Summary
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Document Type:</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">
              {formData.documentType?.replace("_", " ")}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Document Number:</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formData.documentNumber}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Full Name:</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formData.fullName}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Date of Birth:</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formData.dateOfBirth}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600 dark:text-gray-400">Address:</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formData.address?.street}, {formData.address?.city},{" "}
              {formData.address?.state} {formData.address?.zipCode},{" "}
              {formData.address?.country}
            </p>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{errors.submit}</p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-blue-800 dark:text-blue-400 text-sm">
          By submitting this form, you confirm that all information provided is
          accurate and complete. Your KYC request will be reviewed by our
          verification team.
        </p>
      </div>
    </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Submit KYC Request
        </h1>

        {renderStepIndicator()}

        <form onSubmit={handleSubmit}>
          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {currentStep > 0 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-secondary flex items-center space-x-2"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="btn btn-secondary flex items-center space-x-2"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  <span>{loading ? "Submitting..." : "Submit KYC Request"}</span>
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SubmitKycPage;
