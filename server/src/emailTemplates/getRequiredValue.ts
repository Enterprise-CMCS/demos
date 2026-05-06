export function getRequiredValue(
  data: unknown,
  dataPath: string,
  templateId: string,
  partName: string
): unknown {
  const value = dataPath.split(".").reduce<unknown>((current, key) => {
    if (current === undefined || current === null || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, data);

  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing value for ${dataPath} while rendering ${templateId}.${partName}`);
  }

  return value;
}
