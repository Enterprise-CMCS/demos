import axios, { AxiosError, AxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";
import { UIPATH_API_VERSION } from "./config";
import { log } from "./log";

type UiPathRequestOptions = AxiosRequestConfig & {
  params?: Record<string, string | number | undefined>;
};

const transientGetStatuses = new Set([429, 502, 503, 504]);
const maxGetRetries = 4;
const baseGetDelayMs = 2000;
const maxGetDelayMs = 30000;

const plainUiPathHttpClient = axios.create();
const retryableUiPathHttpClient = axios.create();

function isTransientGetError(error: AxiosError): boolean {
  const method = error.config?.method?.toLowerCase();
  return (
    method === "get" &&
    typeof error.response?.status === "number" &&
    transientGetStatuses.has(error.response.status)
  );
}

axiosRetry(retryableUiPathHttpClient, {
  retries: maxGetRetries,
  retryCondition: isTransientGetError,
  retryDelay: (retryCount) =>
    Math.min(baseGetDelayMs * 2 ** (retryCount - 1), maxGetDelayMs),
  onRetry: (retryCount, error, requestConfig) => {
    log.warn(
      {
        url: requestConfig.url,
        status: error.response?.status,
        retryCount,
        maxRetries: maxGetRetries
      },
      "Retrying transient UiPath GET failure"
    );
  }
});

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
  const response = await plainUiPathHttpClient.get<T>(url, withUiPathAuth(token, options));
  return response.data;
}

export async function getJsonWithTransientRetry<T>(
  url: string,
  token: string,
  options: UiPathRequestOptions = {}
): Promise<T> {
  const response = await retryableUiPathHttpClient.get<T>(url, withUiPathAuth(token, options));
  return response.data;
}

export async function postJson<T>(
  url: string,
  token: string,
  data: unknown,
  options: UiPathRequestOptions = {}
): Promise<T> {
  const response = await plainUiPathHttpClient.post<T>(url, data, withUiPathAuth(token, options));
  return response.data;
}

export async function postForm<T>(
  url: string,
  token: string,
  formData: unknown,
  options: UiPathRequestOptions = {}
): Promise<T> {
  const response = await plainUiPathHttpClient.post<T>(
    url,
    formData,
    withUiPathAuth(token, options)
  );
  return response.data;
}
