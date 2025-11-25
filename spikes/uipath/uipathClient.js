import axios from "axios";

export const UIPATH_BASE_URL = "https://govcloud.uipath.us";
export const UIPATH_TENANT = "globalalliant/Dev";
export const UIPATH_API_VERSION = "1.0";

export function getProjectId() {
  const projectId = process.env.ZERO_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing ZERO_PROJECT_ID in environment.");
  }
  return projectId;
}

export function getExtractorGuid() {
  const extractorGuid = process.env.EXTRACTOR_GUID;
  if (!extractorGuid) {
    throw new Error("Missing EXTRACTOR_GUID in environment.");
  }
  return extractorGuid;
}

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
