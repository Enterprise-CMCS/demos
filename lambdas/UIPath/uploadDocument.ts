import * as fs from "fs";
import FormData from "form-data";
import { AxiosProgressEvent } from "axios";
import { log } from "./log";
import {
  documentUnderstandingPost,
  UIPATH_TENANT,
  UIPATH_BASE_URL,
  getProjectId,
} from "./uipathClient";

export interface UploadResponse {
  documentId: string;
  [key: string]: unknown;
}

export async function uploadDocument(
  token: string,
  fileName: string,
  projectIdOverride?: string
): Promise<string> {
  const projectId = await getProjectId(projectIdOverride);
  // As of now, this is a constant. but tenant contains "dev" in the URI, so this could be variable later.
  if (! UIPATH_BASE_URL || ! UIPATH_TENANT) {
    throw new Error("Missing UiPath base URL or tenant configuration.");
  }
  const extensionURI = `du_/api/framework/projects/${projectId}/digitization/start`;
  const url = `${UIPATH_BASE_URL}/${UIPATH_TENANT}/${extensionURI}`;

  log.info({ url }, "Uploading document to UiPath");
  const formData = new FormData();
  formData.append("file", fs.createReadStream(fileName), fileName);

  try {
    const doc = await documentUnderstandingPost<UploadResponse>(url, token, formData, {
      headers: {
        // form-data requires its own headers so axios can set boundaries
        ...formData.getHeaders(),
        "x-uipath-page-range": "All",
    },
      onUploadProgress: (progressEvent?: AxiosProgressEvent) => {
        if (!progressEvent?.total) return;
        const percentCompleted = Math.round(((progressEvent.loaded ?? 0) * 100) / progressEvent.total);
        log.info({ percentCompleted }, "Upload progress");
      },
    });

    const documentId = doc?.data?.documentId || (doc?.data as unknown as string);
    if (!documentId) {
      throw new Error("UiPath upload did not return a documentId.");
    }
    return documentId;
  } catch (error) {
    const err = error as Error & { response?: { data?: unknown } };
    log.error({ err, response: err.response?.data }, "Error uploading document");
    throw err;
  }
}
