import {
  SQSEvent,
  GuardDutyScanResultNotificationEvent,
  Context,
  GuardDutyScanResultNotificationEventDetail,
} from "aws-lambda";

import { Client } from "pg";
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { als, log, store, reqIdChild } from "./log";

const GUARDDUTY_CLEAN_STATUS = "NO_THREATS_FOUND";
const PROCESS_PENDING_DOCUMENT_CLEAN = "move_document_from_pending_to_clean";
const PROCESS_PENDING_DOCUMENT_INFECTED = "move_document_from_pending_to_infected";

let databaseUrlCache = "";
let cacheExpiration = 0;

const uploadBucket = process.env.UPLOAD_BUCKET;
const cleanBucket = process.env.CLEAN_BUCKET;
const infectedBucket = process.env.INFECTED_BUCKET;
const dbSchema = process.env.DB_SCHEMA || "demos_app";
const bypassSSL = process.env.BYPASS_SSL;
const s3Config = process.env.AWS_ENDPOINT_URL
  ? {
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL,
      forcePathStyle: true,
    }
  : {
      region: process.env.AWS_REGION,
    };

const s3 = new S3Client(s3Config);
const secretsManagerConfig = process.env.AWS_ENDPOINT_URL
  ? {
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL,
    }
  : { region: process.env.AWS_REGION };

const secretsManager = new SecretsManagerClient(secretsManagerConfig);

interface Results {
  processedRecords: number;
  cleanFiles: number;
  infectedFiles: number;
}

export async function getDatabaseUrl() {
  const now = Date.now();
  if (databaseUrlCache && cacheExpiration > now) {
    return databaseUrlCache;
  }

  const secretArn = process.env.DATABASE_SECRET_ARN;
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

export async function getApplicationId(client: typeof Client, fileKey: string) {
  const getApplicationIdQuery = `SELECT application_id FROM ${dbSchema}.document_pending_upload WHERE id = $1;`;

  try {
    const result = await client.query(getApplicationIdQuery, [fileKey]);

    if (result.rows.length === 0 || !result.rows[0].application_id) {
      throw new Error(`No document_pending_upload record found for key: ${fileKey}.`);
    }

    return result.rows[0].application_id;
  } catch (error) {
    throw new Error(`Failed to get application ID for key ${fileKey}: ${(error as Error).message}.`);
  }
}

export async function moveFile(
  documentId: string,
  destinationBucket: string,
  destinationKey: string
) {
  await s3.send(
    new CopyObjectCommand({
      Bucket: destinationBucket,
      CopySource: `${uploadBucket}/${documentId}`,
      Key: destinationKey,
    })
  );
  log.info(`successfully copied file to ${destinationBucket}.`);

  await s3.send(
    new DeleteObjectCommand({
      Bucket: uploadBucket,
      Key: documentId,
    })
  );
  log.info(`successfully deleted file from ${uploadBucket}.`);
}

export async function processCleanDatabaseRecord(
  client: typeof Client,
  documentId: string,
  applicationId: string
) {
  const processDocumentQuery = `CALL ${dbSchema}.${PROCESS_PENDING_DOCUMENT_CLEAN}($1::UUID, $2::TEXT);`;
  await client.query(processDocumentQuery, [documentId, `${applicationId}/${documentId}`]);
  log.info("successfully processed clean file in database.");
}

export async function processInfectedDatabaseRecord(
  client: typeof Client,
  documentId: string,
  applicationId: string,
  scanResultDetails: GuardDutyScanResultNotificationEventDetail["scanResultDetails"]
) {
  const threatsString = scanResultDetails.threats
    ? scanResultDetails.threats.map((threat) => threat.name).join(", ")
    : "";
  const processDocumentQuery = `CALL ${dbSchema}.${PROCESS_PENDING_DOCUMENT_INFECTED}($1::UUID, $2::TEXT, $3::TEXT, $4::TEXT);`;
  await client.query(processDocumentQuery, [
    documentId,
    `${applicationId}/${documentId}`,
    scanResultDetails.scanResultStatus ?? "",
    threatsString,
  ]);
  log.info("successfully processed infected file in database.");
}

export async function processGuardDutyResult(
  client: typeof Client,
  guardDutyEvent: GuardDutyScanResultNotificationEvent
): Promise<boolean> {
  const detailType = guardDutyEvent["detail-type"];
  if (detailType !== "GuardDuty Malware Protection Object Scan Result") {
    log.warn("not a GuardDuty Malware Protection scan result.");
    return;
  }

  const guardDutyEventDetails = guardDutyEvent.detail;
  if (!guardDutyEventDetails) {
    throw new Error("No detail found in GuardDuty event.");
  }

  const s3Details = guardDutyEventDetails.s3ObjectDetails;
  if (!s3Details) {
    throw new Error("No S3 object details found in GuardDuty event.");
  }

  const scanResultDetails = guardDutyEventDetails.scanResultDetails;
  if (!scanResultDetails) {
    throw new Error("No scan result details found in GuardDuty event.");
  }

  const scanStatus = guardDutyEventDetails.scanStatus;
  if (scanStatus !== "COMPLETED") {
    throw new Error("GuardDuty scan not completed.");
  }

  const documentId = s3Details.objectKey;
  const applicationId = await getApplicationId(client, documentId);

  const scanResultStatus = scanResultDetails.scanResultStatus;
  const isClean = scanResultStatus === GUARDDUTY_CLEAN_STATUS;

  const destinationBucket = isClean ? cleanBucket : infectedBucket;
  const destinationKey = `${applicationId}/${documentId}`;

  await moveFile(documentId, destinationBucket, destinationKey);
  if (isClean) {
    await processCleanDatabaseRecord(client, documentId, applicationId);
  } else {
    await processInfectedDatabaseRecord(client, documentId, applicationId, scanResultDetails);
  }

  return isClean;
}

export const handler = async (event: SQSEvent, context: Context) =>
  als.run(store, async () => {
    reqIdChild(context.awsRequestId);
    log.debug(
      {
        AWS_REGION: process.env.AWS_REGION,
        AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,
        UPLOAD_BUCKET: uploadBucket,
        CLEAN_BUCKET: cleanBucket,
        DB_SCHEMA: dbSchema,
      },
      "environment variables"
    );

    let client;

    const results: Results = {
      processedRecords: 0,
      cleanFiles: 0,
      infectedFiles: 0,
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
      const setSearchPathQuery = `SET search_path TO ${dbSchema}, public;`;
      await client.query(setSearchPathQuery);

      for (const record of event.Records) {
        try {
          const guardDutyEvent: GuardDutyScanResultNotificationEvent = JSON.parse(record.body);
          log.debug({ guardDutyEvent }, "Received GuardDuty event.");

          const isClean = await processGuardDutyResult(client, guardDutyEvent);
          results.processedRecords++;
          if (isClean) {
            results.cleanFiles++;
          } else {
            results.infectedFiles++;
          }
        } catch (error) {
          log.error({ error: error.message }, "error processing record.");
          throw error;
        }
      }

      log.info({ results }, "all records processed successfully.");

      return {
        statusCode: 200,
        body: `Processed ${results.processedRecords} records: ${results.cleanFiles} clean files processed, ${results.infectedFiles} infected files processed.`,
      };
    } catch (error) {
      log.error({ error: error.message }, "lambda execution failed.");
      throw new Error(`Lambda failed: ${(error as Error).message}`);
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (closeError) {
          log.error({ error: closeError }, "error closing database connection.");
        }
      }
    }
  });
