import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";

export async function getStackOutputs(stackName: string): Promise<Record<string, string>> {
  const cloudFormation = new CloudFormationClient({ region: "us-east-1" });
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
