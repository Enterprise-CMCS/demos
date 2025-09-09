import { PutParameterCommand, SSMClient, DeleteParametersCommand } from "@aws-sdk/client-ssm";

export async function storeSecureString(env: string, role: string, password: string) {
  console.log("storing password in secure param");
  const client = new SSMClient({ region: "us-east-1" });

  const command = new PutParameterCommand({
    Name: `/demos/${env}/db-temp-password/${role}`,
    Value: password,
    Type: "SecureString",
    Overwrite: true,
    Description: `Temp database password for ${role}`,
    Tier: "Standard",
  });

  try {
    const resp = await client.send(command);
    console.log("parameter stored:", resp);
  } catch (err) {
    console.error("error storing password", err);
  }
}

export async function deleteSecureStrings(env: string, roles: string[]) {
  console.log("storing password in secure param");
  const client = new SSMClient({ region: "us-east-1" });

  const command = new DeleteParametersCommand({
    Names: roles.map((u) => `/demos/${env}/db-temp-password/${u}`),
  });

  try {
    const resp = await client.send(command);
    console.log("parameters deleted:", resp);
  } catch (err) {
    console.error("error deleting parameters", err);
  }
}
