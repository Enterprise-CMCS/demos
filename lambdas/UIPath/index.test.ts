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
  fetchQuestionPromptsMock: vi.fn(),
  sendMock: vi.fn(),
}));

vi.mock("./runDocumentUnderstanding", () => ({
  runDocumentUnderstanding: (...args: unknown[]) => mocks.runDocumentUnderstandingMock(...args),
}));

vi.mock("./db", () => ({
  fetchQuestionPrompts: (...args: unknown[]) => mocks.fetchQuestionPromptsMock(...args),
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
    mocks.fetchQuestionPromptsMock.mockReset();
    mocks.runDocumentUnderstandingMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...prevEnv };
    vi.clearAllMocks();
  });

  it("invokes runDocumentUnderstanding with s3Key from SQS body", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });
    mocks.fetchQuestionPromptsMock.mockResolvedValue([
      {
        id: "prompt-1",
        question: "What is the state?",
        fieldType: "Text",
        multiValued: false,
      },
    ]);

    const event: SQSEvent = {
      Records: [
        {
          messageId: "id-1",
          receiptHandle: "",
          body: JSON.stringify({ s3Key: "file.pdf" }),
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
        prompts: [
          {
            id: "prompt-1",
            question: "What is the state?",
            fieldType: "Text",
            multiValued: false,
          },
        ],
      })
    );
    expect(result).toEqual({ status: "Succeeded" });
  });

  it("throws when s3Key is missing", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.fetchQuestionPromptsMock.mockResolvedValue([
      {
        id: "prompt-1",
        question: "What is the state?",
        fieldType: "Text",
        multiValued: false,
      },
    ]);
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

    await expect(handlerRef(event)).rejects.toThrow("Missing s3Key");
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
          body: JSON.stringify({ s3Key: "file.pdf" }),
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

  it("throws when no prompts are available", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });
    mocks.fetchQuestionPromptsMock.mockResolvedValue([]);

    const event: SQSEvent = {
      Records: [
        {
          messageId: "id-1",
          receiptHandle: "",
          body: JSON.stringify({ s3Key: "file.pdf" }),
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

    await expect(handlerRef(event)).rejects.toThrow("No document understanding prompts available.");
  });
});

import { handler as handlerRef } from "./index";
