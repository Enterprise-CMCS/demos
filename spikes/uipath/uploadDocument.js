import fs from "fs";
import FormData from "form-data";
import { log } from "./logFile.js";
import { duPost, UIPATH_BASE_URL, UIPATH_PROJECT_ID, UIPATH_TENANT } from "./uipathClient.js";

export async function uploadDocument(token, fileName) {
  const url = `${UIPATH_BASE_URL}/${UIPATH_TENANT}/du_/api/framework/projects/${UIPATH_PROJECT_ID}/digitization/start`;

  const formData = new FormData();
  formData.append("file", fs.createReadStream(fileName), fileName);

  const doc = await duPost(url, token, formData, {
    headers: {
      // form-data requires its own headers so axios can set boundaries
      ...formData.getHeaders(),
      "x-uipath-page-range": "All",
    },
    onUploadProgress: (progressEvent) => {
      // Optional: Track upload progress
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      log(`Upload progress: ${percentCompleted}%`);
    },
  });

  return doc.data.documentId;
}
