import { UploadDocumentInput, UploadDocumentResponse } from "../../types.js";
import { createAWSS3DocumentAdapter } from "./AwsS3DocumentAdapter.js";
import { createLocalDocumentAdapter } from "./LocalDocumentAdapter.js";

export interface DocumentAdapter {
  getPresignedDownloadUrl(key: string): Promise<string>;
  moveDocumentFromCleanToDeleted(key: string): Promise<void>;
  uploadDocument(
    { input }: { input: UploadDocumentInput },
    ownerUserId: string
  ): Promise<UploadDocumentResponse>;
}

let documentAdapterInstance: DocumentAdapter | null = null;

export function createDocumentAdapter(): DocumentAdapter {
  if (documentAdapterInstance) {
    return documentAdapterInstance;
  }

  if (process.env.LOCAL_SIMPLE_UPLOAD === "true") {
    documentAdapterInstance = createLocalDocumentAdapter();
  } else {
    documentAdapterInstance = createAWSS3DocumentAdapter();
  }

  return documentAdapterInstance;
}
