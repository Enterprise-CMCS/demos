import { describe, expect, it, vi } from "vitest";
import { SQSEvent } from "aws-lambda";
import { Readable } from "node:stream";

vi.mock("./log", () => ({
  log: { info: vi.fn(), error: vi.fn() },
  reqIdChild: vi.fn(),
  als: { run: (_store: unknown, fn: () => Promise<unknown> | unknown) => fn() },
  store: new Map(),
}));

const runDocumentUnderstandingMock = vi.fn();
vi.mock("./runDocumentUnderstanding", () => ({
  runDocumentUnderstanding: (...args: unknown[]) => runDocumentUnderstandingMock(...args),
}));

const fetchQuestionPromptsMock = vi.fn();
vi.mock("./db", () => ({
  fetchQuestionPrompts: (...args: unknown[]) => fetchQuestionPromptsMock(...args),
}));

vi.mock("@aws-sdk/client-s3", () => {
  class S3Client {
    send = vi.fn().mockResolvedValue({ Body: Readable.from(["test"]) });
  }

  return {
    S3Client,
    GetObjectCommand: vi.fn(),
  };
});

import { handler } from "./index";

describe("handler", () => {
  const prevEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...prevEnv };
    vi.clearAllMocks();
  });

  it("invokes runDocumentUnderstanding with s3Key from SQS body", async () => {
    delete process.env.RUN_LOCAL;
    delete process.env.ENVIRONMENT;
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    fetchQuestionPromptsMock.mockResolvedValue([
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

    const result = await handler(event);

    expect(runDocumentUnderstandingMock).toHaveBeenCalledWith(
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
    delete process.env.RUN_LOCAL;
    delete process.env.ENVIRONMENT;
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    fetchQuestionPromptsMock.mockResolvedValue([
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

    await expect(handler(event)).rejects.toThrow("Missing s3Key");
  });
});
