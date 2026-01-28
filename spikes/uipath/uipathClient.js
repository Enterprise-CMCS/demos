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

export function getProjectId() {
  return getRequiredEnvVar(
    "PROJECT_ID",
    "PROJECT_ID failed to populate in environment."
  );
}

// Basically the model it's using, may want different models for differnt files.
// May need to request to checj the differeent extractors.
export function getExtractorGuid() {
  return getRequiredEnvVar(
    "EXTRACTOR_GUID",
    "Missing EXTRACTOR_GUID in environment."
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
