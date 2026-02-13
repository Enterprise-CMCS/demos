import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { log } from "../log";
/**
 * This module provides utilities for enqueuing messages to the UiPath SQS queue.
 * This could be used for other queues as well, we'd just need to pass in the parameters
 */
const region = process.env.AWS_REGION ?? "us-east-1";
const endpoint = process.env.AWS_ENDPOINT_URL;

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
  const cleanBucket = process.env.CLEAN_BUCKET;
  if (! cleanBucket) {
    throw new Error("Clean bucket is not configured.");
  }

  const key = path.replace(/^\/+/, "");
  if (! key) {
    throw new Error("Document s3Path is empty.");
  }

  return { bucket: cleanBucket, key };
}

export async function enqueueUiPath(message: UiPathQueueMessage): Promise<string> {
  const queueUrl = process.env.UIPATH_QUEUE_URL;
  if (! queueUrl) {
    throw new Error("UIPATH_QUEUE_URL is not set.");
  }
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
