import path from "node:path";

import { runShell } from "../lib/runCommand";
import { getOutputValue } from "../lib/getOutputValue";

import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";

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

const cloudFormation = new CloudFormationClient({ region: "us-east-1" });

async function getStackOutputs(stackName: string): Promise<Record<string, string>> {
  const response = await cloudFormation.send(new DescribeStacksCommand({ StackName: stackName }));

  const stack = response.Stacks?.[0];
  if (!stack) {
    throw new Error(`CloudFormation stack '${stackName}' was not found`);
  }

  return Object.fromEntries(
    (stack.Outputs ?? []).flatMap(({ OutputKey, OutputValue }) =>
      OutputKey && OutputValue ? [[OutputKey, OutputValue]] : [],
    ),
  );
}
