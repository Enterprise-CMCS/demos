import { GetQueueUrlCommand, SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { log } from "../log";
/**
 * This module provides utilities for enqueuing messages to the UiPath SQS queue.
 * This could be used for other queues as well, we'd just need to pass in the parameters
 */
const region = process.env.AWS_REGION ?? "us-east-1";
const endpoint = process.env.AWS_ENDPOINT_URL;
let cachedQueueUrl: string | null = null;

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
  fileNameWithExtension?: string;
};

type ParsedS3Location = {
  bucket: string;
  key: string;
};

export function parseS3Path(path: string): ParsedS3Location {
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    throw new Error("Document s3Path is empty.");
  }

  const s3UriMatch = trimmedPath.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (s3UriMatch?.[1] && s3UriMatch?.[2]) {
    return { bucket: s3UriMatch[1], key: s3UriMatch[2] };
  }

  if (trimmedPath.startsWith("s3://")) {
    throw new Error(`Document s3Path is not a valid S3 URI: ${path}`);
  }

  const cleanBucket = process.env.CLEAN_BUCKET;
  if (! cleanBucket) {
    throw new Error("Clean bucket is not configured.");
  }

  const key = trimmedPath.replace(/^\/+/, "");
  if (! key) {
    throw new Error("Document s3Path is empty.");
  }

  return { bucket: cleanBucket, key };
}

async function resolveUiPathQueueUrl(): Promise<string> {
  const configuredQueueUrl = process.env.UIPATH_QUEUE_URL?.trim();
  if (configuredQueueUrl) {
    return configuredQueueUrl;
  }

  if (cachedQueueUrl) {
    return cachedQueueUrl;
  }

  const queueName = process.env.UIPATH_QUEUE_NAME?.trim() || "uipath-queue";
  const response = await sqsClient.send(
    new GetQueueUrlCommand({
      QueueName: queueName,
    })
  );

  if (! response.QueueUrl) {
    throw new Error(`Failed to resolve UiPath queue URL for queue: ${queueName}`);
  }

  cachedQueueUrl = response.QueueUrl;
  return cachedQueueUrl;
}

export async function enqueueUiPath(message: UiPathQueueMessage): Promise<string> {
  const queueUrl = await resolveUiPathQueueUrl();
  log.info({ message }, "Sending message to UiPath queue");

  const response = await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    })
  );

  if (! response.MessageId) {
    throw new Error("Failed to enqueue UiPath message.");
  }

  return response.MessageId;
}
