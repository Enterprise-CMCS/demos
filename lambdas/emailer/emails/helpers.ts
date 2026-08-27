const supportedStages = ["local", "dev", "test", "impl", "prod"] as const;

type Stage = (typeof supportedStages)[number];

export function getDemosAppUrl(): string {
  const stage = process.env.STAGE ?? "local";

  if (!supportedStages.includes(stage as Stage)) {
    throw new Error(`Unsupported email STAGE: ${stage}`);
  }

  if (stage === "local") {
    return "https://localhost:3000";
  }

  if (stage === "prod") {
    return "https://demos.cms.gov";
  }

  return `https://${stage}.demos.internal.cms.gov`;
}

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
  emailType: string,
): T {
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `Missing value for ${valueName} while rendering ${emailType}.data`,
    );
  }

  return value;
}
