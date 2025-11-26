import * as fs from "fs";
import FormData from "form-data";
import { AxiosProgressEvent } from "axios";
import { log } from "./log";
import { duPost, UIPATH_BASE_URL, UIPATH_TENANT, getProjectId } from "./uipathClient";

export interface UploadResponse {
  documentId: string;
  [key: string]: unknown;
}

export async function uploadDocument(token: string, fileName: string): Promise<string> {
  const projectId = getProjectId();
  const url = `${UIPATH_BASE_URL}/${UIPATH_TENANT}/du_/api/framework/projects/${projectId}/digitization/start`;

  const formData = new FormData();
  formData.append("file", fs.createReadStream(fileName), fileName);

  try {
    const doc = await duPost<UploadResponse>(url, token, formData, {
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
