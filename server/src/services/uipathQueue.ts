import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { UIPATH_PROJECT_IDS } from "../constants";

const region = process.env.AWS_REGION ?? "us-east-1";
const endpoint = process.env.AWS_ENDPOINT_URL;
const uipathModelId = UIPATH_PROJECT_IDS[0];

const sqsClient = new SQSClient(
  endpoint
    ? {
        region,
        endpoint,
      }
    : { region }
);

export type UiPathQueueMessage = {
  s3Bucket: string;
  s3FileName: string;
  projectId: string;
  fileNameWithExtension?: string;
};

type ParsedS3Location = {
  bucket: string;
  key: string;
};

export function parseS3Path(path: string, fallbackBucket?: string): ParsedS3Location {
  if (path.startsWith("s3://")) {
    const parsed = new URL(path);
    const key = parsed.pathname.replace(/^\/+/, "");
    if (!parsed.hostname || !key) {
      throw new Error(`Invalid s3Path: ${path}`);
    }
    return { bucket: parsed.hostname, key };
  }

  if (!fallbackBucket) {
    throw new Error("Clean bucket is not configured.");
  }

  const key = path.replace(/^\/+/, "");
  if (!key) {
    throw new Error("Document s3Path is empty.");
  }

  return { bucket: fallbackBucket, key };
}

export async function enqueueUiPath(message: UiPathQueueMessage): Promise<string> {
  const queueUrl = process.env.UIPATH_QUEUE_URL;
  if (!queueUrl) {
    throw new Error("UIPATH_QUEUE_URL is not set.");
  }

  const response = await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    })
  );

  if (!response.MessageId) {
    throw new Error("Failed to enqueue UiPath message.");
  }

  return response.MessageId;
}
