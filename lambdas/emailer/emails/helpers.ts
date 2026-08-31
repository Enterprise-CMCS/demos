export function getDemosAppUrl(): string {
  return process.env.DEMOS_APP_URL ?? "https://localhost:3000";
}

export function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid email date value: ${value}`);
  }

  return date.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
}

export function getRequiredValue<T>(
  value: T | null | undefined,
  valueName: string,
  emailType: string,
): T {
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `Missing value for ${valueName} while rendering ${emailType}.data`,
    );
  }

  return value;
}

export function getRequiredObject(
  value: unknown,
  valueName: string,
  emailType: string,
): Record<string, unknown> {
  const requiredValue = getRequiredValue(value, valueName, emailType);

  if (!isRecord(requiredValue)) {
    throw new Error(
      `Invalid value for ${valueName} while rendering ${emailType}.data: expected an object.`,
    );
  }

  return requiredValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function getRequiredString(
  value: unknown,
  valueName: string,
  emailType: string,
): string {
  const requiredValue = getRequiredValue(value, valueName, emailType);

  if (typeof requiredValue !== "string") {
    throw new Error(
      `Invalid value for ${valueName} while rendering ${emailType}.data: expected a string.`,
    );
  }

  return requiredValue;
}
