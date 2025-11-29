// User Types
export interface User {
  _id: string;
  email: string;
  role: "customer" | "bank_officer" | "admin";
  personalInfo: {
    fullName: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: "male" | "female" | "other";
    nationality?: string;
    nid?: string;
    passport?: string;
  };
  contactInfo: {
    phoneNumber: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  bankOfficerInfo?: {
    bankId: string;
    officerIdNumber: string;
    branch?: string;
  };
  walletAddress?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCustomerRequest {
  email: string;
  password: string;
  name: string;
  nid_number: string;
}

export interface RegisterBankOfficerRequest {
  email: string;
  password: string;
  name: string;
  bank_id: string;
  officer_id: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// KYC Types
export interface KycRequest {
  _id: string;
  requestId: string;
  userId: string;
  bankId?: string;
  requestType: "new" | "update" | "renewal" | "upgrade";
  kycLevel: number;
  status:
    | "draft"
    | "submitted"
    | "pending"
    | "under_review"
    | "approved"
    | "rejected"
    | "expired"
    | "cancelled";
  documentType: "passport" | "national_id" | "drivers_license";
  documentNumber: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  documents: Array<{
    documentId: string;
    documentType: string;
    status: "pending" | "verified" | "rejected";
  }>;
  verificationChecks?: {
    nidVerification?: { status: string; verifiedAt?: string; remarks?: string };
    faceMatch?: {
      status: string;
      confidenceScore?: number;
      verifiedAt?: string;
    };
    addressVerification?: {
      status: string;
      method?: string;
      verifiedAt?: string;
    };
  };
  blockchain?: {
    credentialHash?: string;
    transactionHash?: string;
    blockNumber?: number;
    issuedOnChain?: boolean;
    issuedAt?: string;
  };
  workflow?: {
    submittedAt?: string;
    reviewStartedAt?: string;
    approvedAt?: string;
    rejectedAt?: string;
    assignedTo?: string;
    reviewedBy?: string;
    approvedBy?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SubmitKycRequest {
  documentType: "passport" | "national_id" | "drivers_license";
  documentNumber: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  documentFrontImage: string; // base64
  documentBackImage: string; // base64
  selfieImage: string; // base64
}

// Credential Types
export interface Credential {
  _id: string;
  credentialId: string;
  userId: string;
  kycRequestId: string;
  bankId: string;
  issuedBy: string;
  credentialType:
    | "identity_verification"
    | "address_verification"
    | "document_verification";
  blockchain: {
    credentialHash: string;
    transactionHash: string;
    blockNumber: number;
    holderAddress: string;
    issuerAddress: string;
    blockchainCredentialId: string;
    networkId: string;
    gasUsed: string;
  };
  status: "pending" | "active" | "revoked" | "expired" | "suspended";
  issuedAt: string;
  expiresAt: string;
  revocation?: {
    isRevoked: boolean;
    revokedAt?: string;
    revokedBy?: string;
    revocationReason?: string;
    revocationDetails?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Consent Types
export interface Consent {
  _id: string;
  consentId: string;
  userId: string;
  kycRequestId?: string;
  consentType:
    | "data_collection"
    | "data_processing"
    | "data_sharing"
    | "blockchain_storage"
    | "biometric_collection"
    | "all";
  status: "pending" | "granted" | "denied" | "revoked" | "expired";
  purpose: string;
  consentText: string;
  duration?: number;
  dataCategories: string[];
  thirdParties?: string[];
  isMandatory: boolean;
  canBeWithdrawn: boolean;
  grantedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Bank Types
export interface Bank {
  _id: string;
  bankName: string;
  bankCode: string;
  swiftCode?: string;
  routingNumber?: string;
  licenseNumber?: string;
  bankType: "private_commercial" | "state_owned" | "foreign";
  isActive: boolean;
  status: "active" | "suspended" | "inactive";
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Verification Types
export interface VerificationRequest {
  hash: string;
  verifierId?: string;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  credential?: Credential;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Issue Credential
export interface IssueCredentialRequest {
  requestId: string;
  credentialType:
    | "identity_verification"
    | "address_verification"
    | "document_verification";
  expiryDate: string;
}
