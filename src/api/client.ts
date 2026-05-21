const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";

function normalizeApiBaseUrl(value: string) {
  if (!value) {
    return "";
  }

  const normalized = value.replace(/\/$/, "");
  try {
    return new URL(normalized).toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);

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
  if (!RAW_API_BASE_URL) {
    throw new ApiError("Missing VITE_API_BASE_URL");
  }

  if (!API_BASE_URL) {
    throw new ApiError(
      "Invalid VITE_API_BASE_URL. Use a full URL like https://odos-backend.onrender.com/api",
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error instanceof Error && /expected pattern|invalid url/i.test(error.message)) {
      throw new ApiError(
        "The admin API URL is invalid. Set VITE_API_BASE_URL to a full URL like https://odos-backend.onrender.com/api",
      );
    }
    if (error instanceof Error && /failed to fetch|networkerror|load failed/i.test(error.message)) {
      throw new ApiError(
        "We couldn't reach the ODOS backend. If you're using the deployed admin, redeploy the Render backend and confirm CORS_ORIGINS includes this admin URL.",
      );
    }
    throw error;
  }

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
