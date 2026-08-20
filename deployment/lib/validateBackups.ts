// This is a lambda function that can be used to validate that the S3 restore
// was successful

import { _Object, HeadObjectCommand, paginateListObjectsV2, S3Client } from "@aws-sdk/client-s3";
import { Backup, RestoreJobStatus, RestoreValidationStatus } from "@aws-sdk/client-backup";
import { EventBridgeEvent } from "aws-lambda";
import { randomInt } from "node:crypto";
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Pool } from "pg";

interface RestoreJobCompletedDetail {
  restoreJobId: string,
  backupSizeInBytes: string,
  creationDate: string,
  iamRoleArn: string,
  percentDone: number,
  resourceType: string,
  status: string,
  createdResourceArn: string,
  completionDate:string,
  restoreTestingPlanArn: string,
  backupVaultArn: string,
  recoveryPointArn: string,
  sourceResourceArn: string,
  isParent: boolean,
}

type RestoreJobCompletedEvent = EventBridgeEvent<
  "Restore Job State Change",
  RestoreJobCompletedDetail
>;

const s3 = new S3Client();

export async function selectRandomObjects(bucket: string) {

  const selected = [];
  try {
  const pages = paginateListObjectsV2(
    {
      client: s3,
    },
    {
      Bucket: bucket
    }
  )

  for await (const page of pages) {
    if (!page.Contents) {
      console.log("no page contents")
      return
    }

    const numObjects = page.Contents.length

    if (numObjects == 0) {
      console.log("no objects in response, returning")
      return
    }

    let validCandidate = false
    let guard = 0
    while (!validCandidate && guard < 100) {
      guard++
      const randObj = randomInt(numObjects)
      const candidate = page.Contents[randObj]

      if (!candidate.Key || candidate.Key.endsWith("/")) {
        continue;
      }
      selected.push(candidate)
      validCandidate = true
    }

    if (selected.length >= 5) {
      return selected
    }

  }
  } catch (err) {
    console.log(err)
  } 

  return selected
}

export async function validateSelectedObjects(bucket: string, objectList: _Object[]) {
  const errors = []
  try {
    for (const obj of objectList) {
      const hoc = new HeadObjectCommand({
        Bucket: bucket,
        Key: obj.Key
      })

      const resp = await s3.send(hoc)
      if (resp.ETag != obj.ETag) {
        errors.push({resp, obj})
      }
    }
  } catch(err) {
    console.log(err)
    errors.push(err)
  }
  return errors
}

export function parseBucketName(arn: string): string {
  const splitArn = arn.split(":")
  return splitArn[splitArn.length-1]
}

export async function validateS3Event(event: RestoreJobCompletedEvent) {
  const backupBucket = parseBucketName(event.detail.createdResourceArn)
  const sourceBucket = parseBucketName(event.detail.sourceResourceArn)

  const selectedObjects = await selectRandomObjects(backupBucket)
  
  if (!selectedObjects) {
    throw new Error("no objects were returned");
    
  }

  const errors = await validateSelectedObjects(sourceBucket, selectedObjects)
  if (errors.length > 0) {
    console.log("There were errors...", errors)
  } else {
    console.log("There were no errors. Everything looks good")
  }

  const backupClient = new Backup();
  const response = await backupClient.putRestoreValidationResult({
    RestoreJobId: event.detail.restoreJobId,
    ValidationStatus: errors.length == 0 ? RestoreValidationStatus.SUCCESSFUL : RestoreValidationStatus.FAILED,
    ValidationStatusMessage: "All tested files matched in restore and source bucket"
  })

  console.log("PutRestoreValidationResult: ", response);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "complete"
    })
  }
}

export async function getRDSEndpoint(dbArn: string) {
  console.log("getting rds endpoint")
  const client = new RDSClient()

  const response = await client.send(new DescribeDBInstancesCommand({
    DBInstanceIdentifier: dbArn
  }))

  const endpoint = response.DBInstances?.[0]?.Endpoint

  if (!endpoint?.Address) {
    throw new Error("rds endpoint not found")
  }

  return {
    hostname: endpoint.Address,
    port: endpoint.Port
  }
}

let databaseSecret = "";
export async function getDatabaseSecret() {
  console.log("getting db secret")
  if (databaseSecret) return JSON.parse(databaseSecret);
  const secretsManager = new SecretsManagerClient();
  const secretArn = process.env.DATABASE_SECRET_ARN;
  const response = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretArn }));
  if (!response.SecretString) throw new Error("database secret not defined");
  databaseSecret = response.SecretString;
  return JSON.parse(response.SecretString);
};

export async function getDatabaseURL(arn: string) {
  console.log("in getDatabaseURL")
  const s = await getDatabaseSecret();
  const endpoint = await getRDSEndpoint(arn)
  return `postgresql://${s.username}:${s.password}@${endpoint.hostname}:${endpoint.port}/${s.dbname}`;
};

export async function validateRDSEvent(event: RestoreJobCompletedEvent) {
  console.log("in validateRDSEvent")

  const connectionString = await getDatabaseURL(event.detail.createdResourceArn)
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    options: "-c search_path=demos_app"
  });

  const {rows} = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM amendment) as amendment,  
      (SELECT COUNT(*) FROM application) as application,  
      (SELECT COUNT(*) FROM deliverable) as deliverable,  
      (SELECT COUNT(*) FROM demonstration) as demonstration,  
      (SELECT COUNT(*) FROM document) as document,  
      (SELECT COUNT(*) FROM person) as person,  
      (SELECT COUNT(*) FROM role) as role,  
      (SELECT COUNT(*) FROM state) as state 
  `);

  await pool.end()

  const emptyTables = Object.entries(rows[0])
  .filter(([,count]) => Number(count) <= 0)
  .map(([tableName]) => tableName)


  let success = true;
  if (emptyTables.length > 0) {
    success = false
    console.error(`Empty tables: ${emptyTables.join(",")}`)
  }

  console.log(rows[0])

  const backupClient = new Backup();
  const response = await backupClient.putRestoreValidationResult({
    RestoreJobId: event.detail.restoreJobId,
    ValidationStatus: success ? RestoreValidationStatus.SUCCESSFUL : RestoreValidationStatus.FAILED,
    ValidationStatusMessage: "RDS backup connects successfully and contains data in expected tables"
  })

  console.log("PutRestoreValidationResult: ", response);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "complete"
    })
  }
}

export const handler = async (event: RestoreJobCompletedEvent) => {
  console.log("Source Event", event);

  if (event.detail.status != RestoreJobStatus.COMPLETED) {
    console.log("validation only runs on completed restore jobs")
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "validation only runs on completed restore jobs"
      })
    }
  }
  switch(event.detail.resourceType) {
    case "S3":
      console.log("validating S3")
      return validateS3Event(event)
      case "RDS":
      console.log("validating RDS")
      return validateRDSEvent(event)
    default:
      return {
      statusCode: 400,
      body: JSON.stringify({
        message: `the resource type ${event.detail.resourceType} is not currently supported`
      })
    }
  }
}
