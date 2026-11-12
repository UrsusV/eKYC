import { apiClient } from "./apiClient";
import { unwrapData } from "./serviceHelpers";
import type {
  KycRequest,
  Credential,
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

    return unwrapData(response, "Failed to fetch KYC request");
  }

  async verifyKyc(
    requestId: string,
    action: "approve" | "reject",
    notes: string,
    rejectionCategory?: string
  ): Promise<KycRequest> {
    const response = await apiClient.post<KycRequest>(
      `/bank/verify/${requestId}`,
      {
        approved: action === "approve",
        comments: notes,
        ...(rejectionCategory && { rejectionCategory }),
      }
    );

    return unwrapData(response, "Verification failed");
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

  async revokeCredential(
    credentialId: string,
    reason: string,
    details?: string
  ): Promise<Credential> {
    const response = await apiClient.post<Credential>(
      `/credentials/${credentialId}/revoke`,
      {
        reason,
        ...(details && { details }),
      }
    );

    return unwrapData(response, "Credential revocation failed");
  }
}

export const bankService = new BankService();
