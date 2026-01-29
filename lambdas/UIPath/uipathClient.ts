import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { getUiPathSecret } from "./uipathSecrets";

export const UIPATH_BASE_URL = "https://govcloud.uipath.us";
// This could be made dynamic if we need to support multiple tenants/environments
export const UIPATH_TENANT = "globalalliant/Dev";
export const UIPATH_API_VERSION = "1.0";

export async function getProjectId(): Promise<string> {
  const secrets = await getUiPathSecret();
  if (secrets.projectId) {
    return secrets.projectId;
  }

  throw new Error("Missing UiPath project id in environment or Secrets Manager.");
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
