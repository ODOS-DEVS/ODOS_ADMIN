import { API_BASE_URL } from "@/api/client";

export function resolveAdminMediaUrl(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  try {
    return new URL(trimmed, `${API_BASE_URL}/`).toString();
  } catch {
    return trimmed;
  }
}
