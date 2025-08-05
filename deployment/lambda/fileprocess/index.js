import { Client } from "pg";
import { S3Client, CopyObjectCommand, DeleteObjectCommand, GetObjectTaggingCommand } from "@aws-sdk/client-s3";

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbUser = process.env.DB_USER || "demos_admin";
const dbName = process.env.DB_NAME || "demos";
const dbSchema = process.env.DB_SCHEMA || "demos_app";
const dbPassword = process.env.DB_PASSWORD || "postgres";
const pgConnectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

const uploadBucket = process.env.UPLOAD_BUCKET;
const cleanBucket = process.env.CLEAN_BUCKET;
const s3 = new S3Client();

const GUARD_DUTY_TAG = "GuardDutyMalwareScanStatus";
const GUARD_DUTY_CLEAN_STATUS = "Clean";

const GET_BUNDLE_ID_FUNCTION = "get_bundle_id_for_document";
const MOVE_DOCUMENT_PROCEDURE = "move_document_from_processing_to_clean";


async function isFileClean(bucket, key) {
    try {
        const tagRes = await s3.send(new GetObjectTaggingCommand({
            Bucket: bucket,
            Key: key,
        }));

        const statusTag = tagRes.TagSet.find(tag => tag.Key === GUARD_DUTY_TAG);
        if (!statusTag) {
            console.log(`No GuardDutyMalwareScanStatus tag found for ${key}`);
            return false;
        }

        return statusTag.Value === GUARD_DUTY_CLEAN_STATUS;
    } catch (err) {
        console.error(`Error fetching tags for ${key} in ${bucket}:`, err);
        return false;
    }
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

async function moveFileToCleanBucket(fileKey, bundleId) {
    const destinationKey = `${bundleId}/${fileKey}`;

    await s3.send(new CopyObjectCommand({
        Bucket: cleanBucket,
        CopySource: `${uploadBucket}/${fileKey}`,
        Key: destinationKey,
    }));

    await s3.send(new DeleteObjectCommand({
        Bucket: uploadBucket,
        Key: fileKey,
    }));

    return destinationKey;
}

async function updateDatabase(client, fileKey, s3Path) {
    const processDocumentQuery = `CALL ${dbSchema}.${MOVE_DOCUMENT_PROCEDURE}($1::UUID, $2::TEXT);`
    await client.query(
        processDocumentQuery,
        [fileKey, `s3://${s3Path}`]
    );
}

async function processFile(client, s3Record) {
    const bucket = s3Record.s3.bucket.name;
    const key = s3Record.s3.object.key;

    console.log(`Processing file: ${bucket}/${key}`);

    const clean = await isFileClean(bucket, key);
    if (!clean) {
        console.log(`File ${key} is not clean. Skipping.`);
        return;
    }

    try {
        const bundleId = await getBundleId(client, key);
        console.log(`Found bundleId: ${bundleId} for key: ${key}`);

        const destinationKey = await moveFileToCleanBucket(key, bundleId);
        console.log(`File moved to ${cleanBucket}/${destinationKey}`);

        const s3Path = `${cleanBucket}/${destinationKey}`;
        await updateDatabase(client, key, s3Path);

        console.log(`Successfully processed file ${key}`);
    } catch (error) {
        console.error(`Failed to process file ${key}:`, error.message);
        throw error;
    }
}

export const handler = async (event) => {
    const client = new Client({ connectionString: pgConnectionString });

    try {
        await client.connect();
        const setSearchPathQuery = `SET search_path TO ${dbSchema}, public;`;
        await client.query(setSearchPathQuery);

        for (const record of event.Records) {
            const body = JSON.parse(record.body);

            if (body.Records && Array.isArray(body.Records)) {
                for (const s3Record of body.Records) {
                    await processFile(client, s3Record);
                }
            }
        }

        return { statusCode: 200, body: "Success" };
    } catch (err) {
        console.error("Lambda execution failed:", err);
        return { statusCode: 500, body: "Internal Server Error" };
    } finally {
        if (client) {
            await client.end();
        }
    }
};