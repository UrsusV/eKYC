import { apiClient } from "./apiClient";
import type { Consent, ApiResponse, PaginationParams } from "@/types";

class ConsentService {
  async getMyConsents(
    params: PaginationParams = {}
  ): Promise<ApiResponse<Consent[]>> {
    const { page = 1, limit = 10, status = "all" } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    });

    return await apiClient.get<Consent[]>(
      `/consent/my-consents?${queryParams}`
    );
  }

  async getConsentDetails(consentId: string): Promise<Consent> {
    const response = await apiClient.get<Consent>(`/consent/${consentId}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to fetch consent");
  }

  async grantConsent(consentId: string): Promise<Consent> {
    const response = await apiClient.post<Consent>(
      `/consent/${consentId}/grant`,
      {
        agreed: true,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to grant consent");
  }

  async denyConsent(consentId: string, reason: string): Promise<Consent> {
    const response = await apiClient.post<Consent>(
      `/consent/${consentId}/deny`,
      {
        reason,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to deny consent");
  }

  async revokeConsent(consentId: string, reason: string): Promise<Consent> {
    const response = await apiClient.post<Consent>(
      `/consent/${consentId}/revoke`,
      {
        reason,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to revoke consent");
  }

  async bulkGrantConsents(consentIds: string[]): Promise<void> {
    const response = await apiClient.post("/consent/bulk-grant", {
      consentIds,
      agreed: true,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to grant consents");
    }
  }
}

export const consentService = new ConsentService();
