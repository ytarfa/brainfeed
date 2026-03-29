/**
 * Base class for Google API services.
 *
 * Handles API key authentication, base URL construction, timeout/abort,
 * and structured error handling so that subclasses only need to define
 * endpoint-specific methods.
 *
 * Usage:
 *   class YouTubeService extends GoogleApiService { ... }
 *   const yt = new YouTubeService(process.env.GOOGLE_API_KEY!);
 */

const DEFAULT_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class GoogleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | null,
    public readonly details: unknown,
  ) {
    super(message);
    this.name = "GoogleApiError";
  }
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface GoogleApiRequestOptions {
  /** Query-string parameters (merged with the API key automatically). */
  params?: Record<string, string | number | boolean>;
  /** Request timeout in ms. Defaults to 10 000. */
  timeoutMs?: number;
  /** Extra headers to send with the request. */
  headers?: Record<string, string>;
}

interface GoogleErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    errors?: unknown[];
  };
}

// ---------------------------------------------------------------------------
// Base class
// ---------------------------------------------------------------------------

export class GoogleApiService {
  protected readonly apiKey: string;
  protected readonly baseUrl: string;

  /**
   * @param apiKey   Google API key (server-side, restricted by IP or referrer).
   * @param baseUrl  Root URL for the specific API, e.g.
   *                 `https://www.googleapis.com/youtube/v3`.
   */
  constructor(apiKey: string, baseUrl: string) {
    if (!apiKey) {
      throw new Error(
        "GoogleApiService: API key is required. " +
        "Set the GOOGLE_API_KEY environment variable.",
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, ""); // strip trailing slashes
  }

  // -------------------------------------------------------------------------
  // Protected helpers — available to subclasses
  // -------------------------------------------------------------------------

  /**
   * Perform a GET request against the Google API.
   *
   * The API key is appended automatically. Timeouts, JSON parsing, and
   * error mapping are handled here so subclasses don't have to.
   */
  protected async get<T>(
    path: string,
    options: GoogleApiRequestOptions = {},
  ): Promise<T> {
    const { params = {}, timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = options;

    const url = this.buildUrl(path, params);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...headers,
        },
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof GoogleApiError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new GoogleApiError(
        `Google API request failed: ${message}`,
        0,
        "NETWORK_ERROR",
        null,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Perform a POST request against the Google API.
   */
  protected async post<T>(
    path: string,
    body: unknown,
    options: GoogleApiRequestOptions = {},
  ): Promise<T> {
    const { params = {}, timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = options;

    const url = this.buildUrl(path, params);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof GoogleApiError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new GoogleApiError(
        `Google API request failed: ${message}`,
        0,
        "NETWORK_ERROR",
        null,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private buildUrl(
    path: string,
    params: Record<string, string | number | boolean>,
  ): URL {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);

    // Always append the API key
    url.searchParams.set("key", this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    return url;
  }

  /**
   * Parse a non-2xx response into a structured `GoogleApiError`.
   * Always throws.
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let body: GoogleErrorBody | null = null;
    try {
      body = (await response.json()) as GoogleErrorBody;
    } catch {
      // Response body wasn't JSON — that's fine, we still have status info.
    }

    const errObj = body?.error;
    throw new GoogleApiError(
      errObj?.message ?? `HTTP ${response.status} ${response.statusText}`,
      errObj?.code ?? response.status,
      errObj?.status ?? null,
      errObj?.errors ?? null,
    );
  }
}
