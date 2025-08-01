import { Client } from "pg";
import { S3Client, CopyObjectCommand, DeleteObjectCommand, GetObjectTaggingCommand } from "@aws-sdk/client-s3";

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbUser = process.env.DB_USER || "demos_admin";
const dbName = process.env.DB_NAME || "demos";
const dbPassword = process.env.DB_PASSWORD || "<password>";
const pgConnectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

const uploadBucket = process.env.UPLOAD_BUCKET;
const cleanBucket = process.env.CLEAN_BUCKET;
const s3 = new S3Client();

async function isFileClean(bucket, key) {
    try {
        const tagRes = await s3.send(new GetObjectTaggingCommand({
            Bucket: bucket,
            Key: key,
        }));
        const statusTag = tagRes.TagSet.find(tag => tag.Key === "GuardDutyMalwareScanStatus");
        if (!statusTag) {
            console.log(`No GuardDutyMalwareScanStatus tag found for ${key}`);
            return false;
        }
        if (statusTag.Value === "Clean") {
            return true;
        } else if (statusTag.Value === "Infected") {
            return false;
        } else {
            console.log(`Unknown GuardDutyMalwareScanStatus value: ${statusTag.Value} for ${key}`);
            return false;
        }
    } catch (err) {
        console.error(`Error fetching tags for ${key} in ${bucket}:`, err);
        return false;
    }
}

export const handler = async (event) => {
    console.log("Received SQS event:", JSON.stringify(event, null, 2));

    const client = new Client({ connectionString: pgConnectionString });
    try {
        await client.connect();
        for (const record of event.Records) {
            const body = JSON.parse(record.body);
            if (body.Records && Array.isArray(body.Records)) {
                for (const s3Record of body.Records) {
                    const bucket = s3Record.s3.bucket.name;
                    const key = s3Record.s3.object.key;

                    console.log(`File uploaded: ${bucket}/${key}`);
                    
                    const clean = await isFileClean(bucket, key);

                    if (!clean) {
                        console.log(`File ${key} in ${bucket} is NOT clean according to GuardDuty. Skipping.`);
                        continue;
                    }
                    // Copy to clean bucket
                    await s3.send(new CopyObjectCommand({
                        Bucket: cleanBucket,
                        CopySource: `${uploadBucket}/${key}`,
                        Key: key,
                    }));
                    // Delete from upload bucket
                    await s3.send(new DeleteObjectCommand({
                        Bucket: uploadBucket,
                        Key: key,
                    }));
                    
                    await client.query("UPDATE document set s3_path = $1 WHERE s3_path = $2", [cleanBucket + "/" + key, bucket + "/" + key]);
                    console.log(`Moved file ${key} from ${uploadBucket} to ${cleanBucket}`);
                }
            }
        }
    } catch (err) {
        console.error("Database connection/query error:", err);
        return { statusCode: 500, body: "Internal Server Error" };
    }
    finally {
        if (client) {
            await client.end();
        }
    }
    return { statusCode: 200 };
};
