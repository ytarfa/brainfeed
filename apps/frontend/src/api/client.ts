import { errorReporter } from "@brain-feed/frontend-error-reporter";

import { getStoredTokens, clearTokens } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json();

  if (!response.ok) {
    const error = new ApiError(
      body.error ?? "An unexpected error occurred",
      response.status,
    );

    // 401 — clear auth and redirect to login
    if (response.status === 401) {
      clearTokens();
      // Only redirect if not already on an auth page
      if (!window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/signup") &&
          !window.location.pathname.startsWith("/forgot-password") &&
          !window.location.pathname.startsWith("/confirm-email")) {
        window.location.href = "/login";
      }
    }

    // 5xx — report to error reporter
    if (response.status >= 500) {
      errorReporter.report(error, {
        url: response.url,
        status: response.status,
      });
    }

    throw error;
  }

  return body as T;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const tokens = getStoredTokens();
  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }

  return headers;
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: getHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T = void>(path: string): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse<T>(response);
}

export async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const tokens = getStoredTokens();
  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }
  // Do not set Content-Type — browser will set multipart boundary automatically

  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers,
    body: formData,
  });
  return handleResponse<T>(response);
}
