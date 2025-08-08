import { Client } from "pg";
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const uploadBucket = process.env.UPLOAD_BUCKET;
const cleanBucket = process.env.CLEAN_BUCKET;
const dbSchema = process.env.DB_SCHEMA || "demos_app";

const s3Config = process.env.AWS_ENDPOINT_URL
  ? {
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL,
      forcePathStyle: true,
    }
  : undefined;

const s3 = new S3Client(s3Config);

const secretsManagerConfig = process.env.AWS_ENDPOINT_URL
  ? {
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL,
    }
  : { region: process.env.AWS_REGION };

const secretsManager = new SecretsManagerClient(secretsManagerConfig);

const GUARDDUTY_CLEAN_STATUS = "NO_THREATS_FOUND";
const GET_BUNDLE_ID_FUNCTION = "get_bundle_id_for_document";
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

function isGuardDutyScanClean(guardDutyEvent) {
  try {
    if (guardDutyEvent["detail-type"] !== "GuardDuty Malware Protection Object Scan Result") {
      console.log("Not a GuardDuty Malware Protection scan result");
      return false;
    }

    if (guardDutyEvent.detail?.scanStatus !== "COMPLETED") {
      console.log(`Scan not completed. Status: ${guardDutyEvent.detail?.scanStatus}`);
      return false;
    }

    const scanResultStatus = guardDutyEvent.detail?.scanResultDetails?.scanResultStatus;
    if (scanResultStatus !== GUARDDUTY_CLEAN_STATUS) {
      console.log(`File not clean. Scan result: ${scanResultStatus}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error parsing GuardDuty event:", error);
    return false;
  }
}

function extractS3InfoFromGuardDuty(guardDutyEvent) {
  const s3Details = guardDutyEvent.detail?.s3ObjectDetails;
  if (!s3Details) {
    throw new Error("No S3 object details found in GuardDuty event");
  }

  return {
    bucket: s3Details.bucketName,
    key: s3Details.objectKey,
  };
}

async function getBundleId(client, fileKey) {
  const getBundleIdQuery = `SELECT ${dbSchema}.${GET_BUNDLE_ID_FUNCTION}($1::UUID) AS bundle_id;`;

  try {
    const result = await client.query(getBundleIdQuery, [fileKey]);

    if (result.rows.length === 0 || !result.rows[0].bundle_id) {
      throw new Error(`No document_pending_upload record found for key: ${fileKey}`);
    }

    return result.rows[0].bundle_id;
  } catch (error) {
    throw new Error(`Failed to get bundle ID for key ${fileKey}: ${error.message}`);
  }
}

async function moveFileToCleanBucket(fileKey, bundleId, sourceBucket = uploadBucket) {
  const destinationKey = `${bundleId}/${fileKey}`;

  console.log(
    `Moving file from s3://${sourceBucket}/${fileKey} to s3://${cleanBucket}/${destinationKey}`
  );

  await s3.send(
    new CopyObjectCommand({
      Bucket: cleanBucket,
      CopySource: `${sourceBucket}/${fileKey}`,
      Key: destinationKey,
    })
  );

  console.log(`Successfully copied file to clean bucket`);

  await s3.send(
    new DeleteObjectCommand({
      Bucket: sourceBucket,
      Key: fileKey,
    })
  );

  console.log(`Successfully deleted file from source bucket`);

  return destinationKey;
}

async function updateDatabase(client, fileKey, s3Path) {
  const processDocumentQuery = `CALL ${dbSchema}.${MOVE_DOCUMENT_PROCEDURE}($1::UUID, $2::TEXT);`;
  console.log(`Updating database with s3Path: ${s3Path}`);
  await client.query(processDocumentQuery, [fileKey, s3Path]);
}

async function processGuardDutyResult(client, guardDutyEvent) {
  const s3Info = extractS3InfoFromGuardDuty(guardDutyEvent);
  const { bucket, key } = s3Info;

  console.log(`Processing clean file: ${bucket}/${key}`);

  try {
    const bundleId = await getBundleId(client, key);
    console.log(`Found bundleId: ${bundleId} for key: ${key}`);

    const destinationKey = await moveFileToCleanBucket(key, bundleId, bucket);
    console.log(`File moved to ${cleanBucket}/${destinationKey}`);

    const s3Path = `s3://${cleanBucket}/${destinationKey}`;
    await updateDatabase(client, key, s3Path);

    console.log(`Successfully processed clean file ${key}`);
  } catch (error) {
    console.error(`Failed to process clean file ${key}:`, error.message);
    throw error;
  }
}

export const handler = async (event) => {
  console.log("Environment variables:", {
    AWS_REGION: process.env.AWS_REGION,
    AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,
    UPLOAD_BUCKET: uploadBucket,
    CLEAN_BUCKET: cleanBucket,
    DB_SCHEMA: dbSchema,
  });

  let client;
  const results = {
    processedRecords: 0,
    cleanFiles: [],
    infectedFiles: [],
    errors: []
  };

  try {
    client = new Client({ connectionString: await getDatabaseUrl() });
    await client.connect();
    const setSearchPathQuery = `SET search_path TO ${dbSchema}, public;`;
    await client.query(setSearchPathQuery);

    // Process each record - if any fails, the entire Lambda should fail
    for (const record of event.Records) {
      try {
        const guardDutyEvent = JSON.parse(record.body);
        console.log("Received GuardDuty event:", JSON.stringify(guardDutyEvent, null, 2));
        
        const s3Info = extractS3InfoFromGuardDuty(guardDutyEvent);
        const { bucket, key } = s3Info;
        const isClean = isGuardDutyScanClean(guardDutyEvent);

        if (isClean) {
          await processGuardDutyResult(client, guardDutyEvent);
          results.cleanFiles.push({
            bucket,
            key,
            status: 'processed'
          });
        } else {
          console.log(`File ${key} is not clean. Skipping processing.`);
          results.infectedFiles.push({
            bucket,
            key,
            status: 'skipped'
          });
        }

        results.processedRecords++;
      } catch (error) {
        console.error("Error processing record:", error);
        results.errors.push(error.message);
        throw error;
      }
    }

    console.log("All records processed successfully");
    console.log("Processing summary:", results);

    return { 
      statusCode: 200, 
      body: `Processed ${results.processedRecords} records: ${results.cleanFiles.length} clean files processed, ${results.infectedFiles.length} infected files skipped`
    };

  } catch (error) {
    console.error("Lambda execution failed:", error);
    throw new Error(`Lambda failed: ${error.message}`);
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (closeError) {
        console.error("Error closing database connection:", closeError);
      }
    }
  }
};
