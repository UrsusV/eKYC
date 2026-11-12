import { apiClient } from "./apiClient";
import { buildListQuery } from "./query";
import { unwrapData } from "./serviceHelpers";
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
    return unwrapData(response, "KYC submission failed");
  }

  async getKycStatus(requestId: string): Promise<KycRequest> {
    const response = await apiClient.get<KycRequest>(
      `/kyc/status/${requestId}`
    );

    return unwrapData(response, "Failed to fetch KYC status");
  }

  async getKycHistory(
    params: PaginationParams = {}
  ): Promise<ApiResponse<KycRequest[]>> {
    return await apiClient.get<KycRequest[]>(
      `/kyc/history?${buildListQuery(params)}`
    );
  }

  async getCredentials(
    params: PaginationParams = {}
  ): Promise<ApiResponse<Credential[]>> {
    return await apiClient.get<Credential[]>(
      `/kyc/credentials?${buildListQuery(params)}`
    );
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
