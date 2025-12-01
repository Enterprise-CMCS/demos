import { describe, it, expect, beforeEach, vi } from "vitest";
import { SQSEvent, Context } from "aws-lambda";
import { Client } from "pg";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { handler, getDatabaseUrl, deleteInfectedDocument } from "./index";

// Mock the SecretsManagerClient
vi.mock("@aws-sdk/client-secrets-manager", () => {
  const mockSend = vi.fn();
  return {
    SecretsManagerClient: vi.fn(() => ({
      send: mockSend,
    })),
    GetSecretValueCommand: vi.fn(),
  };
});

// Mock the pg Client
vi.mock("pg", () => {
  const mockQuery = vi.fn();
  const mockConnect = vi.fn();
  const mockEnd = vi.fn();

  return {
    Client: vi.fn().mockImplementation(() => ({
      query: mockQuery,
      connect: mockConnect,
      end: mockEnd,
    })),
  };
});

describe("deleteinfectedfile Lambda", () => {
  let mockClient: any;
  let mockSecretsManagerSend: any;
  const mockDatabaseSecret = {
    username: "test_user",
    password: "test_password", // pragma: allowlist secret
    host: "test-host",
    port: "5432",
    dbname: "test_db",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock client
    const ClientConstructor = Client as any;
    mockClient = new ClientConstructor({});

    // Setup secrets manager mock
    const SecretsManagerClientConstructor = SecretsManagerClient as any;
    const secretsManagerInstance = new SecretsManagerClientConstructor({});
    mockSecretsManagerSend = secretsManagerInstance.send;

    // Mock secrets manager response
    mockSecretsManagerSend.mockResolvedValue({
      SecretString: JSON.stringify(mockDatabaseSecret),
    });

    // Reset the cached database URL
    (getDatabaseUrl as any).cachedUrl = undefined;
  });

  describe("getDatabaseUrl", () => {
    it("should fetch and construct database URL from secrets manager", async () => {
      const url = await getDatabaseUrl();

      expect(url).toBe(
        `postgresql://${mockDatabaseSecret.username}:${mockDatabaseSecret.password}@${mockDatabaseSecret.host}:${mockDatabaseSecret.port}/${mockDatabaseSecret.dbname}?schema=demos_app`
      );
      expect(mockSecretsManagerSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteInfectedDocument", () => {
    it("should call stored procedure with correct parameters", async () => {
      const documentKey = "application-id/file-id";

      await deleteInfectedDocument(mockClient, documentKey);

      expect(mockClient.query).toHaveBeenCalledWith(
        "CALL demos_app.delete_infected_document($1::TEXT);",
        [documentKey]
      );
    });
  });

  describe("handler", () => {
    const mockContext: Context = {
      awsRequestId: "test-request-id",
      functionName: "deleteinfectedfile",
      functionVersion: "1",
      memoryLimitInMB: "128",
      logGroupName: "/aws/lambda/deleteinfectedfile",
      logStreamName: "2024/01/01/[$LATEST]test",
      invokedFunctionArn: "arn:aws:lambda:us-east-1:123456789:function:deleteinfectedfile",
      callbackWaitsForEmptyEventLoop: false,
      getRemainingTimeInMillis: () => 30000,
      done: vi.fn(),
      fail: vi.fn(),
      succeed: vi.fn(),
    };

    it("should process single S3 lifecycle expiration event successfully", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "msg-123",
            receiptHandle: "receipt-123",
            body: JSON.stringify({
              Records: [
                {
                  eventVersion: "2.1",
                  eventSource: "aws:s3",
                  eventName: "LifecycleExpiration:Delete",
                  s3: {
                    bucket: { name: "infected-bucket" },
                    object: { key: "application-id/file-id" },
                  },
                },
              ],
            }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: "",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789:infected-file-expiration-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const result = await handler(mockEvent, mockContext);

      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith("SET search_path TO demos_app, public;");
      expect(mockClient.query).toHaveBeenCalledWith(
        "CALL demos_app.delete_infected_document($1::TEXT);",
        ["application-id/file-id"]
      );
      expect(mockClient.end).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: 200,
        body: "Deleted 1 records.",
      });
    });

    it("should process multiple S3 records in single SQS message", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "msg-123",
            receiptHandle: "receipt-123",
            body: JSON.stringify({
              Records: [
                {
                  eventVersion: "2.1",
                  eventSource: "aws:s3",
                  eventName: "LifecycleExpiration:Delete",
                  s3: {
                    bucket: { name: "infected-bucket" },
                    object: { key: "application-1/file-1" },
                  },
                },
                {
                  eventVersion: "2.1",
                  eventSource: "aws:s3",
                  eventName: "LifecycleExpiration:Delete",
                  s3: {
                    bucket: { name: "infected-bucket" },
                    object: { key: "application-2/file-2" },
                  },
                },
              ],
            }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: "",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789:infected-file-expiration-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const result = await handler(mockEvent, mockContext);

      expect(mockClient.query).toHaveBeenCalledWith(
        "CALL demos_app.delete_infected_document($1::TEXT);",
        ["application-1/file-1"]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        "CALL demos_app.delete_infected_document($1::TEXT);",
        ["application-2/file-2"]
      );
      expect(result).toEqual({
        statusCode: 200,
        body: "Deleted 2 records.",
      });
    });

    it("should throw error if record body is invalid", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "msg-123",
            receiptHandle: "receipt-123",
            body: "",
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: "",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789:infected-file-expiration-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      await expect(handler(mockEvent, mockContext)).rejects.toThrow(
        "Lambda failed: event record body invalid."
      );
    });

    it("should throw error if event is not a lifecycle expiration delete event", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "msg-123",
            receiptHandle: "receipt-123",
            body: JSON.stringify({
              Records: [
                {
                  eventVersion: "2.1",
                  eventSource: "aws:s3",
                  eventName: "ObjectCreated:Put",
                  s3: {
                    bucket: { name: "infected-bucket" },
                    object: { key: "application-id/file-id" },
                  },
                },
              ],
            }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: "",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789:infected-file-expiration-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      await expect(handler(mockEvent, mockContext)).rejects.toThrow(
        "Lambda failed: Unsupported event type: ObjectCreated:Put. Expected LifecycleExpiration:Delete."
      );
    });

    it("should throw error if bucket is not infected-bucket", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "msg-123",
            receiptHandle: "receipt-123",
            body: JSON.stringify({
              Records: [
                {
                  eventVersion: "2.1",
                  eventSource: "aws:s3",
                  eventName: "LifecycleExpiration:Delete",
                  s3: {
                    bucket: { name: "wrong-bucket" },
                    object: { key: "application-id/file-id" },
                  },
                },
              ],
            }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: "",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789:infected-file-expiration-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      await expect(handler(mockEvent, mockContext)).rejects.toThrow("Invalid bucket: wrong-bucket");
    });

    it("should throw error if S3 object key is missing", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "msg-123",
            receiptHandle: "receipt-123",
            body: JSON.stringify({
              Records: [
                {
                  eventVersion: "2.1",
                  eventSource: "aws:s3",
                  eventName: "LifecycleExpiration:Delete",
                  s3: {
                    bucket: { name: "infected-bucket" },
                    object: {},
                  },
                },
              ],
            }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: "",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789:infected-file-expiration-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      await expect(handler(mockEvent, mockContext)).rejects.toThrow(
        "Lambda failed: S3 record object key missing."
      );
    });

    it("should close database connection even if processing fails", async () => {
      mockClient.query.mockRejectedValueOnce(new Error("Database error"));

      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "msg-123",
            receiptHandle: "receipt-123",
            body: JSON.stringify({
              Records: [
                {
                  eventVersion: "2.1",
                  eventSource: "aws:s3",
                  eventName: "LifecycleExpiration:Delete",
                  s3: {
                    bucket: { name: "infected-bucket" },
                    object: { key: "application-id/file-id" },
                  },
                },
              ],
            }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: "",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789:infected-file-expiration-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      await expect(handler(mockEvent, mockContext)).rejects.toThrow();
      expect(mockClient.end).toHaveBeenCalled();
    });
  });
});
