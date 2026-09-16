import { SendMessageCommand } from "@aws-sdk/client-sqs";
import type { SQSClient } from "@aws-sdk/client-sqs";
import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EMAILER_QUEUE_URL } from "../..";
import type { Payload } from "./createEmailNotificationRecord";
import {
  Envelope,
  sendSqsNotification,
  UPDATE_EMAIL_NOTIFICATION_FAILED_QUERY,
  UPDATE_SQS_MESSAGE_ID_QUERY,
} from "./sendSqsNotification";

const payload: Payload = {
  recipients: {
    to: [],
    bcc: [{ name: "Jane Doe", address: "jane@example.com" }],
  },
  demonstration: { name: "Test Demonstration", stateId: "CA" },
  deliverable: {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Test Deliverable",
    deliverableTypeId: "Quarterly Report",
    dueDate: "2026-09-20T00:00:00.000Z",
    statusId: "Upcoming",
  },
  reminderStage: "Five Days Prior",
};

const envelope: Envelope = {
  emailNotificationId: "44444444-4444-4444-4444-444444444444",
  emailType: "Deliverable Due Date Reminder",
  entityType: "deliverable",
  entityId: payload.deliverable.id,
  idempotencyKey: `deliverable-due-date-reminder:${payload.deliverable.id}:${payload.deliverable.dueDate}`,
  payload,
};

const emailNotificationId = envelope.emailNotificationId;

describe("sendSqsNotification", () => {
  const query = vi.fn();
  const send = vi.fn();
  const client = { query } as unknown as PoolClient;
  const sqsClient = { send } as unknown as SQSClient;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("sends the envelope to the emailer queue and records the sqs message id", async () => {
    send.mockResolvedValue({ MessageId: "msg-1" });

    await sendSqsNotification(client, sqsClient, emailNotificationId, envelope);

    expect(send).toHaveBeenCalledExactlyOnceWith(expect.any(SendMessageCommand));
    expect((send.mock.calls[0][0] as SendMessageCommand).input).toEqual({
      QueueUrl: EMAILER_QUEUE_URL,
      MessageBody: JSON.stringify(envelope),
    });
    expect(query).toHaveBeenCalledExactlyOnceWith(UPDATE_SQS_MESSAGE_ID_QUERY, [
      emailNotificationId,
      "msg-1",
    ]);
  });

  it("marks the notification failed and rethrows when the send fails", async () => {
    send.mockRejectedValue(new Error("sqs down"));

    await expect(
      sendSqsNotification(client, sqsClient, emailNotificationId, envelope)
    ).rejects.toThrow("sqs down");

    expect(query).toHaveBeenCalledExactlyOnceWith(UPDATE_EMAIL_NOTIFICATION_FAILED_QUERY, [
      emailNotificationId,
      "sqs down",
    ]);
  });

  it("does not mark the notification failed when the send succeeds but recording the message id fails", async () => {
    send.mockResolvedValue({ MessageId: "msg-1" });
    query.mockRejectedValue(new Error("db down"));

    await expect(
      sendSqsNotification(client, sqsClient, emailNotificationId, envelope)
    ).rejects.toThrow("db down");

    expect(query).toHaveBeenCalledExactlyOnceWith(UPDATE_SQS_MESSAGE_ID_QUERY, [
      emailNotificationId,
      "msg-1",
    ]);
  });
});
