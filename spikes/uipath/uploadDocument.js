import axios from "axios";
import fs from "fs";
import FormData from "form-data";

export async function uploadDocument(token,fileName) {
  const formData = new FormData();
  formData.append(
    "file",
    fs.createReadStream(fileName),
    fileName
  );

  const doc = await axios.post(
    `https://govcloud.uipath.us/globalalliant/Dev/du_/api/framework/projects/${process.env.ZERO_PROJECT_ID}/digitization/start?api-version=1.0`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data", // Important for file uploads
        "x-uipath-page-range": "All",
        Authorization: `Bearer ${token}`,
      },
      onUploadProgress: (progressEvent) => {
        // Optional: Track upload progress
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload progress: ${percentCompleted}%`);
    },
    }
  );

  return doc.data.documentId;
}
