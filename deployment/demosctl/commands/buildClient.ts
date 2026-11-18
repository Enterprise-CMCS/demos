import path from "node:path";

import { runShell } from "../lib/runCommand";
import { getOutputValue } from "../lib/getOutputValue";
import { getStackOutputs } from "../lib/getStackOutputs";

const LOWER_ENVIRONMENTS = new Set(["dev", "test"]);

export async function buildClient(environment: string) {
  const clientPath = path.join("..", "client");

  const stackName = `demos-${environment}-core`;
  const coreOutputData = await getStackOutputs(stackName);

  const buildCmd = LOWER_ENVIRONMENTS.has(environment) ? "npm run build:ci:dev" : "npm run build:ci";

  return await runShell("client-build", `npm ci && ${buildCmd}`, {
    cwd: clientPath,
    env: {
      ...process.env,
      VITE_COGNITO_AUTHORITY: getOutputValue(coreOutputData, stackName, `cognitoAuthority`),
      VITE_COGNITO_DOMAIN: getOutputValue(coreOutputData, stackName, `cognitoDomain`),
      VITE_COGNITO_CLIENT_ID: getOutputValue(coreOutputData, stackName, `cognitoClientId`),
      VITE_API_URL_PREFIX: "/api/graphql",
    },
  });
}
