import { describe, expect, it, vi, beforeEach } from "vitest";
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
}));

vi.mock("./runDocumentUnderstanding", () => ({
  runDocumentUnderstanding: (...args: unknown[]) => mocks.runDocumentUnderstandingMock(...args),
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

describe("handler", () => {
  const prevEnv = { ...process.env };

  beforeEach(() => {
    mocks.sendMock.mockReset();
    mocks.runDocumentUnderstandingMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...prevEnv };
    vi.clearAllMocks();
  });

  it("invokes runDocumentUnderstanding with s3FileName and documentId from SQS body", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });

    const event: SQSEvent = {
      Records: [
        {
          messageId: "id-1",
          receiptHandle: "",
          body: JSON.stringify({ s3FileName: "file.pdf", documentId: "doc-1" }),
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

    const result = await handlerRef(event);

    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      "/tmp/file.pdf",
      expect.objectContaining({
        pollIntervalMs: 5_000,
        logFullResult: false,
        fileNameWithExtension: "file.pdf",
        documentId: "doc-1",
      })
    );
    expect(result).toEqual({ status: "Succeeded" });
  });

  it("infers file extension from content type when key has no extension", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({
      Body: Readable.from(["test"]),
      ContentType: "application/pdf",
    });

    const event: SQSEvent = {
      Records: [
        {
          messageId: "id-2",
          receiptHandle: "",
          body: JSON.stringify({ s3FileName: "app-1/document-1" }),
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

    const result = await handlerRef(event);

    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      "/tmp/document-1",
      expect.objectContaining({
        fileNameWithExtension: "document-1.pdf",
      })
    );
    expect(result).toEqual({ status: "Succeeded" });
  });

  it("throws when s3FileName is missing", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    const event: SQSEvent = {
      Records: [
        {
          messageId: "id-1",
          receiptHandle: "",
          body: JSON.stringify({ bad: "payload" }),
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

    await expect(handlerRef(event)).rejects.toThrow("Missing s3Key/s3FileName in SQS message body.");
  });

  it("throws when S3 body is missing", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.sendMock.mockResolvedValue({ Body: undefined });

    const event: SQSEvent = {
      Records: [
        {
          messageId: "id-1",
          receiptHandle: "",
          body: JSON.stringify({ s3FileName: "file.pdf" }),
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

    await expect(handlerRef(event)).rejects.toThrow("No body returned when fetching s3://");
  });

  it("uses trimmed fileNameWithExtension when provided in message body", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });

    const event: SQSEvent = {
      Records: [
        {
          messageId: "id-3",
          receiptHandle: "",
          body: JSON.stringify({
            s3FileName: "docs/report",
            fileNameWithExtension: "  report.custom.pdf  ",
          }),
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

    await handlerRef(event);

    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      "/tmp/report",
      expect.objectContaining({
        fileNameWithExtension: "report.custom.pdf",
      })
    );
  });

  it("parses S3 event payload and decodes + and % escapes in the key", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });

    const event: SQSEvent = {
      Records: [
        {
          messageId: "id-4",
          receiptHandle: "",
          body: JSON.stringify({
            Records: [
              {
                s3: {
                  bucket: { name: "uipath-documents" },
                  object: { key: "folder%2Ftest+doc.pdf" },
                },
              },
            ],
          }),
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

    await handlerRef(event);

    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      "/tmp/test doc.pdf",
      expect.objectContaining({
        fileNameWithExtension: "test doc.pdf",
      })
    );
  });

  it("infers extension from content-disposition filename", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({
      Body: Readable.from(["test"]),
      ContentDisposition: 'attachment; filename="source-name.xls"',
    });

    const event: SQSEvent = {
      Records: [
        {
          messageId: "id-5",
          receiptHandle: "",
          body: JSON.stringify({ s3FileName: "app-1/document-5" }),
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

    await handlerRef(event);

    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      "/tmp/document-5",
      expect.objectContaining({
        fileNameWithExtension: "document-5.xls",
      })
    );
  });

  it("handles invalid UTF-8 content-disposition filenames", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({
      Body: Readable.from(["test"]),
      ContentDisposition: "attachment; filename*=UTF-8''bad%ZZname.docx",
    });

    const event: SQSEvent = {
      Records: [
        {
          messageId: "id-6",
          receiptHandle: "",
          body: JSON.stringify({ s3FileName: "app-1/document-6" }),
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

    await handlerRef(event);

    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      "/tmp/document-6",
      expect.objectContaining({
        fileNameWithExtension: "document-6.docx",
      })
    );
  });

});

import { handler as handlerRef } from "./index";
