import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { getUiPathSecret } from "./uipathSecrets";

export const UIPATH_BASE_URL = "https://govcloud.uipath.us";
export const UIPATH_TENANT = "globalalliant/Dev";
export const UIPATH_API_VERSION = "1.0";
export const UIPATH_EXTRACTOR_NAME = "generative_extractor";

export function getProjectId(): string {
  const projectId = process.env.UIPATH_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing UIPATH_PROJECT_ID in environment.");
  }
  return projectId;
}

// Basically the model it's using, may want different models for different files.
// May need to request to check the different extractors.
export async function getExtractorGuid(): Promise<string> {
  const secret = await getUiPathSecret();
  if (secret.extractorGuid) {
    return secret.extractorGuid;
  }

  throw new Error("Missing UIPATH_EXTRACTOR_GUID Secrets Manager or .env");
}

type documentUnderstandingPostOptions = AxiosRequestConfig & {
  params?: Record<string, string | number | undefined>;
};

export function documentUnderstandingPost<T = unknown>(
  url: string,
  token: string,
  data: unknown,
  options: documentUnderstandingPostOptions = {}
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
