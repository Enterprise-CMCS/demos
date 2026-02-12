import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@aws-sdk/client-sqs", () => {
  return {
    SQSClient: vi.fn().mockImplementation(() => ({
      send: sendMock,
    })),
    SendMessageCommand: vi.fn().mockImplementation((input) => ({ input })),
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
    process.env = { ...originalEnv, UIPATH_PROJECT_ID: "dummy" };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("enqueueUiPath", () => {
    it("throws when UIPATH_QUEUE_URL is missing", async () => {
      delete process.env.UIPATH_QUEUE_URL;
      const { enqueueUiPath } = await loadModule();

      await expect(
        enqueueUiPath({
          s3Bucket: "clean-bucket",
          s3FileName: "file.pdf",
          projectId: "project-1",
        })
      ).rejects.toThrow("UIPATH_QUEUE_URL is not set.");
    });

    it("sends a message and returns the message id", async () => {
      process.env.UIPATH_QUEUE_URL = "http://example.com/queue";
      sendMock.mockResolvedValue({ MessageId: "msg-123" });
      const { enqueueUiPath } = await loadModule();

      const payload = {
        s3Bucket: "clean-bucket",
        s3FileName: "path/to/file.pdf",
        projectId: "project-1",
        fileNameWithExtension: "file.pdf",
      };

      const result = await enqueueUiPath(payload);

      expect(result).toBe("msg-123");
      expect(sendMock).toHaveBeenCalledTimes(1);
      const call = sendMock.mock.calls[0][0] as { input: { QueueUrl: string; MessageBody: string } };
      expect(call.input.QueueUrl).toBe("http://example.com/queue");
      expect(JSON.parse(call.input.MessageBody)).toEqual(payload);
    });

    it("throws when SQS does not return a MessageId", async () => {
      process.env.UIPATH_QUEUE_URL = "http://example.com/queue";
      sendMock.mockResolvedValue({});
      const { enqueueUiPath } = await loadModule();

      await expect(
        enqueueUiPath({
          s3Bucket: "clean-bucket",
          s3FileName: "file.pdf",
          projectId: "project-1",
        })
      ).rejects.toThrow("Failed to enqueue UiPath message.");
    });
  });

  describe("parseS3Path", () => {
    it("parses s3:// paths", async () => {
      const { parseS3Path } = await loadModule();
      const result = parseS3Path("s3://bucket/path/to/file.pdf");

      expect(result).toEqual({
        bucket: "bucket",
        key: "path/to/file.pdf",
      });
    });

    it("parses plain keys with a fallback bucket", async () => {
      const { parseS3Path } = await loadModule();
      const result = parseS3Path("path/to/file.pdf", "clean-bucket");

      expect(result).toEqual({
        bucket: "clean-bucket",
        key: "path/to/file.pdf",
      });
    });

    it("throws when fallback bucket is missing for plain keys", async () => {
      const { parseS3Path } = await loadModule();
      expect(() => parseS3Path("file.pdf")).toThrow("Clean bucket is not configured.");
    });
  });
});
