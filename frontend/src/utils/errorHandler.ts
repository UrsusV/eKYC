import { AxiosError } from "axios";

export interface ApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  statusCode?: number;
}

/**
 * Extracts error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;

    // Check for validation errors
    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.map((e: any) => e.message).join(", ");
    }

    // Check for general error message
    if (data?.message) {
      return data.message;
    }

    // Network errors
    if (error.code === "ERR_NETWORK") {
      return "Network error. Please check your internet connection.";
    }

    // Timeout errors
    if (error.code === "ECONNABORTED") {
      return "Request timeout. Please try again.";
    }

    // Status-based errors
    switch (error.response?.status) {
      case 400:
        return "Invalid request. Please check your input.";
      case 401:
        return "Unauthorized. Please login again.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "Resource not found.";
      case 409:
        return "Conflict. Resource already exists.";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "Server error. Please try again later.";
      case 503:
        return "Service unavailable. Please try again later.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
};

/**
 * Extracts validation errors from API response
 */
export const getValidationErrors = (error: unknown): Record<string, string> => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;

    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.reduce((acc: Record<string, string>, err: any) => {
        if (err.field) {
          acc[err.field] = err.message;
        }
        return acc;
      }, {});
    }
  }

  return {};
};

/**
 * Checks if error is authentication related
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
};

/**
 * Checks if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.code === "ERR_NETWORK" || !error.response;
  }
  return false;
};

/**
 * Formats error for display
 */
export const formatErrorForDisplay = (error: unknown): ApiError => {
  const message = getErrorMessage(error);
  const statusCode =
    error instanceof AxiosError ? error.response?.status : undefined;

  const validationErrors = getValidationErrors(error);
  const errors = Object.keys(validationErrors).map((field) => ({
    field,
    message: validationErrors[field],
  }));

  return {
    message,
    errors: errors.length > 0 ? errors : undefined,
    statusCode,
  };
};
