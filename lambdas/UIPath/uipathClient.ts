import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export const UIPATH_BASE_URL = "https://govcloud.uipath.us";
export const UIPATH_TENANT = "globalalliant/Dev";
export const UIPATH_API_VERSION = "1.0";

export function getProjectId(): string {
  const projectId = process.env.ZERO_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing ZERO_PROJECT_ID in environment.");
  }
  return projectId;
}

// Basically the model it's using, may want different models for different files.
// May need to request to check the different extractors.
export function getExtractorGuid(): string {
  const extractorGuid = process.env.EXTRACTOR_GUID;
  if (!extractorGuid) {
    throw new Error("Missing EXTRACTOR_GUID in environment.");
  }
  return extractorGuid;
}

type DuPostOptions = AxiosRequestConfig & {
  params?: Record<string, string | number | undefined>;
};

// duPost == Document Understanding POST
export function duPost<T = unknown>(
  url: string,
  token: string,
  data: unknown,
  options: DuPostOptions = {}
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
