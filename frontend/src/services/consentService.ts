import { apiClient } from "./apiClient";
import { buildListQuery } from "./query";
import { unwrapData } from "./serviceHelpers";
import type { Consent, ApiResponse, PaginationParams } from "@/types";

class ConsentService {
  async getMyConsents(
    params: PaginationParams = {}
  ): Promise<ApiResponse<Consent[]>> {
    return await apiClient.get<Consent[]>(
      `/consent/my-consents?${buildListQuery(params)}`
    );
  }

  async grantConsent(consentId: string): Promise<Consent> {
    const response = await apiClient.post<Consent>(
      `/consent/${consentId}/grant`,
      {
        agreed: true,
      }
    );

    return unwrapData(response, "Failed to grant consent");
  }

  async denyConsent(consentId: string, reason: string): Promise<Consent> {
    const response = await apiClient.post<Consent>(
      `/consent/${consentId}/deny`,
      {
        reason,
      }
    );

    return unwrapData(response, "Failed to deny consent");
  }

  async revokeConsent(consentId: string, reason: string): Promise<Consent> {
    const response = await apiClient.post<Consent>(
      `/consent/${consentId}/revoke`,
      {
        reason,
      }
    );

    return unwrapData(response, "Failed to revoke consent");
  }
}

export const consentService = new ConsentService();
