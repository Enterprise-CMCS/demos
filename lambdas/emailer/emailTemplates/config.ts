export const demosAppUrls = {
  local: "https://localhost:3000",
  dev: "https://dev.demos.internal.cms.gov",
  test: "https://test.demos.internal.cms.gov",
  impl: "https://impl.demos.internal.cms.gov",
  prod: "https://demos.cms.gov",
} as const;

export type DemosEnvironment = keyof typeof demosAppUrls;

export function getDemosAppUrl(): string {
  const environment = process.env.DEMOS_ENVIRONMENT ?? "local";

  if (!Object.hasOwn(demosAppUrls, environment)) {
    throw new Error(`Unsupported DEMOS_ENVIRONMENT: ${environment}`);
  }

  return demosAppUrls[environment as DemosEnvironment];
}
