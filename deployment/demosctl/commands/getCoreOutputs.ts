import { readOutputs } from "../lib/readOutputs";
import { runCommand } from "../lib/runCommand";

export async function getCoreOutputs(environment: string) {
  const coreOutputCmd = await runCommand("core-deploy", "npx", [
    "cdk",
    "deploy",
    "--context",
    `stage=${environment}`,
    `demos-${environment}-core`,
    "--outputs-file",
    "core-outputs.json",
  ]);

  if (coreOutputCmd != 0) {
    process.stderr.write(`core output command failed with code ${coreOutputCmd}`);
    process.exit("something went wrong");
  }
  return readOutputs("core-outputs.json");
}
