import {
  UIPATH_BASE_URL,
  UIPATH_TENANT,
  uipathGetRequest,
  getProjectId,
  setProjectId,
} from "./uipathClient";

import { log } from "./log";

type UiPathProject = {
  id?: string;
  name?: string;
};

type ProjectListResponse = {
  projects?: UiPathProject[];
};

export async function getProjectIdByName(token: string, projectName = "demosOCR"): Promise<string> {
  try {
    return getProjectId();
  } catch {
    log.info("Project ID not cached, fetching from UiPath");
  }

  if (!UIPATH_BASE_URL || !UIPATH_TENANT) {
    throw new Error("Missing UiPath base URL or tenant configuration.");
  }

  const url = `${UIPATH_BASE_URL}/${UIPATH_TENANT}/du_/api/framework/projects/`;
  const response = await uipathGetRequest<ProjectListResponse>(url, token);

  log.info({ url }, "Fetching project list from UiPath");

  const projects = response.data?.projects;
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

  setProjectId(matchingProject.id);

  return matchingProject.id;
}
