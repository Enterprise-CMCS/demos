import { getRequiredValue } from "./getRequiredValue.js";

export function read(data, path, templateId) {
  return getRequiredValue(data, path, templateId, "data");
}
