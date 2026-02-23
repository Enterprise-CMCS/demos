import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SQSEvent } from "aws-lambda";
import { Readable } from "node:stream";

vi.mock("./log", () => ({
  log: { info: vi.fn(), error: vi.fn() },
  reqIdChild: vi.fn(),
  als: { run: (_store: unknown, fn: () => Promise<unknown> | unknown) => fn() },
  store: new Map(),
}));

const mocks = vi.hoisted(() => ({
  runDocumentUnderstandingMock: vi.fn(),
  sendMock: vi.fn(),
  fileTypeFromFileMock: vi.fn(),
}));

vi.mock("./runDocumentUnderstanding", () => ({
  runDocumentUnderstanding: (...args: unknown[]) => mocks.runDocumentUnderstandingMock(...args),
}));

vi.mock("file-type", () => ({
  fileTypeFromFile: (...args: unknown[]) => mocks.fileTypeFromFileMock(...args),
}));

vi.mock("@aws-sdk/client-s3", () => {
  class S3Client {
    send = mocks.sendMock;
  }

  return {
    S3Client,
    GetObjectCommand: vi.fn(),
  };
});

import { handler as handlerRef } from "./index";

function createEvent(body: Record<string, unknown>, messageId = "id-1"): SQSEvent {
  return {
    Records: [
      {
        messageId,
        receiptHandle: "",
        body: JSON.stringify(body),
        attributes: {
          ApproximateReceiveCount: "1",
          SentTimestamp: "",
          SenderId: "",
          ApproximateFirstReceiveTimestamp: "",
        },
        messageAttributes: {},
        md5OfBody: "",
        eventSource: "",
        eventSourceARN: "",
        awsRegion: "us-east-1",
      },
    ],
  };
}

describe("handler", () => {
  const prevEnv = { ...process.env };

  beforeEach(() => {
    mocks.sendMock.mockReset();
    mocks.runDocumentUnderstandingMock.mockReset();
    mocks.fileTypeFromFileMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...prevEnv };
    vi.clearAllMocks();
  });

  it("invokes runDocumentUnderstanding with inferred extension and documentId", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });
    mocks.fileTypeFromFileMock.mockResolvedValue({ ext: "pdf", mime: "application/pdf" });

    const event = createEvent({ s3FileName: "file.pdf", documentId: "doc-1" });

    const result = await handlerRef(event);

    expect(mocks.fileTypeFromFileMock).toHaveBeenCalledExactlyOnceWith("/tmp/file.pdf");
    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      "/tmp/file.pdf",
      expect.objectContaining({
        pollIntervalMs: 5_000,
        fileNameWithExtension: "file.pdf",
        documentId: "doc-1",
      })
    );
    expect(result).toEqual({ status: "Succeeded" });
  });

  it("infers extension when key has no extension", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });
    mocks.fileTypeFromFileMock.mockResolvedValue({ ext: "pdf", mime: "application/pdf" });

    const event = createEvent({ s3FileName: "app-1/document-1" }, "id-2");

    const result = await handlerRef(event);

    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      "/tmp/document-1",
      expect.objectContaining({
        fileNameWithExtension: "document-1.pdf",
      })
    );
    expect(result).toEqual({ status: "Succeeded" });
  });

  it("parses S3 event payload and decodes + and % escapes in key", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });
    mocks.fileTypeFromFileMock.mockResolvedValue({ ext: "pdf", mime: "application/pdf" });

    const event = createEvent(
      {
        Records: [
          {
            s3: {
              bucket: { name: "uipath-documents" },
              object: { key: "folder%2Ftest+doc" },
            },
          },
        ],
      },
      "id-3"
    );

    await handlerRef(event);

    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      "/tmp/test doc",
      expect.objectContaining({
        fileNameWithExtension: "test doc.pdf",
      })
    );
  });

  it("throws when s3FileName is missing", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    const event = createEvent({ bad: "payload" });

    await expect(handlerRef(event)).rejects.toThrow("Missing s3Key/s3FileName in SQS message body.");
  });

  it("throws when S3 body is missing", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.sendMock.mockResolvedValue({ Body: undefined });

    const event = createEvent({ s3FileName: "file.pdf" });

    await expect(handlerRef(event)).rejects.toThrow("No body returned when fetching s3://");
  });

  it("throws when file type cannot be inferred from downloaded content", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });
    mocks.fileTypeFromFileMock.mockResolvedValue(undefined);

    const event = createEvent({ s3Bucket: "clean-bucket", s3FileName: "app-1/document-2" }, "id-4");

    await expect(handlerRef(event)).rejects.toThrow(
      "Unable to infer file extension for s3://clean-bucket/app-1/document-2 from file content."
    );
  });
});
