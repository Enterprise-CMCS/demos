import { getRequiredValue } from "./getRequiredValue.ts";

export function read(data: unknown, path: string, templateId: string): string {
  return String(getRequiredValue(data, path, templateId, "data"));
}
