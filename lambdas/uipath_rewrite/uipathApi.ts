import fs from "node:fs";
import FormData from "form-data";
import type { AxiosProgressEvent } from "axios";
import { getTenantUrl } from "./config";
import { log } from "./log";
import { getJson, getJsonWithTransientRetry, postForm, postJson } from "./uipathHttpClient";
import type { ExtractionStatus } from "./types";

type UiPathProject = {
  id?: string;
  name?: string;
};

type ProjectListResponse = {
  projects?: UiPathProject[];
};

type ExtractorInfo = {
  asyncUrl?: string;
};

type ExtractorListResponse = {
  extractors?: ExtractorInfo[];
};

type UploadResponse = {
  documentId?: string;
};

type ExtractionStartResponse = {
  resultUrl?: string;
};

let cachedProjectId: string | undefined;

export async function getProjectIdByName(token: string, projectName: string): Promise<string> {
  if (cachedProjectId) {
    return cachedProjectId;
  }

  const url = getTenantUrl("du_/api/framework/projects/");
  log.info({ url }, "Fetching project list from UiPath");

  const response = await getJsonWithTransientRetry<ProjectListResponse>(url, token);
  const projects = response.projects;

  if (!Array.isArray(projects) || projects.length === 0) {
    throw new Error("No projects returned.");
  }

  const matchingProject = projects.find((project) => project.name === projectName);
  if (!matchingProject) {
    throw new Error(`No project found with name ${projectName}`);
  }
  if (!matchingProject.id) {
    throw new Error(`Project ${projectName} is missing an id.`);
  }

  cachedProjectId = matchingProject.id;
  return matchingProject.id;
}

async function getExtractorUrl(token: string, projectId: string): Promise<string> {
  const url = getTenantUrl(`du_/api/framework/projects/${projectId}/extractors`);
  log.info({ url }, "Fetching extractor URL from UiPath");

  const response = await getJsonWithTransientRetry<ExtractorListResponse>(url, token);
  const extractors = response.extractors;

  if (!Array.isArray(extractors) || extractors.length === 0) {
    throw new Error("No extractors returned for the project.");
  }

  const asyncUrl = extractors[0]?.asyncUrl;
  if (!asyncUrl) {
    throw new Error("Extractor is missing asyncUrl.");
  }

  return asyncUrl;
}

export async function uploadDocument(
  token: string,
  localPath: string,
  projectId: string,
  uploadFileName?: string
): Promise<string> {
  const url = getTenantUrl(`du_/api/framework/projects/${projectId}/digitization/start`);
  const formData = new FormData();
  const uploadName =
    typeof uploadFileName === "string" && uploadFileName.trim().length > 0
      ? uploadFileName
      : localPath;

  log.info({ url, uploadName }, "Uploading document to UiPath");
  formData.append("file", fs.createReadStream(localPath), uploadName);

  try {
    const response = await postForm<UploadResponse | string>(url, token, formData, {
      headers: {
        ...formData.getHeaders(),
        "x-uipath-page-range": "All"
      },
      onUploadProgress: (progressEvent?: AxiosProgressEvent) => {
        if (!progressEvent?.total) return;
        const percentCompleted = Math.round(
          ((progressEvent.loaded ?? 0) * 100) / progressEvent.total
        );
        log.info({ percentCompleted }, "Upload progress");
      }
    });

    const documentId = typeof response === "string" ? response : response.documentId;
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

export async function startExtraction(
  token: string,
  documentId: string,
  projectId: string
): Promise<string> {
  const asyncUrl = await getExtractorUrl(token, projectId);
  const response = await postJson<ExtractionStartResponse>(asyncUrl, token, {
    documentId,
    pageRange: null,
    configuration: null
  });

  if (!response.resultUrl) {
    throw new Error("UiPath extraction did not return a resultUrl.");
  }

  return response.resultUrl;
}

export async function getExtractionStatus(
  token: string,
  resultUrl: string
): Promise<ExtractionStatus> {
  return getJson<ExtractionStatus>(resultUrl, token);
}
