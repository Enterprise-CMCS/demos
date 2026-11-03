export const DEMOS_SERVER_ENVIRONMENTS = ["local", "dev", "test", "impl", "prod"] as const;
export type DemosServerEnvironment = (typeof DEMOS_SERVER_ENVIRONMENTS)[number];

export function isDemosServerEnvironment(value: string): value is DemosServerEnvironment {
  return DEMOS_SERVER_ENVIRONMENTS.includes(value as DemosServerEnvironment);
}
