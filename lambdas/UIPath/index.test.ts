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

  it("invokes runDocumentUnderstanding with s3FileName from SQS body", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });

    const event: SQSEvent = {
      Records: [
        {
          messageId: "id-1",
          receiptHandle: "",
          body: JSON.stringify({ s3FileName: "file.pdf", projectId: "project-1" }),
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
        projectId: "project-1",
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

    await expect(handlerRef(event)).rejects.toThrow("Missing s3FileName");
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
          body: JSON.stringify({ s3FileName: "file.pdf", projectId: "project-1" }),
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

});

import { handler as handlerRef } from "./index";
