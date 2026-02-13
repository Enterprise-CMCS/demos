import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export const UIPATH_BASE_URL = "https://govcloud.uipath.us";
// This could be made dynamic if we need to support multiple tenants/environments
export const UIPATH_TENANT = "globalalliant/Dev";
export const UIPATH_API_VERSION = "1.0";
let cachedProjectId: string | undefined;

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

type UipathRequestOptions = AxiosRequestConfig & {
  params?: Record<string, string | number | undefined>;
};

export function uipathGetRequest<T = unknown>(
  url: string,
  token: string,
  options: UipathRequestOptions = {}
): Promise<AxiosResponse<T>> {
  const { params = {}, headers = {}, ...rest } = options;

  return axios.get<T>(url, {
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

export function uipathPostRequest<T = unknown>(
  url: string,
  token: string,
  data: unknown,
  options: UipathRequestOptions = {}
): Promise<AxiosResponse<T>> {
  const { params = {}, headers = {}, ...rest } = options;

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
