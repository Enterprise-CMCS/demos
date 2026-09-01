import {
  GetQueueUrlCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";

import { PRIMARY_AWS_REGION } from "../constants";
import { log } from "../log";

export const REALTIME_EMAIL_TYPES = [
  "Deliverable Created",
  "Multiple Deliverables Created",
  "Deliverable Submitted",
  "Deliverable Accepted",
  "Deliverable Approved",
  "Deliverable Received and Filed",
  "Deliverable Due Date Updated",
  "Extension Requested",
  "Extension Decision Made",
  "Resubmission Requested",
  "Public Comment Added",
  "Terms And Conditions Requested",
] as const;

export type RealtimeEmailType = (typeof REALTIME_EMAIL_TYPES)[number];
export type RealtimeEmailEntityType = "deliverable" | "reference";

export type RealtimeEmailMessage = {
  emailNotificationId?: string;
  emailType: RealtimeEmailType;
  entityType: RealtimeEmailEntityType;
  entityId: string;
  triggeredBy: {
    type: "realtime";
    id: string;
  };
  triggeredAt: string;
  idempotencyKey: string;
  payload: object;
};

export function buildRealtimeEmailEnvelope(input: {
  emailType: RealtimeEmailType;
  entityType: RealtimeEmailEntityType;
  entityId: string;
  triggeredById: string;
  idempotencyKey: string;
  payload: object;
}): RealtimeEmailMessage {
  return {
    emailType: input.emailType,
    entityType: input.entityType,
    entityId: input.entityId,
    triggeredBy: {
      type: "realtime",
      id: input.triggeredById,
    },
    triggeredAt: new Date().toISOString(),
    idempotencyKey: input.idempotencyKey,
    payload: input.payload,
  };
}

const sqsClient = new SQSClient(
  process.env.AWS_ENDPOINT_URL
    ? {
        region: PRIMARY_AWS_REGION,
        endpoint: process.env.AWS_ENDPOINT_URL,
      }
    : { region: PRIMARY_AWS_REGION },
);

let cachedQueueUrl: string | undefined;

async function getQueueUrl(): Promise<string> {
  const configuredQueueUrl = process.env.EMAILER_QUEUE_URL?.trim();
  if (configuredQueueUrl) {
    return configuredQueueUrl;
  }

  if (cachedQueueUrl) {
    return cachedQueueUrl;
  }

  const queueName = process.env.EMAILER_QUEUE_NAME?.trim() || "emailer-queue";
  const response = await sqsClient.send(
    new GetQueueUrlCommand({
      QueueName: queueName,
    }),
  );
  if (!response.QueueUrl) {
    throw new Error(`Failed to resolve emailer queue URL: ${queueName}`);
  }

  cachedQueueUrl = response.QueueUrl;
  return cachedQueueUrl;
}

export async function enqueueEmail(
  message: RealtimeEmailMessage,
): Promise<string> {
  const queueUrl = await getQueueUrl();
  const response = await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    }),
  );
  if (!response.MessageId) {
    throw new Error("Failed to enqueue email.");
  }

  log.info(
    {
      messageId: response.MessageId,
      emailType: message.emailType,
      entityId: message.entityId,
    },
    "Email queued",
  );
  return response.MessageId;
}
