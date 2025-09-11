import path from "path";

import { runShell } from "../lib/runCommand";
import { getOutputValue } from "../lib/getOutputValue";
import { readOutputs } from "../lib/readOutputs";
import { runCommand } from "../lib/runCommand";

export async function buildClient(environment: string, refreshOutputs: boolean = false) {
  const clientPath = path.join("..", "client");

  if (refreshOutputs) {
    const cmd = await runCommand("deploy-core-no-execute", "npx", [
        "cdk",
        "deploy",
        "--context",
        `stage=${environment}`,
        `demos-${environment}-core`,
        "--no-change-set",
        "--require-approval=never",
        "--outputs-file=core-outputs.json",
        "--execute=false"
      ])
    
      if (cmd != 0) {
        process.stderr.write(`deploy-no-execute command failed with code ${cmd}`);
        process.exit(cmd);
      }
  }

  const coreOutputData = readOutputs("core-outputs.json");

  await runShell("client-build", "npm ci && npm run build", {
    cwd: clientPath,
    env: {
      ...process.env,
      VITE_COGNITO_AUTHORITY: getOutputValue(coreOutputData, `demos-${environment}-core`, `cognitoAuthority`),
      VITE_COGNITO_DOMAIN: getOutputValue(coreOutputData, `demos-${environment}-core`, `cognitoDomain`),
      VITE_COGNITO_CLIENT_ID: getOutputValue(coreOutputData, `demos-${environment}-core`, `cognitoClientId`),
      // VITE_BASE_URL: getOutputValue(coreOutputData,`demos-${environment}-core`,`baseUrl`),
      VITE_API_URL_PREFIX: "/api/graphql",
    },
  });
}
