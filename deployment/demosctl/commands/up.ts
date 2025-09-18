import { buildClient } from "./buildClient";
import { buildServer } from "./buildServer";
import { fullDeploy } from "./fullDeploy";
import { getCoreOutputs } from "./getCoreOutputs";

export async function up(environment: string) {
  if (["prod", "impl", "test", "dev"].includes(environment)) {
    console.error("'up' can only be used for ephemeral environments");
    return 1;
  }
  try {
    await getCoreOutputs(environment);
    await Promise.all([buildServer(), buildClient(environment)]);
    await fullDeploy(environment);
  } catch (err) {
    console.error(`deployment failed: ${err}`);
    return 1;
  }

  return 0;
}
