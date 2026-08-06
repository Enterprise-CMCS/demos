import { GetQueueUrlCommand, SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import {
  EMAIL_NOTIFICATION_ENTITY_TYPES,
  EMAIL_NOTIFICATION_TYPE_ENTITY_TYPES,
  EMAIL_NOTIFICATION_TYPES,
  PRIMARY_AWS_REGION,
} from "../constants";
import { log } from "../log";

export const REALTIME_EMAIL_TYPES = EMAIL_NOTIFICATION_TYPES;

export type RealtimeEmailType = (typeof REALTIME_EMAIL_TYPES)[number];
export type RealtimeEmailEntityType = (typeof EMAIL_NOTIFICATION_ENTITY_TYPES)[number];

export type RealtimeEmailEnvelope = {
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

const region = PRIMARY_AWS_REGION;
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

async function resolveEmailQueueUrl(): Promise<string> {
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
    })
  );

  if (!response.QueueUrl) {
    throw new Error(`Failed to resolve emailer queue URL for queue: ${queueName}`);
  }

  cachedQueueUrl = response.QueueUrl;
  return cachedQueueUrl;
}

export function buildRealtimeEmailEnvelope(input: {
  emailType: string;
  entityType: string;
  entityId: string;
  triggeredById: string;
  idempotencyKey?: string;
  payload: RealtimeEmailEnvelope["payload"];
}): RealtimeEmailEnvelope {
  if (!REALTIME_EMAIL_TYPES.includes(input.emailType as RealtimeEmailType)) {
    throw new Error(`Unsupported realtime email type: ${input.emailType}`);
  }
  if (!EMAIL_NOTIFICATION_ENTITY_TYPES.includes(input.entityType as RealtimeEmailEntityType)) {
    throw new Error(`Unsupported realtime email entity type: ${input.entityType}`);
  }
  if (
    !EMAIL_NOTIFICATION_TYPE_ENTITY_TYPES.some(
      ([emailType, entityType]) =>
        emailType === input.emailType && entityType === input.entityType
    )
  ) {
    throw new Error(
      `Unsupported realtime email type/entity type combination: ${input.emailType} / ${input.entityType}`
    );
  }

  return {
    emailType: input.emailType as RealtimeEmailType,
    entityType: input.entityType as RealtimeEmailEntityType,
    entityId: input.entityId,
    triggeredBy: {
      type: "realtime",
      id: input.triggeredById,
    },
    triggeredAt: new Date().toISOString(),
    idempotencyKey:
      input.idempotencyKey ?? `${input.emailType}:${input.entityType}:${input.entityId}`,
    payload: input.payload,
  };
}

export async function enqueueRealtimeEmail(message: RealtimeEmailEnvelope): Promise<string> {
  const queueUrl = await resolveEmailQueueUrl();
  log.info(
    {
      emailType: message.emailType,
      entityType: message.entityType,
      entityId: message.entityId,
      idempotencyKey: message.idempotencyKey,
    },
    "Sending message to emailer queue"
  );

  const response = await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    })
  );

  if (!response.MessageId) {
    throw new Error("Failed to enqueue realtime email message.");
  }

  log.info(
    {
      messageId: response.MessageId,
      emailType: message.emailType,
      entityType: message.entityType,
      entityId: message.entityId,
      idempotencyKey: message.idempotencyKey,
    },
    "Email queued"
  );

  return response.MessageId;
}
