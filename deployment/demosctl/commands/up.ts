import { buildClient } from "./buildClient";
import { buildServer } from "./buildServer";
import { fullDeploy } from "./fullDeploy";

export async function up(environment: string) {
  if (["prod", "impl", "test", "dev"].includes(environment)) {
    console.error("'up' can only be used for ephemeral environments");
    return 1;
  }
  try {
    await Promise.all([buildServer(environment), buildClient(environment)]);
    await fullDeploy(environment);
  } catch (err) {
    console.error(`deployment failed: ${err}`);
    return 1;
  }

  return 0;
}
