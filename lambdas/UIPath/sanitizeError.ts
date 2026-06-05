import axios from "axios";

const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = new Set([
  "authorization",
  "clientid",
  "client_id",
  "clientsecret",
  "client_secret",
  "access_token",
  "token",
  "password",
  "secret",
]);
const OMITTED_KEYS = new Set(["config", "request", "headers"]);

export type SanitizedErrorDetails = {
  name: string;
  message: string;
  status?: number;
  responseData?: unknown;
  method?: string;
  url?: string;
};

function redactString(value: string): string {
  return value
    .replace(/Basic\s+[A-Za-z0-9+/=._-]+/g, `Basic ${REDACTED}`)
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, `Bearer ${REDACTED}`);
}

function sanitizeValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !OMITTED_KEYS.has(key.toLowerCase()))
      .map(([key, entryValue]) => [
        key,
        SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : sanitizeValue(entryValue, seen),
      ])
  );
}

export function sanitizeError(error: unknown): SanitizedErrorDetails {
  if (axios.isAxiosError(error)) {
    return {
      name: error.name || "AxiosError",
      message: redactString(error.message),
      status: error.response?.status,
      responseData: sanitizeValue(error.response?.data),
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: redactString(error.message),
    };
  }

  return {
    name: "Error",
    message: redactString(String(error)),
  };
}

export function createSanitizedError(error: unknown): Error {
  const sanitizedError = sanitizeError(error);
  const safeError = new Error(sanitizedError.message);
  safeError.name = sanitizedError.name;
  return safeError;
}
