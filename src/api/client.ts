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
const BACKEND_WARMUP_WINDOW_MS = 60_000;
const BACKEND_WARMUP_TIMEOUT_MS = 12_000;
const BACKEND_WARMUP_RETRY_DELAYS_MS = [1_000, 2_500];

let backendWarmupPromise: Promise<void> | null = null;
let lastBackendReadyAt = 0;

function isRemoteApiUrl(value: string) {
  if (!value) {
    return false;
  }

  try {
    const { hostname } = new URL(value);
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}

const SHOULD_WARM_REMOTE_BACKEND = isRemoteApiUrl(API_BASE_URL);

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

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function pingBackendHealth() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), BACKEND_WARMUP_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-store",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(`Backend health check failed with status ${response.status}`, response.status);
    }

    lastBackendReadyAt = Date.now();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function ensureBackendAwake() {
  if (!SHOULD_WARM_REMOTE_BACKEND) {
    return;
  }

  if (Date.now() - lastBackendReadyAt < BACKEND_WARMUP_WINDOW_MS) {
    return;
  }

  if (backendWarmupPromise) {
    return backendWarmupPromise;
  }

  backendWarmupPromise = (async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= BACKEND_WARMUP_RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        await pingBackendHealth();
        return;
      } catch (error) {
        lastError = error;
        const retryDelay = BACKEND_WARMUP_RETRY_DELAYS_MS[attempt];
        if (retryDelay) {
          await delay(retryDelay);
        }
      }
    }

    throw lastError;
  })().finally(() => {
    backendWarmupPromise = null;
  });

  return backendWarmupPromise;
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
    await ensureBackendAwake();
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
    lastBackendReadyAt = Date.now();
  } catch (error) {
    if (error instanceof Error && /expected pattern|invalid url/i.test(error.message)) {
      throw new ApiError(
        "The admin API URL is invalid. Set VITE_API_BASE_URL to a full URL like https://odos-backend.onrender.com/api",
      );
    }
    if (error instanceof Error && /failed to fetch|networkerror|load failed|abort/i.test(error.message)) {
      throw new ApiError(
        "We couldn't reach the ODOS backend. If you're using Render, wait a few seconds for the backend to wake up, then try again. If it keeps happening, confirm VITE_API_BASE_URL and CORS_ORIGINS are correct.",
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
