export function getRequiredValue(data, dataPath, templateId, partName, token) {
  const value = dataPath.split(".").reduce((current, key) => {
    if (current === undefined || current === null) {
      return undefined;
    }

    return current[key];
  }, data);

  if (value === undefined || value === null || value === "") {
    const prefix = token ? `Missing value for ${token}` : `Missing value for ${dataPath}`;
    throw new Error(`${prefix} at ${dataPath} while rendering ${templateId}.${partName}`);
  }

  return value;
}
