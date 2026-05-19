import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { log } from "./log";

export const UIPATH_BASE_URL = "https://govcloud.uipath.us";
// This could be made dynamic if we need to support multiple tenants/environments
export const UIPATH_TENANT = "globalalliant/Dev";
export const UIPATH_API_VERSION = "1.0";
export const region = "us-east-1";

let cachedProjectId: string | undefined;

export interface UiPathProject {
  id?: string;
  name?: string;
}

export interface ProjectListResponse {
  projects?: UiPathProject[];
}

export interface ExtractorInfo {
  asyncUrl?: string;
}

export interface ExtractorListResponse {
  extractors?: ExtractorInfo[];
}

export type UiPathGetResponse = ProjectListResponse | ExtractorListResponse;

export type UiPathPostResponse =
  | {
      documentId?: string;
      resultUrl?: string;
    }
  | string;

type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryStatuses?: number[];
  delayMs?: (attempt: number, error: AxiosError) => number;
};
type ResolvedRetryOptions = Required<Omit<RetryOptions, "delayMs">> & Pick<RetryOptions, "delayMs">;

type UipathRequestOptions = AxiosRequestConfig & {
  params?: Record<string, string | number | undefined>;
  retry?: RetryOptions;
};

export function setProjectId(projectId: string): void {
  const normalized = projectId.trim();
  if (!normalized) {
    throw new Error("UiPath project id cannot be empty.");
  }
  cachedProjectId = normalized;
}
/**
 * Try catch fodder for getProjectId()
 * @returns string
 */
export function getProjectId(): string {
  if (!cachedProjectId) {
    throw new Error("UiPath project id is not set.");
  }
  return cachedProjectId;
}



const DEFAULT_RETRY_STATUSES = [
  429, 502, 503, 504
];

const DEFAULT_RETRY_OPTIONS = {
  maxAttempts: 5,
  baseDelayMs: 2000,
  maxDelayMs: 30000,
  retryStatuses: DEFAULT_RETRY_STATUSES,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getHeaderValue(headers: unknown, headerName: string): string | undefined {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }

  const maybeAxiosHeaders = headers as { get?: (name: string) => unknown };
  const value = maybeAxiosHeaders.get?.(headerName);
  if (typeof value === "string") {
    return value;
  }

  const record = headers as Record<string, unknown>;
  const matchingEntry = Object.entries(record).find(
    ([key]) => key.toLowerCase() === headerName.toLowerCase()
  );
  const matchingValue = matchingEntry?.[1];
  return typeof matchingValue === "string" ? matchingValue : undefined;
}

function getRetryAfterDelayMs(error: AxiosError): number | undefined {
  const retryAfter = getHeaderValue(error.response?.headers, "retry-after");
  if (!retryAfter) {
    return undefined;
  }

  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds)) {
    return Math.max(retryAfterSeconds * 1000, 0);
  }

  const retryAfterDate = Date.parse(retryAfter);
  if (Number.isNaN(retryAfterDate)) {
    return undefined;
  }

  return Math.max(retryAfterDate - Date.now(), 0);
}

function getRetryDelayMs(attempt: number, error: AxiosError, retry: ResolvedRetryOptions): number {
  const retryAfterDelayMs = getRetryAfterDelayMs(error);
  if (retryAfterDelayMs !== undefined) {
    return Math.min(retryAfterDelayMs, retry.maxDelayMs);
  }

  const delayMs = retry.delayMs
    ? retry.delayMs(attempt, error)
    : Math.min(retry.baseDelayMs * 2 ** (attempt - 1), retry.maxDelayMs);
  return Math.min(Math.max(delayMs, 0), retry.maxDelayMs);
}

function isRetriableError(error: unknown, retryStatuses: number[]): error is AxiosError {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return typeof status === "number" && retryStatuses.includes(status);
}

function buildRequestConfig(options: UipathRequestOptions): AxiosRequestConfig {
  const { params = {}, headers = {}, retry: _retry, ...rest } = options;

  return {
    headers,
    params: {
      "api-version": UIPATH_API_VERSION,
      ...params,
    },
    ...rest,
  };
}

export async function uipathGetRequest<T extends UiPathGetResponse = UiPathGetResponse>(
  url: string,
  token: string,
  options: UipathRequestOptions = {}
): Promise<AxiosResponse<T>> {
  const { retry: retryOverrides } = options;
  const retry: ResolvedRetryOptions = {
    maxAttempts: retryOverrides?.maxAttempts ?? DEFAULT_RETRY_OPTIONS.maxAttempts,
    baseDelayMs: retryOverrides?.baseDelayMs ?? DEFAULT_RETRY_OPTIONS.baseDelayMs,
    maxDelayMs: retryOverrides?.maxDelayMs ?? DEFAULT_RETRY_OPTIONS.maxDelayMs,
    retryStatuses: retryOverrides?.retryStatuses ?? DEFAULT_RETRY_OPTIONS.retryStatuses,
    delayMs: retryOverrides?.delayMs,
  };
  const requestConfig = buildRequestConfig(options);
  const headers = {
    Authorization: `Bearer ${token}`,
    ...requestConfig.headers,
  };

  let attempt = 1;
  while (true) {
    try {
      return await axios.get<T>(url, {
        ...requestConfig,
        headers,
      });
    } catch (error) {
      if (!isRetriableError(error, retry.retryStatuses) || attempt >= retry.maxAttempts) {
        throw error;
      }

      const delayMs = getRetryDelayMs(attempt, error, retry);
      log.warn(
        {
          url,
          status: error.response?.status,
          attempt,
          nextAttempt: attempt + 1,
          maxAttempts: retry.maxAttempts,
          delayMs,
        },
        "Retrying transient UiPath GET failure"
      );
      await sleep(delayMs);
      attempt += 1;
    }
  }
}

export function uipathPostRequest<T extends UiPathPostResponse = UiPathPostResponse>(
  url: string,
  token: string,
  data: unknown,
  options: UipathRequestOptions = {}
): Promise<AxiosResponse<T>> {
  const { params = {}, headers = {}, retry: _retry, ...rest } = options;

  return axios.post<T>(url, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    params: {
      "api-version": UIPATH_API_VERSION,
      ...params,
    },
    ...rest,
  });
}
