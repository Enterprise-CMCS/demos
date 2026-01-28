import axios from "axios";

export const UIPATH_BASE_URL = "https://govcloud.uipath.us";
export const UIPATH_TENANT = "globalalliant/Dev";
export const UIPATH_API_VERSION = "1.0";

function getRequiredEnvVar(key, errorMessage) {
  const value = process.env[key];
  if (!value) {
    throw new Error(errorMessage);
  }
  return value;
}

/**
 * This qas factored to reduce replication but since they i'd reduced this down to 1.
 * @returns string
 */
export function getProjectId() {
  return getRequiredEnvVar(
    "PROJECT_ID",
    "PROJECT_ID failed to populate in environment."
  );
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
