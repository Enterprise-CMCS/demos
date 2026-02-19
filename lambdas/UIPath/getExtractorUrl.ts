import {
  UIPATH_BASE_URL,
  UIPATH_TENANT,
  uipathGetRequest,
} from "./uipathClient";

import { log } from "./log";

type ExtractorInfo = {
  asyncUrl?: string;
};

type ExtractorListResponse = {
  extractors?: ExtractorInfo[];
};

export async function getExtractorUrl(token: string, projectId: string): Promise<string> {

  if (!UIPATH_BASE_URL || !UIPATH_TENANT) {
    throw new Error("Missing UiPath base URL or tenant configuration.");
  }

  const url = `${UIPATH_BASE_URL}/${UIPATH_TENANT}/du_/api/framework/projects/${projectId}/extractors`;

  log.info({ url }, "Fetching extractor URL from UiPath");

  const response = await uipathGetRequest<ExtractorListResponse>(url, token);

  const extractors = response.data?.extractors;
  if (!Array.isArray(extractors) || extractors.length === 0) {
    throw new Error("No extractors returned for the project.");
  }

  const asyncUrl = extractors[0]?.asyncUrl;
  if (!asyncUrl) {
    throw new Error("Extractor is missing asyncUrl.");
  }

  return asyncUrl;
}
