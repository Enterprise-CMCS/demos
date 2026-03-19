import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SQSEvent } from "aws-lambda";
import { Readable } from "node:stream";
import path from "node:path";
import os from "node:os";
import { region } from "./uipathClient";

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
  parseDocumentFromIdMock: vi.fn(),
}));
const SEEDED_DOCUMENT_ID = "00000000-0000-0000-0000-000000000000";

function tmpFile(name: string): string {
  return path.join(os.tmpdir(), name);
}

vi.mock("./runDocumentUnderstanding", () => ({
  runDocumentUnderstanding: (...args: unknown[]) => mocks.runDocumentUnderstandingMock(...args),
}));

vi.mock("./parseDocumentFromId", async () => {
  const actual = await vi.importActual<typeof import("./parseDocumentFromId")>("./parseDocumentFromId");
  return {
    ...actual,
    parseDocumentFromId: (...args: unknown[]) => mocks.parseDocumentFromIdMock(...args),
  };
});

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
        awsRegion: region,
      },
    ],
  };
}

describe("handler", () => {
  const prevEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...prevEnv, CLEAN_BUCKET: "clean-bucket" };
    mocks.sendMock.mockReset();
    mocks.runDocumentUnderstandingMock.mockReset();
    mocks.fileTypeFromFileMock.mockReset();
    mocks.parseDocumentFromIdMock.mockReset();
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
    mocks.parseDocumentFromIdMock.mockResolvedValue({
      key: `app-1/${SEEDED_DOCUMENT_ID}`,
      documentId: SEEDED_DOCUMENT_ID,
      applicationId: "app-1",
    });

    const event = createEvent({ documentId: SEEDED_DOCUMENT_ID });

    const result = await handlerRef(event);

    expect(mocks.fileTypeFromFileMock).toHaveBeenCalledExactlyOnceWith(tmpFile(SEEDED_DOCUMENT_ID));
    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      tmpFile(SEEDED_DOCUMENT_ID),
      expect.objectContaining({
        pollIntervalMs: 5_000,
        fileNameWithExtension: `${SEEDED_DOCUMENT_ID}.pdf`,
        documentId: SEEDED_DOCUMENT_ID,
        applicationId: "app-1",
      })
    );
    expect(result).toEqual({ status: "Succeeded" });
  });

  it("infers extension using key returned by document lookup", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });
    mocks.fileTypeFromFileMock.mockResolvedValue({ ext: "pdf", mime: "application/pdf" });
    mocks.parseDocumentFromIdMock.mockResolvedValue({
      key: "app-1/document-1",
      documentId: "document-1",
      applicationId: "app-1",
    });

    const event = createEvent({ documentId: SEEDED_DOCUMENT_ID }, "id-2");

    const result = await handlerRef(event);

    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      tmpFile("document-1"),
      expect.objectContaining({
        fileNameWithExtension: "document-1.pdf",
        documentId: "document-1",
        applicationId: "app-1",
      })
    );
    expect(result).toEqual({ status: "Succeeded" });
  });

  it("resolves s3 key from documentId when queue payload only has documentId", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.runDocumentUnderstandingMock.mockResolvedValue({ status: "Succeeded" });
    mocks.parseDocumentFromIdMock.mockResolvedValue({
      key: "app-1/document-3",
      documentId: "document-3",
      applicationId: "app-1",
    });
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });
    mocks.fileTypeFromFileMock.mockResolvedValue({ ext: "pdf", mime: "application/pdf" });

    const event = createEvent({ documentId: SEEDED_DOCUMENT_ID }, "id-5");

    const result = await handlerRef(event);

    expect(mocks.parseDocumentFromIdMock).toHaveBeenCalledExactlyOnceWith(SEEDED_DOCUMENT_ID, undefined);
    expect(mocks.runDocumentUnderstandingMock).toHaveBeenCalledWith(
      tmpFile("document-3"),
      expect.objectContaining({
        fileNameWithExtension: "document-3.pdf",
        documentId: "document-3",
        applicationId: "app-1",
      })
    );
    expect(result).toEqual({ status: "Succeeded" });
  });

  it("throws when documentId is missing", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    const event = createEvent({ bad: "payload" });

    await expect(handlerRef(event)).rejects.toThrow("Missing documentId in SQS message body.");
  });

  it("throws when S3 body is missing", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.sendMock.mockResolvedValue({ Body: undefined });
    mocks.parseDocumentFromIdMock.mockResolvedValue({
      key: `app-1/${SEEDED_DOCUMENT_ID}`,
      documentId: SEEDED_DOCUMENT_ID,
      applicationId: "app-1",
    });

    const event = createEvent({ documentId: SEEDED_DOCUMENT_ID });

    await expect(handlerRef(event)).rejects.toThrow("No body returned when fetching s3://");
  });

  it("throws when file type cannot be inferred from downloaded content", async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = "testfn";
    process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs22.x";
    mocks.sendMock.mockResolvedValue({ Body: Readable.from(["test"]) });
    mocks.fileTypeFromFileMock.mockResolvedValue(undefined);
    mocks.parseDocumentFromIdMock.mockResolvedValue({
      key: `app-1/${SEEDED_DOCUMENT_ID}`,
      documentId: SEEDED_DOCUMENT_ID,
      applicationId: "app-1",
    });

    const event = createEvent({ documentId: SEEDED_DOCUMENT_ID }, "id-4");

    await expect(handlerRef(event)).rejects.toThrow(
      `Unable to infer file extension for s3://clean-bucket/app-1/${SEEDED_DOCUMENT_ID} from file content.`
    );
  });
});
