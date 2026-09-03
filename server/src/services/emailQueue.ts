import {
  GetQueueUrlCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";

import { PRIMARY_AWS_REGION } from "../constants";
import { log } from "../log";

type DeliverableRealtimeEmailType =
  | "Deliverable Created"
  | "Deliverable Submitted"
  | "Deliverable Accepted"
  | "Deliverable Approved"
  | "Deliverable Received and Filed"
  | "Deliverable Due Date Updated"
  | "Extension Requested"
  | "Extension Decision Made"
  | "Resubmission Requested"
  | "Public Comment Added";

type RealtimeEmailTarget =
  | {
      emailType: DeliverableRealtimeEmailType;
      entityType: "deliverable";
    }
  | {
      emailType: "Application Status Updated";
      entityType: "application";
    }
  | {
      emailType: "Terms And Conditions Requested";
      entityType: "application" | "reference" | "reference_agreement";
    };

export type RealtimeEmailMessage = RealtimeEmailTarget & {
  emailNotificationId?: string;
  entityId: string;
  triggeredBy: {
    type: "realtime";
    id: string;
  };
  triggeredAt: string;
  payload: object;
};

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
