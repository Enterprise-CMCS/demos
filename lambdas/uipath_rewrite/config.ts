export const AWS_REGION = "us-east-1";
export const UIPATH_BASE_URL = "https://govcloud.uipath.us";
export const UIPATH_TENANT = "globalalliant/Dev";
export const UIPATH_API_VERSION = "1.0";

export function getCleanBucket(): string {
  const cleanBucket = process.env.CLEAN_BUCKET ?? "clean-bucket";
  if (!cleanBucket) {
    throw new Error("CLEAN_BUCKET environment variable is required.");
  }
  return cleanBucket;
}

export function getUiPathProjectName(): string {
  return process.env.UIPATH_PROJECT_NAME ?? "demosOCR";
}

export function getTenantUrl(path: string): string {
  if (!UIPATH_BASE_URL || !UIPATH_TENANT) {
    throw new Error("Missing UiPath base URL or tenant configuration.");
  }

  return `${UIPATH_BASE_URL}/${UIPATH_TENANT}/${path.replace(/^\/+/, "")}`;
}
