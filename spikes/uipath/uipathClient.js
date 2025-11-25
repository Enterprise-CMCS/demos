import axios from "axios";

export const UIPATH_BASE_URL = "https://govcloud.uipath.us";
export const UIPATH_TENANT = "globalalliant/Dev";
export const UIPATH_PROJECT_ID = process.env.ZERO_PROJECT_ID;
export const UIPATH_EXTRACTOR_GUID = process.env.EXTRACTOR_GUID;
export const UIPATH_API_VERSION = "1.0";

// duPost == Document Understanding POST
export function duPost(url, token, data, options = {}) {
  const { params = {}, headers = {}, ...rest } = options;

  return axios.post(url, data, {
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
