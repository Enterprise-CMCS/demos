import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@aws-sdk/client-sqs", () => {
  return {
    SQSClient: vi.fn().mockImplementation(() => ({
      send: sendMock,
    })),
    SendMessageCommand: vi.fn().mockImplementation((input) => ({ input })),
    GetQueueUrlCommand: vi.fn().mockImplementation((input) => ({ input })),
  };
});

const loadModule = async () => {
  return await import("./uipathQueue");
};

describe("uipathQueue", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    process.env = { ...originalEnv, CLEAN_BUCKET: "clean-bucket" };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("enqueueUiPath", () => {
    it("resolves queue URL when UIPATH_QUEUE_URL is missing", async () => {
      delete process.env.UIPATH_QUEUE_URL;
      sendMock
        .mockResolvedValueOnce({ QueueUrl: "http://example.com/queue" })
        .mockResolvedValueOnce({ MessageId: "msg-123" });
      const { enqueueUiPath } = await loadModule();

      const result = await enqueueUiPath({
        documentId: "doc-1",
      });

      expect(result).toBe("msg-123");
      expect(sendMock).toHaveBeenCalledTimes(2);
      expect(sendMock.mock.calls[0][0]).toMatchObject({
        input: { QueueName: "uipath-queue" },
      });
      expect(sendMock.mock.calls[1][0]).toMatchObject({
        input: { QueueUrl: "http://example.com/queue" },
      });
    });

    it("throws when queue URL cannot be resolved", async () => {
      delete process.env.UIPATH_QUEUE_URL;
      sendMock.mockResolvedValueOnce({});
      const { enqueueUiPath } = await loadModule();

      await expect(
        enqueueUiPath({
          documentId: "doc-1",
        })
      ).rejects.toThrow("Failed to resolve UiPath queue URL for queue: uipath-queue");
    });

    it("sends a message and returns the message id", async () => {
      process.env.UIPATH_QUEUE_URL = "http://example.com/queue";
      sendMock.mockResolvedValue({ MessageId: "msg-123" });
      const { enqueueUiPath } = await loadModule();

      const payload = {
        documentId: "4cdfe542-90aa-489f-93d5-e786aaff49a2",
      };

      const result = await enqueueUiPath(payload);

      expect(result).toBe("msg-123");
      expect(sendMock).toHaveBeenCalledTimes(1);
      const call = sendMock.mock.calls[0][0] as { input: { QueueUrl: string; MessageBody: string } };
      expect(call.input.QueueUrl).toBe("http://example.com/queue");
      expect(JSON.parse(call.input.MessageBody)).toEqual(payload);
    });

    it("uses cached queue URL after first resolution", async () => {
      delete process.env.UIPATH_QUEUE_URL;
      sendMock
        .mockResolvedValueOnce({ QueueUrl: "http://example.com/queue" })
        .mockResolvedValueOnce({ MessageId: "msg-1" })
        .mockResolvedValueOnce({ MessageId: "msg-2" });
      const { enqueueUiPath } = await loadModule();

      await enqueueUiPath({
        documentId: "doc-1",
      });
      await enqueueUiPath({
        documentId: "doc-2",
      });

      expect(sendMock).toHaveBeenCalledTimes(3);
      expect(sendMock.mock.calls[0][0]).toMatchObject({
        input: { QueueName: "uipath-queue" },
      });
      expect(sendMock.mock.calls[1][0]).toMatchObject({
        input: { QueueUrl: "http://example.com/queue" },
      });
      expect(sendMock.mock.calls[2][0]).toMatchObject({
        input: { QueueUrl: "http://example.com/queue" },
      });
    });

    it("uses UIPATH_QUEUE_NAME when resolving queue URL", async () => {
      delete process.env.UIPATH_QUEUE_URL;
      process.env.UIPATH_QUEUE_NAME = "custom-uipath-queue";
      sendMock
        .mockResolvedValueOnce({ QueueUrl: "http://example.com/custom-queue" })
        .mockResolvedValueOnce({ MessageId: "msg-123" });
      const { enqueueUiPath } = await loadModule();

      await enqueueUiPath({
        documentId: "doc-1",
      });

      expect(sendMock.mock.calls[0][0]).toMatchObject({
        input: { QueueName: "custom-uipath-queue" },
      });
    });

    it("throws when SQS does not return a MessageId", async () => {
      process.env.UIPATH_QUEUE_URL = "http://example.com/queue";
      sendMock.mockResolvedValue({});
      const { enqueueUiPath } = await loadModule();

      await expect(
        enqueueUiPath({
          documentId: "doc-1",
        })
      ).rejects.toThrow("Failed to enqueue UiPath message.");
    });
  });
});
