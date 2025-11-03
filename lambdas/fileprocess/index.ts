import { SQSEvent, GuardDutyScanResultNotificationEvent, Context } from "aws-lambda";

import { Client } from "pg";
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { als, log, store, reqIdChild } from "./log";

const uploadBucket = process.env.UPLOAD_BUCKET;
const cleanBucket = process.env.CLEAN_BUCKET;
const dbSchema = process.env.DB_SCHEMA || "demos_app";

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

const GUARDDUTY_CLEAN_STATUS = "NO_THREATS_FOUND";
const MOVE_DOCUMENT_PROCEDURE = "move_document_from_processing_to_clean";

let databaseUrlCache = "";
let cacheExpiration = 0;

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

export function isGuardDutyScanClean(guardDutyEvent: GuardDutyScanResultNotificationEvent) {
  try {
    if (guardDutyEvent["detail-type"] !== "GuardDuty Malware Protection Object Scan Result") {
      log.warn("not a GuardDuty Malware Protection scan result");
      return false;
    }

    if (guardDutyEvent.detail?.scanStatus !== "COMPLETED") {
      log.debug({ status: guardDutyEvent.detail?.scanStatus }, "scan not completed");
      return false;
    }

    const scanResultStatus = guardDutyEvent.detail?.scanResultDetails?.scanResultStatus;
    if (scanResultStatus !== GUARDDUTY_CLEAN_STATUS) {
      log.warn(
        { status: scanResultStatus, objectKey: guardDutyEvent.detail.s3ObjectDetails.objectKey },
        "file not clean"
      );
      return false;
    }

    log.debug({ objectKey: guardDutyEvent.detail.s3ObjectDetails.objectKey }, "file is clean");
    return true;
  } catch (error) {
    log.error({ error }, "error parsing GuardDuty event");
    return false;
  }
}

export function extractS3InfoFromGuardDuty(guardDutyEvent: GuardDutyScanResultNotificationEvent) {
  const s3Details = guardDutyEvent.detail?.s3ObjectDetails;
  if (!s3Details) {
    throw new Error("No S3 object details found in GuardDuty event");
  }

  return {
    bucket: s3Details.bucketName,
    key: s3Details.objectKey,
  };
}

export async function getApplicationId(client: typeof Client, fileKey: string) {
  const getApplicationIdQuery = `SELECT application_id FROM ${dbSchema}.document_pending_upload WHERE id = $1;`;

  try {
    const result = await client.query(getApplicationIdQuery, [fileKey]);

    if (result.rows.length === 0 || !result.rows[0].application_id) {
      throw new Error(`No document_pending_upload record found for key: ${fileKey}`);
    }

    return result.rows[0].application_id;
  } catch (error) {
    throw new Error(`Failed to get application ID for key ${fileKey}: ${(error as Error).message}`);
  }
}

export async function moveFileToCleanBucket(fileKey: string, applicationId: string, sourceBucket = uploadBucket) {
  const destinationKey = `${applicationId}/${fileKey}`;

  log.debug(
    {
      from: {
        sourceBucket,
        fileKey,
      },
      to: {
        cleanBucket,
        destinationKey,
      },
    },
    "moving file to clean bucket"
  );

  await s3.send(
    new CopyObjectCommand({
      Bucket: cleanBucket,
      CopySource: `${sourceBucket}/${fileKey}`,
      Key: destinationKey,
    })
  );

  log.info("successfully copied file to clean bucket");

  await s3.send(
    new DeleteObjectCommand({
      Bucket: sourceBucket,
      Key: fileKey,
    })
  );

  log.info(`successfully deleted file from source bucket`);

  return destinationKey;
}

async function updateDatabase(client: typeof Client, fileKey: string, s3Path: string) {
  const processDocumentQuery = `CALL ${dbSchema}.${MOVE_DOCUMENT_PROCEDURE}($1::UUID, $2::TEXT);`;
  log.info({ s3Path }, "updating database with s3Path");
  await client.query(processDocumentQuery, [fileKey, s3Path]);
}

export async function processGuardDutyResult(
  client: typeof Client,
  guardDutyEvent: GuardDutyScanResultNotificationEvent
) {
  const s3Info = extractS3InfoFromGuardDuty(guardDutyEvent);
  const { bucket, key } = s3Info;

  log.info({ bucket, key }, "processing clean file");

  try {
    const applicationId = await getApplicationId(client, key);
    log.debug({ applicationId, key }, "found applicationId");

    const destinationKey = await moveFileToCleanBucket(key, applicationId, bucket);
    log.debug({cleanBucket, destinationKey}, `file moved to clean bucket`);

    const s3Path = `s3://${cleanBucket}/${destinationKey}`;
    await updateDatabase(client, key, s3Path);

    log.info({key},`successfully processed clean file`);
  } catch (error) {
    log.error({error: (error as Error).message}, `failed to process clean file ${key}:`);
    throw error;
  }
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

    interface FileInfo {
      bucket: string;
      key: string;
      status: string;
    }

    interface Results {
      processedRecords: number;
      cleanFiles: FileInfo[];
      infectedFiles: FileInfo[];
      errors: string[];
    }

    const results: Results = {
      processedRecords: 0,
      cleanFiles: [],
      infectedFiles: [],
      errors: [],
    };

    try {
      client = new Client({
        connectionString: await getDatabaseUrl(),
        ssl: {
          rejectUnauthorized: true,
        },
      });
      await client.connect();
      const setSearchPathQuery = `SET search_path TO ${dbSchema}, public;`;
      await client.query(setSearchPathQuery);

      // Process each record - if any fails, the entire Lambda should fail
      for (const record of event.Records) {
        try {
          const guardDutyEvent: GuardDutyScanResultNotificationEvent = JSON.parse(record.body);
          log.debug({ guardDutyEvent }, "Received GuardDuty event");

          const s3Info = extractS3InfoFromGuardDuty(guardDutyEvent);
          const { bucket, key } = s3Info;
          const isClean = isGuardDutyScanClean(guardDutyEvent);

          if (isClean) {
            await processGuardDutyResult(client, guardDutyEvent);
            results.cleanFiles.push({
              bucket,
              key,
              status: "processed",
            });
          } else {
            log.warn(`File ${key} is not clean. Skipping processing.`);
            results.infectedFiles.push({
              bucket,
              key,
              status: "skipped",
            });
          }

          results.processedRecords++;
        } catch (error) {
          log.error({ error: error.message }, "error processing record");
          results.errors.push((error as Error).message);
          throw error;
        }
      }

      log.info({ results }, "all records processed successfully");

      return {
        statusCode: 200,
        body: `Processed ${results.processedRecords} records: ${results.cleanFiles.length} clean files processed, ${results.infectedFiles.length} infected files skipped`,
      };
    } catch (error) {
      log.error({ error: error.message }, "lambda execution failed");
      throw new Error(`Lambda failed: ${(error as Error).message}`);
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (closeError) {
          log.error({ error: closeError }, "error closing database connection");
        }
      }
    }
  });
