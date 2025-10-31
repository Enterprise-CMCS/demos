import { Role } from "../types";
import {
  SecretsManagerClient,
  CreateSecretCommand,
  RotateSecretCommand,
  DeleteSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { getDatabaseSecret } from "../database/pool";
import { getAccountId, getRegion, getStage } from "../util/env";
import { log } from "../log";

export async function storeSecret(env: string, role: string, password: string) {
  log.debug("storing system role password in secret");

  const dbSecretDetails = await getDatabaseSecret();

  try {
    const client = new SecretsManagerClient({ region: "us-east-1" });
    const command = new CreateSecretCommand({
      Name: `demos-${env}-rds-${role}`,
      SecretString: JSON.stringify({
        password,
        dbname: dbSecretDetails.dbname,
        engine: dbSecretDetails.engine,
        port: dbSecretDetails.port,
        dbInstanceIdentifier: dbSecretDetails.dbInstanceIdentifier,
        host: dbSecretDetails.host,
        username: role,
      }),
      Description: `DB info for ${role} on ${env}`,
    });
    const resp = await client.send(command);
    log.info({arn: resp.ARN}, "secret stored");

    const rotateCmd = new RotateSecretCommand({
      SecretId: resp.ARN || resp.Name,
      RotationLambdaARN: `arn:aws:lambda:${getRegion()}:${getAccountId()}:function:demos-${getStage()}-rds-rotation`, // modularize
      RotateImmediately: true,
      RotationRules: {
        AutomaticallyAfterDays: 30,
      },
    });

    const rotateResp = await client.send(rotateCmd);
    log.info({rotateResp},"secret rotation initialized:");
  } catch (err) {
    log.error({error: (err as Error).message}, "error storing secret");
  }
}

export async function deleteSecrets(roleList: Role[]) {
  const client = new SecretsManagerClient({ region: "us-east-1" });

  for (const role of roleList) {
    const command = new DeleteSecretCommand({
      SecretId: `demos-${getStage()}-rds-${role.name}`, // pragma: allowlist secret
      ForceDeleteWithoutRecovery: true,
    });
    try {
      const resp = await client.send(command);
      log.info({resp}, "secret deleted");
    } catch (err) {
      log.error({error: (err as Error).message}, "error deleting secret");
    }
  }
}
