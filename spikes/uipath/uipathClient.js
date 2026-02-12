import axios from "axios";

export const UIPATH_BASE_URL = "https://govcloud.uipath.us";
export const UIPATH_TENANT = "globalalliant/Dev";
export const UIPATH_API_VERSION = "1.0";

let cachedProjectId;

// Utility for check env vars.
export function getRequiredEnvVar(key, errorMessage) {
  const value = process.env[key];
  if (!value) {
    throw new Error(errorMessage);
  }
  return value;
}

export function setProjectId(projectId) {
  cachedProjectId = projectId;
}

export function getProjectId() {
  if (!cachedProjectId) {
    throw new Error("UiPath projectId is not set. Call setProjectId() first.");
  }
  return cachedProjectId;
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
