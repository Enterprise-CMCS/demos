import type { DemosServerEnvironment } from ".";
import { isDemosServerEnvironment } from ".";

export function getCurrentEnvironment(): DemosServerEnvironment {
  const currentEnv = process.env.CURRENT_ENV;
  if (!currentEnv) {
    return "prod";
  } else if (!isDemosServerEnvironment(currentEnv)) {
    throw new Error(`Invalid value for CURRENT_ENV: ${currentEnv}`);
  }
  return currentEnv;
}
