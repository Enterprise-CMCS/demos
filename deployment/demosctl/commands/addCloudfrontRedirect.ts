import { addCognitoRedirect } from "../lib/addCognitoRedirect";
import { getOutputValue } from "../lib/getOutputValue";
import { readOutputs } from "../lib/readOutputs";
import { runCommand } from "../lib/runCommand";

export async function addCloudfrontRedirect(environment: string) {

  const cmd = await runCommand("deploy-no-execute", "npx", [
    "cdk",
    "deploy",
    "--context",
    `stage=${environment}`,
    "--all",
    "--no-change-set",
    "--require-approval=never",
    "--outputs-file=all-outputs.json",
    "--execute=false"
  ])

  if (cmd != 0) {
    process.stderr.write(`deploy-no-execute command failed with code ${cmd}`);
    process.exit(cmd);
  }

  const outputData = readOutputs("all-outputs.json")
    addCognitoRedirect(
      getOutputValue(outputData, `demos-${environment}-core`, "cognitoAuthority").split("/").pop()!,
      getOutputValue(outputData, `demos-${environment}-core`, "cognitoClientId"),
      getOutputValue(outputData, `demos-${environment}-ui`, "CloudfrontURL")
    );

  process.stdout.write(`\n======\ncloudfront url added as a valid redirect\n======\n`);
}
