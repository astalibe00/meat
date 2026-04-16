import { clientEnv } from "./env";
import { buildTelegramAuthorizationHeader } from "./telegram";

export class ApiError extends Error {
  details?: unknown;
  status: number;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.details = details;
    this.status = status;
  }
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private createUrl(endpoint: string) {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }

    return `${this.baseUrl}${endpoint}`;
  }

  async request<T>(endpoint: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers ?? {});
    const authHeader = buildTelegramAuthorizationHeader();

    if (authHeader && !headers.has("Authorization")) {
      headers.set("Authorization", authHeader);
    }

    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(this.createUrl(endpoint), {
      ...init,
      headers,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const data =
        typeof payload === "string"
          ? { error: payload }
          : (payload as { details?: unknown; error?: string });

      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data.details,
      );
    }

    return payload as T;
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  patch<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      body: JSON.stringify(body),
      method: "PATCH",
    });
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      body: JSON.stringify(body),
      method: "POST",
    });
  }
}

export const api = new ApiClient(clientEnv.apiBaseUrl);
