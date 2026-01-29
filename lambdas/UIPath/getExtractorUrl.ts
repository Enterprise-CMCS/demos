import axios from "axios";
import { UIPATH_BASE_URL,
  UIPATH_TENANT,
  UIPATH_API_VERSION,
  getProjectId
} from "./uipathClient";

import { log } from "./log";

export async function getExtractorUrl(token: string): Promise<string> {
  const projectId = await getProjectId();
  if (!UIPATH_BASE_URL || !UIPATH_TENANT) {
    throw new Error("Missing UiPath base URL or tenant configuration.");
  }

  const url = `${UIPATH_BASE_URL}/${UIPATH_TENANT}/du_/api/framework/projects/${projectId}/extractors`;

  log.info({ url }, "Fetching extractor URL from UiPath");

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      "api-version": UIPATH_API_VERSION,
    },
  });

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
