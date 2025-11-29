import { apiClient } from "./apiClient";
import type {
  KycRequest,
  SubmitKycRequest,
  Credential,
  ApiResponse,
  PaginationParams,
} from "@/types";

class KycService {
  async submitKyc(kycData: SubmitKycRequest): Promise<KycRequest> {
    const response = await apiClient.post<KycRequest>("/kyc/submit", kycData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "KYC submission failed");
  }

  async getKycStatus(requestId: string): Promise<KycRequest> {
    const response = await apiClient.get<KycRequest>(
      `/kyc/status/${requestId}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to fetch KYC status");
  }

  async getKycHistory(
    params: PaginationParams = {}
  ): Promise<ApiResponse<KycRequest[]>> {
    const { page = 1, limit = 10, status = "all" } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    });

    return await apiClient.get<KycRequest[]>(`/kyc/history?${queryParams}`);
  }

  async getCredentials(
    params: PaginationParams = {}
  ): Promise<ApiResponse<Credential[]>> {
    const { page = 1, limit = 10, status = "all" } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    });

    return await apiClient.get<Credential[]>(`/kyc/credentials?${queryParams}`);
  }

  // Helper: Convert File to Base64
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const kycService = new KycService();
