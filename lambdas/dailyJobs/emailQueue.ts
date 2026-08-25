import { GetQueueUrlCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient(
  process.env.AWS_ENDPOINT_URL
    ? {
        region: process.env.AWS_REGION ?? "us-east-1",
        endpoint: process.env.AWS_ENDPOINT_URL,
      }
    : {}
);

let cachedQueueUrl: string | null = null;

export function __resetEmailQueueForTests(): void {
  cachedQueueUrl = null;
}

async function resolveEmailQueueUrl(): Promise<string> {
  const configuredQueueUrl = process.env.EMAILER_QUEUE_URL?.trim();
  if (configuredQueueUrl) {
    return configuredQueueUrl;
  }

  if (cachedQueueUrl) {
    return cachedQueueUrl;
  }

  const queueName = process.env.EMAILER_QUEUE_NAME?.trim() || "emailer-queue";
  const response = await sqsClient.send(new GetQueueUrlCommand({ QueueName: queueName }));
  if (!response.QueueUrl) {
    throw new Error(`Failed to resolve emailer queue URL for queue: ${queueName}`);
  }

  cachedQueueUrl = response.QueueUrl;
  return cachedQueueUrl;
}

export async function enqueueEmail(message: object): Promise<string> {
  const queueUrl = await resolveEmailQueueUrl();
  const response = await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    })
  );

  if (!response.MessageId) {
    throw new Error("Failed to enqueue email message.");
  }

  return response.MessageId;
}
