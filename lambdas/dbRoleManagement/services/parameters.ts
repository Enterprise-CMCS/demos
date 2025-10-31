import { PutParameterCommand, SSMClient, DeleteParametersCommand } from "@aws-sdk/client-ssm";
import { log } from "../log";

export async function storeSecureString(env: string, role: string, password: string) {
  log.debug("storing password in secure param");
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
    log.info({ resp }, "parameter stored");
  } catch (err) {
    log.error({error: (err as Error).message}, "error storing password");
  }
}

export async function deleteSecureStrings(env: string, roles: string[]) {
  if (roles.length == 0) {
    return;
  }
  log.debug("deleting passwords from secure param");
  const client = new SSMClient({ region: "us-east-1" });

  const command = new DeleteParametersCommand({
    Names: roles.map((u) => `/demos/${env}/db-temp-password/${u}`),
  });

  try {
    const resp = await client.send(command);
    log.info({resp},"parameters deleted");
  } catch (err) {
    log.error({error: (err as Error).message}, "error deleting parameters");
  }
}
