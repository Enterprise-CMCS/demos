export function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid email date value: ${value}`);
  }

  return date.toISOString().slice(0, 10);
}

export function getRequiredValue<T>(
  value: T | null | undefined,
  valueName: string,
  templateId: string
): T {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing value for ${valueName} while rendering ${templateId}.data`);
  }

  return value;
}
