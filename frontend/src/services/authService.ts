import { apiClient } from "./apiClient";
import type {
  LoginRequest,
  RegisterCustomerRequest,
  RegisterBankOfficerRequest,
  AuthResponse,
  User,
} from "@/types";

class AuthService {
  async register(
    userData: RegisterCustomerRequest,
    role: "customer" | "bank_officer" = "customer"
  ): Promise<AuthResponse> {
    const endpoint =
      role === "customer"
        ? "/auth/register/customer"
        : "/auth/register/bank-officer";

    const response = await apiClient.post<AuthResponse["data"]>(
      endpoint,
      userData
    );

    if (response.success && response.data) {
      apiClient.setTokens(
        response.data.accessToken,
        response.data.refreshToken
      );
      apiClient.setUser(response.data.user);
      return { success: true, data: response.data };
    }

    throw new Error(response.message || "Registration failed");
  }

  async registerCustomer(
    userData: RegisterCustomerRequest
  ): Promise<AuthResponse> {
    return this.register(userData, "customer");
  }

  async registerBankOfficer(
    userData: RegisterBankOfficerRequest
  ): Promise<AuthResponse> {
    return this.register(userData as any, "bank_officer");
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse["data"]>(
      "/auth/login",
      credentials
    );

    if (response.success && response.data) {
      apiClient.setTokens(
        response.data.accessToken,
        response.data.refreshToken
      );
      apiClient.setUser(response.data.user);
      return { success: true, data: response.data };
    }

    throw new Error(response.message || "Login failed");
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");

    if (response.success && response.data) {
      apiClient.setUser(response.data);
      return response.data;
    }

    throw new Error(response.message || "Failed to fetch user");
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      apiClient.logout();
    }
  }

  getUser(): User | null {
    return apiClient.getUser();
  }

  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }
}

export const authService = new AuthService();
