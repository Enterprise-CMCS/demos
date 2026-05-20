import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { UIPATH_API_VERSION } from "./config";
import { log } from "./log";

type UiPathRequestOptions = AxiosRequestConfig & {
  params?: Record<string, string | number | undefined>;
};

const transientGetStatuses = new Set([429, 502, 503, 504]);
const maxGetAttempts = 5;
const baseGetDelayMs = 2000;
const maxGetDelayMs = 30000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getHeaderValue(error: AxiosError, headerName: string): string | number | undefined {
  const headers = error.response?.headers;
  if (!headers || typeof headers !== "object") {
    return undefined;
  }

  const maybeAxiosHeaders = headers as { get?: (name: string) => unknown };
  const axiosHeaderValue = maybeAxiosHeaders.get?.(headerName);
  if (typeof axiosHeaderValue === "string" || typeof axiosHeaderValue === "number") {
    return axiosHeaderValue;
  }

  const matchingEntry = Object.entries(headers as Record<string, unknown>).find(
    ([key]) => key.toLowerCase() === headerName.toLowerCase()
  );
  const matchingValue = matchingEntry?.[1];

  return typeof matchingValue === "string" || typeof matchingValue === "number"
    ? matchingValue
    : undefined;
}

function getRetryAfterDelayMs(error: AxiosError): number | undefined {
  const retryAfter = getHeaderValue(error, "retry-after");
  if (retryAfter === undefined) {
    return undefined;
  }

  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds)) {
    return Math.max(retryAfterSeconds * 1000, 0);
  }

  const retryAfterDate = Date.parse(String(retryAfter));
  if (Number.isNaN(retryAfterDate)) {
    return undefined;
  }

  return Math.max(retryAfterDate - Date.now(), 0);
}

function getRetryDelayMs(attempt: number, error: AxiosError): number {
  const retryAfterDelayMs = getRetryAfterDelayMs(error);
  if (retryAfterDelayMs !== undefined) {
    return Math.min(retryAfterDelayMs, maxGetDelayMs);
  }

  return Math.min(baseGetDelayMs * 2 ** (attempt - 1), maxGetDelayMs);
}

function isTransientGetError(error: unknown): error is AxiosError {
  return (
    axios.isAxiosError(error) &&
    typeof error.response?.status === "number" &&
    transientGetStatuses.has(error.response.status)
  );
}

function withUiPathAuth(token: string, options: UiPathRequestOptions = {}): AxiosRequestConfig {
  const { params = {}, headers = {}, ...rest } = options;

  return {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers
    },
    params: {
      "api-version": UIPATH_API_VERSION,
      ...params
    }
  };
}

export async function getJson<T>(
  url: string,
  token: string,
  options: UiPathRequestOptions = {}
): Promise<T> {
  const response = await axios.get<T>(url, withUiPathAuth(token, options));
  return response.data;
}

export async function getJsonWithTransientRetry<T>(
  url: string,
  token: string,
  options: UiPathRequestOptions = {}
): Promise<T> {
  let attempt = 1;

  while (true) {
    try {
      return await getJson<T>(url, token, options);
    } catch (error) {
      if (!isTransientGetError(error) || attempt >= maxGetAttempts) {
        throw error;
      }

      const delayMs = getRetryDelayMs(attempt, error);
      log.warn(
        {
          url,
          status: error.response?.status,
          attempt,
          nextAttempt: attempt + 1,
          maxAttempts: maxGetAttempts,
          delayMs
        },
        "Retrying transient UiPath GET failure"
      );

      await sleep(delayMs);
      attempt += 1;
    }
  }
}

export async function postJson<T>(
  url: string,
  token: string,
  data: unknown,
  options: UiPathRequestOptions = {}
): Promise<T> {
  const response = await axios.post<T>(url, data, withUiPathAuth(token, options));
  return response.data;
}

export async function postForm<T>(
  url: string,
  token: string,
  formData: unknown,
  options: UiPathRequestOptions = {}
): Promise<T> {
  const response = await axios.post<T>(url, formData, withUiPathAuth(token, options));
  return response.data;
}
