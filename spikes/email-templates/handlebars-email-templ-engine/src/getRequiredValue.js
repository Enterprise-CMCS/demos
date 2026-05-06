export function getRequiredValue(data, dataPath, templateId, partName) {
  const value = dataPath.split(".").reduce((current, key) => {
    if (current === undefined || current === null) {
      return undefined;
    }

    return current[key];
  }, data);

  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing value for ${dataPath} while rendering ${templateId}.${partName}`);
  }

  return value;
}
