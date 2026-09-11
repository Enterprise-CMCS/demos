import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: vi.fn(function (this: { send: typeof send }) {
    this.send = send;
  }),
  GetQueueUrlCommand: vi.fn(function (this: { input: unknown }, input: unknown) {
    this.input = input;
  }),
  SendMessageCommand: vi.fn(function (this: { input: unknown }, input: unknown) {
    this.input = input;
  }),
}));

vi.mock("../log", () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { log } from "../log";
import { prisma } from "../prismaClient";

const message = {
  emailType: "Deliverable Created" as const,
  entityType: "deliverable" as const,
  entityId: "deliverable-1",
  triggeredBy: {
    type: "realtime" as const,
    id: "user-1",
  },
  payload: {
    recipients: {
      to: ["owner@example.com"],
    },
  },
};

describe("emailQueue", () => {
  const originalEnv = { ...process.env };
  const transaction = vi.fn();
  const update = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    send.mockReset();
    process.env = { ...originalEnv };
    delete process.env.DISABLE_EMAIL_NOTIFICATIONS;
    vi.mocked(prisma).mockReturnValue({ $transaction: transaction } as never);
    transaction.mockImplementation((callback) =>
      callback({ emailNotification: { update } })
    );
    update.mockResolvedValue({ id: "notification-1" });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("sends the email envelope to the configured queue", async () => {
    process.env.EMAILER_QUEUE_URL = "http://example.com/emailer-queue";
    send.mockResolvedValue({ MessageId: "message-1" });
    const { enqueueEmail } = await import("./emailQueue");

    await expect(enqueueEmail(message)).resolves.toBe("message-1");
    expect(send).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        input: {
          QueueUrl: "http://example.com/emailer-queue",
          MessageBody: JSON.stringify(message),
        },
      })
    );
  });

  it("does not contact SQS when email notifications are disabled", async () => {
    process.env.DISABLE_EMAIL_NOTIFICATIONS = "true";
    const { enqueueEmail } = await import("./emailQueue");

    await expect(enqueueEmail(message)).resolves.toBeNull();
    expect(send).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("marks a tracked notification queued before sending it to SQS", async () => {
    process.env.EMAILER_QUEUE_URL = "http://example.com/emailer-queue";
    send.mockResolvedValue({ MessageId: "message-1" });
    const { enqueueEmail } = await import("./emailQueue");
    const trackedMessage = {
      ...message,
      emailNotificationId: "notification-1",
    };

    await expect(enqueueEmail(trackedMessage)).resolves.toBe("message-1");

    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: "notification-1" },
      data: { statusId: "Queued" },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: "notification-1" },
      data: { sqsMessageId: "message-1" },
    });
    expect(update.mock.invocationCallOrder[0]).toBeLessThan(send.mock.invocationCallOrder[0]);
  });

  it("marks a tracked notification failed when SQS rejects it", async () => {
    process.env.EMAILER_QUEUE_URL = "http://example.com/emailer-queue";
    send.mockRejectedValue(new Error("queue unavailable"));
    const { enqueueEmail } = await import("./emailQueue");

    await expect(
      enqueueEmail({ ...message, emailNotificationId: "notification-1" })
    ).rejects.toThrow("queue unavailable");

    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: "notification-1" },
      data: { statusId: "Queued" },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: "notification-1" },
      data: {
        statusId: "Failed",
        lastError: "queue unavailable",
      },
    });
  });

  it("preserves the queue error when recording the failure also fails", async () => {
    process.env.EMAILER_QUEUE_URL = "http://example.com/emailer-queue";
    send.mockRejectedValue(new Error("queue unavailable"));
    update
      .mockResolvedValueOnce({ id: "notification-1" })
      .mockRejectedValueOnce(new Error("database unavailable"));
    const { enqueueEmail } = await import("./emailQueue");

    await expect(
      enqueueEmail({ ...message, emailNotificationId: "notification-1" })
    ).rejects.toThrow("queue unavailable");

    expect(log.error).toHaveBeenCalledWith(
      {
        error: expect.objectContaining({ message: "database unavailable" }),
        emailNotificationId: "notification-1",
      },
      "Failed to record email notification queue failure"
    );
  });

  it("resolves the named queue when no URL is configured", async () => {
    delete process.env.EMAILER_QUEUE_URL;
    process.env.EMAILER_QUEUE_NAME = "custom-emailer-queue";
    send
      .mockResolvedValueOnce({
        QueueUrl: "http://example.com/resolved-emailer-queue",
      })
      .mockResolvedValueOnce({ MessageId: "message-1" });
    const { enqueueEmail } = await import("./emailQueue");

    await enqueueEmail(message);

    expect(send.mock.calls[0][0]).toMatchObject({
      input: { QueueName: "custom-emailer-queue" },
    });
    expect(send.mock.calls[1][0]).toMatchObject({
      input: { QueueUrl: "http://example.com/resolved-emailer-queue" },
    });
  });

  it("reports when SQS does not return a message ID", async () => {
    process.env.EMAILER_QUEUE_URL = "http://example.com/emailer-queue";
    send.mockResolvedValue({});
    const { enqueueEmail } = await import("./emailQueue");

    await expect(enqueueEmail(message)).rejects.toThrow(
      "Failed to enqueue email: SQS did not return a message ID."
    );
  });
});
