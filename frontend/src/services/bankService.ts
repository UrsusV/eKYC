import { apiClient } from "./apiClient";
import type {
  KycRequest,
  Credential,
  IssueCredentialRequest,
  ApiResponse,
  PaginationParams,
} from "@/types";

class BankService {
  async getKycRequests(
    params: PaginationParams = {}
  ): Promise<ApiResponse<KycRequest[]>> {
    const { page = 1, limit = 20, status = "all", search = "" } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
      ...(search && { search }),
    });

    return await apiClient.get<KycRequest[]>(
      `/bank/kyc-requests?${queryParams}`
    );
  }

  async getKycRequestDetails(requestId: string): Promise<KycRequest> {
    const response = await apiClient.get<KycRequest>(
      `/bank/kyc-request/${requestId}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to fetch KYC request");
  }

  async verifyKyc(
    requestId: string,
    action: "approve" | "reject",
    notes: string
  ): Promise<KycRequest> {
    const response = await apiClient.post<KycRequest>(
      `/bank/verify/${requestId}`,
      {
        action,
        verificationNotes: notes,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Verification failed");
  }

  async issueCredential(
    requestData: IssueCredentialRequest
  ): Promise<Credential> {
    const response = await apiClient.post<Credential>(
      "/bank/issue-credential",
      requestData
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Credential issuance failed");
  }

  async getIssuedCredentials(
    params: PaginationParams = {}
  ): Promise<ApiResponse<Credential[]>> {
    const { page = 1, limit = 10, status = "all" } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    });

    return await apiClient.get<Credential[]>(
      `/bank/credentials?${queryParams}`
    );
  }
}

export const bankService = new BankService();
