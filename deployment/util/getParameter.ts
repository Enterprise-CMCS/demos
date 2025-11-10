// istanbul ignore file
// ignoring since this is just a wrapper around AWS SDK functionality
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

const client = new SSMClient({ region: "us-east-1" });

export async function getParameter(paramName: string) {
  console.log("getting parameter:", paramName);
  const command = new GetParameterCommand({
    Name: paramName,
  });
  const data = await client.send(command);
  if (!data.Parameter?.Value) {
    throw new Error(`parameter data missing: ${paramName}`);
  }
  return data.Parameter?.Value
}
