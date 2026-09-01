import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: vi.fn(function (this: any) {
    this.send = send;
  }),
  GetQueueUrlCommand: vi.fn(function (this: any, input) {
    this.input = input;
  }),
  SendMessageCommand: vi.fn(function (this: any, input) {
    this.input = input;
  }),
}));

vi.mock("../log", () => ({
  log: {
    info: vi.fn(),
  },
}));

const message = {
  emailType: "Deliverable Created" as const,
  entityType: "deliverable" as const,
  entityId: "deliverable-1",
  triggeredBy: {
    type: "realtime" as const,
    id: "user-1",
  },
  triggeredAt: "2026-08-26T12:00:00.000Z",
  idempotencyKey: "Deliverable Created:deliverable-action:action-1",
  payload: {
    recipients: {
      to: ["owner@example.com"],
    },
  },
};

describe("emailQueue", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    send.mockReset();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("builds a tracked realtime envelope", async () => {
    const { buildRealtimeEmailEnvelope } = await import("./emailQueue");

    const envelope = buildRealtimeEmailEnvelope({
      emailType: "Deliverable Submitted",
      entityType: "deliverable",
      entityId: "deliverable-1",
      triggeredById: "user-1",
      idempotencyKey: "Deliverable Submitted:deliverable-action:action-1",
      payload: { recipients: { to: [], bcc: [] } },
    });

    expect(envelope).toEqual({
      emailType: "Deliverable Submitted",
      entityType: "deliverable",
      entityId: "deliverable-1",
      triggeredBy: { type: "realtime", id: "user-1" },
      triggeredAt: expect.any(String),
      idempotencyKey: "Deliverable Submitted:deliverable-action:action-1",
      payload: { recipients: { to: [], bcc: [] } },
    });
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
      }),
    );
  });

  it("resolves the default queue when no URL is configured", async () => {
    delete process.env.EMAILER_QUEUE_URL;
    send
      .mockResolvedValueOnce({
        QueueUrl: "http://example.com/resolved-emailer-queue",
      })
      .mockResolvedValueOnce({ MessageId: "message-1" });
    const { enqueueEmail } = await import("./emailQueue");

    await enqueueEmail(message);

    expect(send.mock.calls[0][0]).toMatchObject({
      input: { QueueName: "emailer-queue" },
    });
    expect(send.mock.calls[1][0]).toMatchObject({
      input: { QueueUrl: "http://example.com/resolved-emailer-queue" },
    });
  });

  it("reports when SQS does not return a message id", async () => {
    process.env.EMAILER_QUEUE_URL = "http://example.com/emailer-queue";
    send.mockResolvedValue({});
    const { enqueueEmail } = await import("./emailQueue");

    await expect(enqueueEmail(message)).rejects.toThrow(
      "Failed to enqueue email.",
    );
  });
});
