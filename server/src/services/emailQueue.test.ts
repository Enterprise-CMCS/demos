import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@aws-sdk/client-sqs", () => {
  return {
    SQSClient: vi.fn(function(this: any) {
      this.send = sendMock;
    }),
    SendMessageCommand: vi.fn(function(this: any, input) {
      this.input = input;
    }),
    GetQueueUrlCommand: vi.fn(function(this: any, input) {
      this.input = input;
    }),
  };
});

const loadModule = async () => {
  return await import("./emailQueue");
};

describe("emailQueue", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("builds a generic realtime email envelope", async () => {
    const { buildRealtimeEmailEnvelope } = await loadModule();

    const out = buildRealtimeEmailEnvelope({
      emailType: "Deliverable Created",
      entityType: "application",
      entityId: "del-123",
      triggeredById: "user-123",
      payload: {
        to: "owner@example.com",
        id: "del-123",
        name: "Quarterly Budget Report",
      },
    });

    expect(out.emailType).toBe("Deliverable Created");
    expect(out).not.toHaveProperty("template");
    expect(out.entityType).toBe("application");
    expect(out.entityId).toBe("del-123");
    expect(out.idempotencyKey).toBe("Deliverable Created:application:del-123");
  });

  it("rejects unsupported realtime email types", async () => {
    const { buildRealtimeEmailEnvelope } = await loadModule();

    expect(() =>
      buildRealtimeEmailEnvelope({
        emailType: "Unknown Email",
        entityType: "application",
        entityId: "application-1",
        triggeredById: "user-123",
        payload: {},
      })
    ).toThrow("Unsupported realtime email type: Unknown Email");
  });

  it("enqueues message and returns message id", async () => {
    process.env.EMAILER_QUEUE_URL = "http://example.com/emailer-queue";
    sendMock.mockResolvedValue({ MessageId: "msg-1" });
    const { enqueueRealtimeEmail, buildRealtimeEmailEnvelope } = await loadModule();

    const message = buildRealtimeEmailEnvelope({
      emailType: "Deliverable Submitted",
      entityType: "deliverable",
      entityId: "del-321",
      triggeredById: "user-123",
      payload: {
        to: "owner@example.com",
        id: "del-321",
      },
    });

    const messageId = await enqueueRealtimeEmail(message);
    expect(messageId).toBe("msg-1");
    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0] as { input: { QueueUrl: string; MessageBody: string } };
    expect(call.input.QueueUrl).toBe("http://example.com/emailer-queue");
    expect(JSON.parse(call.input.MessageBody).emailType).toBe("Deliverable Submitted");
  });

  it("resolves queue url by queue name when URL is not configured", async () => {
    delete process.env.EMAILER_QUEUE_URL;
    sendMock
      .mockResolvedValueOnce({ QueueUrl: "http://example.com/emailer-queue" })
      .mockResolvedValueOnce({ MessageId: "msg-2" });

    const { enqueueRealtimeEmail, buildRealtimeEmailEnvelope } = await loadModule();

    const message = buildRealtimeEmailEnvelope({
      emailType: "Deliverable Approved",
      entityType: "deliverable",
      entityId: "del-999",
      triggeredById: "user-123",
      payload: {
        to: "owner@example.com",
        id: "del-999",
      },
    });

    await enqueueRealtimeEmail(message);

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls[0][0]).toMatchObject({
      input: { QueueName: "emailer-queue" },
    });
  });
});
