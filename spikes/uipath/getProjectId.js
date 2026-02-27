import axios from "axios";
import {
  UIPATH_BASE_URL,
  UIPATH_TENANT,
  UIPATH_API_VERSION,
} from "./uipathClient.js";

let cachedProjectId;

export async function getProjectIdByName(token, name = "demosOCR") {
  if (cachedProjectId) {
    return cachedProjectId;
  }

  const url = `${UIPATH_BASE_URL}/${UIPATH_TENANT}/du_/api/framework/projects/`;
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      "api-version": UIPATH_API_VERSION,
    },
  });

  const projects = response.data?.projects;
  if (!Array.isArray(projects) || projects.length === 0) {
    throw new Error("No projects returned from UiPath.");
  }

  const target = name.trim().toLowerCase();
  const match = projects.find(
    (project) => typeof project?.name === "string" && project.name.trim().toLowerCase() === target
  );

  if (!match?.id) {
    const names = projects
      .map((project) => project?.name)
      .filter((value) => typeof value === "string");
    throw new Error(`Project "${name}" not found. Available: ${names.join(", ")}`);
  }

  cachedProjectId = match.id;
  return cachedProjectId;
}
