import type { ApiResponse } from "@/types";

export function unwrapData<T>(
  response: ApiResponse<T>,
  fallbackMessage: string
): T {
  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.message || fallbackMessage);
}
