import type { PaginationParams } from "@/types";

/**
 * Build page/limit query string; omit status when missing or "all".
 */
export function buildListQuery(params: PaginationParams = {}): string {
  const { page = 1, limit = 10, status } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (status && status !== "all") {
    queryParams.append("status", status);
  }

  return queryParams.toString();
}
