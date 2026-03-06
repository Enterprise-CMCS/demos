import { Context, SQSEvent } from "aws-lambda";
import { Client } from "pg";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { als, log, reqIdChild, store } from "./log";

const dbSchema = process.env.DB_SCHEMA || "demos_app";
const bypassSSL = process.env.BYPASS_SSL;

let databaseUrlCache = "";
let cacheExpiration = 0;

const secretsManagerConfig = process.env.AWS_ENDPOINT_URL
  ? {
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL,
    }
  : { region: process.env.AWS_REGION };

const secretsManager = new SecretsManagerClient(secretsManagerConfig);

interface BudgetNeutralityValidationMessage {
  documentId: string;
  documentTypeId?: string;
}

interface Results {
  processedRecords: number;
  existingDocuments: number;
  missingDocuments: number;
}

export async function getDatabaseUrl() {
  const now = Date.now();
  if (databaseUrlCache && cacheExpiration > now) {
    return databaseUrlCache;
  }

  const secretArn = process.env.DATABASE_SECRET_ARN;
  if (!secretArn) {
    throw new Error("DATABASE_SECRET_ARN environment variable is required.");
  }

  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await secretsManager.send(command);

  if (!response.SecretString) {
    throw new Error("The SecretString value is undefined!");
  }

  const secretData = JSON.parse(response.SecretString);
  databaseUrlCache = `postgresql://${secretData.username}:${secretData.password}@${secretData.host}:${secretData.port}/${secretData.dbname}?schema=${dbSchema}`;
  cacheExpiration = now + 60 * 60 * 1000;

  return databaseUrlCache;
}

export async function documentExists(client: typeof Client, documentId: string): Promise<boolean> {
  const query = `SELECT EXISTS(SELECT 1 FROM ${dbSchema}.document WHERE id = $1::UUID) AS exists;`;
  const result = await client.query(query, [documentId]);
  return Boolean(result.rows[0]?.exists);
}

function parseMessage(recordBody: string): BudgetNeutralityValidationMessage {
  const parsed = JSON.parse(recordBody);

  if (!parsed.documentId || typeof parsed.documentId !== "string") {
    throw new Error("Invalid message: documentId is required.");
  }

  return {
    documentId: parsed.documentId,
    documentTypeId: parsed.documentTypeId,
  };
}

export const handler = async (event: SQSEvent, context: Context) =>
  als.run(store, async () => {
    reqIdChild(context.awsRequestId);

    let client;

    const results: Results = {
      processedRecords: 0,
      existingDocuments: 0,
      missingDocuments: 0,
    };

    try {
      client = new Client({
        connectionString: await getDatabaseUrl(),
        ssl: bypassSSL
          ? false
          : {
              rejectUnauthorized: true,
            },
      });

      await client.connect();
      await client.query(`SET search_path TO ${dbSchema}, public;`);

      for (const record of event.Records) {
        const message = parseMessage(record.body);
        const exists = await documentExists(client, message.documentId);

        results.processedRecords++;

        if (exists) {
          results.existingDocuments++;
          log.info(
            {
              documentId: message.documentId,
              documentTypeId: message.documentTypeId,
            },
            "Budget Neutrality validation placeholder accepted message."
          );
        } else {
          results.missingDocuments++;
          log.warn(
            {
              documentId: message.documentId,
              documentTypeId: message.documentTypeId,
            },
            "Budget Neutrality validation placeholder did not find document in database."
          );
        }
      }

      log.info({ results }, "Budget Neutrality validation placeholder completed.");

      return {
        statusCode: 200,
        body: `Processed ${results.processedRecords} records.`,
      };
    } catch (error) {
      log.error({ error: (error as Error).message }, "Budget Neutrality validation failed.");
      throw new Error(`Lambda failed: ${(error as Error).message}`);
    } finally {
      if (client) {
        await client.end();
      }
    }
  });
