import axios from "axios";

export const UIPATH_BASE_URL = "https://govcloud.uipath.us";
export const UIPATH_TENANT = "globalalliant/Dev";
export const UIPATH_API_VERSION = "1.0";

export function getProjectId() {
  const projectId = process.env.PROJECT_ID;
  if (!projectId) {
    throw new Error("PROJECT_ID failed to populate in environment.");
  }
  return projectId;
}

// Basically the model it's using, may want different models for differnt files.
// May need to request to checj the differeent extractors.
export function getExtractorGuid() {
  const extractorGuid = process.env.EXTRACTOR_GUID;
  if (!extractorGuid) {
    throw new Error("Missing EXTRACTOR_GUID in environment.");
  }
  return extractorGuid;
}

export function getExtractorId() {
  const extractorId = process.env.EXTRACTOR_ID;
  if (!extractorId) {
    throw new Error("Missing EXTRACTOR_ID in environment.");
  }
  return extractorId;
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
