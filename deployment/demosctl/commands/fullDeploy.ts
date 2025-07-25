import { addCognitoRedirect } from "../lib/addCognitoRedirect";
import { getOutputValue } from "../lib/getOutputValue";
import { readOutputs } from "../lib/readOutputs";
import { runCommand } from "../lib/runCommand";

export async function fullDeploy(environment: string) {
  const completeDeployCmd = await runCommand("deploy-all", "npx", [
    "cdk",
    "deploy",
    "--context",
    `stage=${environment}`,
    "--all",
    "--no-change-set",
    "--require-approval=never",
    "--outputs-file=all-outputs.json",
  ]);

  if (completeDeployCmd != 0) {
    process.stderr.write(`complete deploy command failed with code ${completeDeployCmd}`);
    process.exit(completeDeployCmd);
  }

  // Add cloudfront url to list of redirect urls
  const outputData = readOutputs("all-outputs.json");
  addCognitoRedirect(
    getOutputValue(outputData, `demos-${environment}-core`, "cognitoAuthority").split("/").pop()!,
    getOutputValue(outputData, `demos-${environment}-core`, "cognitoClientId"),
    getOutputValue(outputData, `demos-${environment}-ui`, "CloudfrontURL")
  );

  process.stdout.write(`\n======\ncomplete deploy command succeeded\n======\n`);
}
