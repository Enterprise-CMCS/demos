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
    "--execute=false",
  ]);

  if (cmd != 0) {
    console.error(`deploy-no-execute command failed with code ${cmd}`);
    return cmd;
  }

  const outputData = readOutputs("all-outputs.json");

  await addCognitoRedirect(
    getOutputValue(outputData, `demos-${environment}-core`, "cognitoAuthority").split("/").pop()!,
    getOutputValue(outputData, `demos-${environment}-core`, "cognitoClientId"),
    getOutputValue(outputData, `demos-${environment}-ui`, "CloudfrontURL")
  );

  console.log(`\n======\ncloudfront url added as a valid redirect\n======\n`);
  return 0;
}
