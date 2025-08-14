import { buildClient } from "./buildClient";
import { buildServer } from "./buildServer";
import { fullDeploy } from "./fullDeploy";
import { getCoreOutputs } from "./getCoreOutputs";

export async function up(environment: string) {
  if (["prod", "impl", "test", "dev"].includes(environment)) {
    console.log("'up' can only be used for ephemeral environments");
    process.exit(13);
  }
  try {
    await getCoreOutputs(environment);
    process.exit("14");
    await Promise.all([buildServer(), buildClient(environment)]);
    await fullDeploy(environment);
  } catch (err) {
    console.log(`deployment failed: ${err}`);
    if ((err as Error).message.includes("core-outputs")) {
      process.exit(11);
    }

    process.exit(10);
  }
}
