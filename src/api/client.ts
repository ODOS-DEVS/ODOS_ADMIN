const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

type RequestOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function requestJson<T>(path: string, options: RequestOptions = {}) {
  if (!API_BASE_URL) {
    throw new ApiError("Missing VITE_API_BASE_URL");
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (typeof payload.detail === "string" && payload.detail.trim()) {
        message = payload.detail;
      }
    } catch {
      // ignore non-json error payloads
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export { API_BASE_URL };
