import {
  Context,
  SQSEvent,
  GuardDutyScanResultNotificationEvent,
  GuardDutyScanResultNotificationEventDetail,
} from "aws-lambda";

import { Client } from "pg";
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { als, log, store, reqIdChild } from "./log";

const GUARDDUTY_CLEAN_STATUS = "NO_THREATS_FOUND";
const FINAL_BN_WORKSHEET_DOCUMENT_TYPE = "Final BN Worksheet";
// IF we want to add other file type to run in UIPATH. Add below!
const UIPATH_AUTOMATED_QUEUE_DOCUMENT_TYPES = new Set(["State Application"]);
const PROCESS_PENDING_DOCUMENT_CLEAN = "move_document_from_pending_to_clean";
const PROCESS_PENDING_DOCUMENT_INFECTED = "move_document_from_pending_to_infected";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

let databaseUrlCache = "";
let cacheExpiration = 0;

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
  const secretsManager = new SecretsManagerClient({
    region: AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL,
  });
  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await secretsManager.send(command);

  if (!response.SecretString) {
    throw new Error("The SecretString value is undefined!");
  }
  const secretData = JSON.parse(response.SecretString);
  databaseUrlCache = `postgresql://${secretData.username}:${secretData.password}@${secretData.host}:${secretData.port}/${secretData.dbname}?schema=${process.env.DB_SCHEMA || "demos_app"}`;
  cacheExpiration = now + 60 * 60 * 1000;

  return databaseUrlCache;
}

export async function getApplicationId(client: typeof Client, fileKey: string) {
  const getApplicationIdQuery = `SELECT application_id FROM ${process.env.DB_SCHEMA || "demos_app"}.document_pending_upload WHERE id = $1;`;

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
  const awsClientConfig = {
    region: AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL,
  };
  const s3 = new S3Client(
    process.env.AWS_ENDPOINT_URL
      ? {
          ...awsClientConfig,
          forcePathStyle: true,
        }
      : awsClientConfig
  );
  const uploadBucket = process.env.UPLOAD_BUCKET;

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
  const processDocumentQuery = `SELECT ${process.env.DB_SCHEMA || "demos_app"}.${PROCESS_PENDING_DOCUMENT_CLEAN}($1::UUID, $2::TEXT) AS document_type_id;`;
  const result = await client.query(processDocumentQuery, [
    documentId,
    `${applicationId}/${documentId}`,
  ]);

  const documentTypeId = result.rows[0]?.document_type_id;

  if (!documentTypeId) {
    throw new Error(`No document type returned for document ${documentId}.`);
  }

  log.info({ documentTypeId }, "Successfully processed clean file in database.");

  return documentTypeId;
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
  const processDocumentQuery = `CALL ${process.env.DB_SCHEMA || "demos_app"}.${PROCESS_PENDING_DOCUMENT_INFECTED}($1::UUID, $2::TEXT, $3::TEXT, $4::TEXT);`;
  await client.query(processDocumentQuery, [
    documentId,
    `${applicationId}/${documentId}`,
    scanResultDetails.scanResultStatus ?? "",
    threatsString,
  ]);
  log.info("Successfully processed infected file.");
}

export async function enqueueBudgetNeutrality(
  documentId: string,
  documentTypeId: string
) {
  log.info({ documentId, documentTypeId }, "BudgetNeutrality Queue Started");
  const budgetNeutralityQueueUrl = process.env.BUDGET_NEUTRALITY_QUEUE_URL;

  if (!budgetNeutralityQueueUrl) {
    throw new Error(
      "BUDGET_NEUTRALITY_QUEUE_URL environment variable is required."
    );
  }

  const sqsClient = new SQSClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL,
  });
  const response = await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: budgetNeutralityQueueUrl,
      MessageBody: JSON.stringify({
        documentId,
        documentTypeId,
      }),
    })
  );

  if (!response.MessageId) {
    throw new Error(
      `Failed to enqueue Budget Neutrality validation message for document ${documentId}.`
    );
  }

  log.info(
    { documentId, documentTypeId, messageId: response.MessageId },
    "queued Budget Neutrality validation request."
  );
}

export async function enqueueUiPath(documentId: string) {
  log.info({ documentId }, "UiPath Queue Started");
  const uiPathQueueUrl = process.env.UIPATH_QUEUE_URL;

  if (!uiPathQueueUrl) {
    log.warn({ documentId }, "UIPATH_QUEUE_URL is not configured; skipping UiPath enqueue.");
    return;
  }

  const sqsClient = new SQSClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL,
  });
  const response = await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: uiPathQueueUrl,
      MessageBody: JSON.stringify({
        documentId,
      }),
    })
  );

  if (!response.MessageId) {
    throw new Error(`Failed to enqueue UiPath message for document ${documentId}.`);
  }

  log.info(
    { documentId, messageId: response.MessageId },
    "queued UiPath extraction request."
  );
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
  const destinationBucket = isClean ? process.env.CLEAN_BUCKET : process.env.INFECTED_BUCKET;
  const destinationKey = `${applicationId}/${documentId}`;

  await moveFile(documentId, destinationBucket, destinationKey);

  if (isClean) {
    const fileTypeId = await processCleanDatabaseRecord(client, documentId, applicationId);
    const shouldRunUiPath = UIPATH_AUTOMATED_QUEUE_DOCUMENT_TYPES.has(fileTypeId);

    const uiPathQueueUrl = process.env.UIPATH_QUEUE_URL;

    if (shouldRunUiPath && uiPathQueueUrl) {
      await enqueueUiPath(documentId);
    } else if (shouldRunUiPath) {
      log.warn(
        { documentId, fileTypeId },
        "File Type is correct, but UIPATH_QUEUE_URL is not configured; skipping UiPath enqueue."
      );
    }

    const budgetNeutralityQueueUrl = process.env.BUDGET_NEUTRALITY_QUEUE_URL;
    if (budgetNeutralityQueueUrl && fileTypeId === FINAL_BN_WORKSHEET_DOCUMENT_TYPE) {
      await enqueueBudgetNeutrality(documentId, fileTypeId);
    }
  } else {
    await processInfectedDatabaseRecord(client, documentId, applicationId, scanResultDetails);
  }

  return isClean;
}

export const handler = async (event: SQSEvent, context: Context) =>
  als.run(store, async () => {
    reqIdChild(context.awsRequestId);

    let client;

    const results: Results = {
      processedRecords: 0,
      cleanFiles: 0,
      infectedFiles: 0,
    };

    try {
      const bypassSSL = process.env.BYPASS_SSL;
      const dbSchema = process.env.DB_SCHEMA || "demos_app";
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
