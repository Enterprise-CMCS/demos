import { GuardDutyScanResultNotificationEvent } from "aws-lambda";
import {
  extractS3InfoFromGuardDuty,
  getApplicationId,
  handler,
  isGuardDutyScanClean,
  moveFileToCleanBucket,
  processGuardDutyResult,
} from ".";

import { CopyObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Client } from "pg";

const mockConnect = vi.fn();
const mockQuery = vi.fn();
const mockEnd = vi.fn();
vi.mock("pg", () => {
  const mockClient = {
    connect: () => mockConnect(),
    query: (...a) => mockQuery(...a),
    end: () => mockEnd(),
  };

  return { Client: vi.fn(() => mockClient) };
});

let mockEventBase: GuardDutyScanResultNotificationEvent;
let consoleLogSpy = vi.spyOn(console, "log");

describe("file-process", () => {
  beforeEach(() => {
    mockEventBase = {
      source: "aws.guardduty",
      id: "123",
      version: "1",
      account: "0123456789",
      time: "faketime",
      region: "us-east-1",
      "detail-type": "GuardDuty Malware Protection Object Scan Result",
      detail: {
        scanStatus: "COMPLETED",
        schemaVersion: "1.0",
        resourceType: "S3_OBJECT",
        s3ObjectDetails: {
          bucketName: "test-bucket",
          objectKey: "test-key",
          eTag: "",
          versionId: "1",
          s3Throttled: false,
        },
        scanResultDetails: {
          scanResultStatus: "NO_THREATS_FOUND",
          threats: [],
        },
      },
      resources: [],
    };
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("isGuardDutyScanClean", () => {
    it("should return true with a clean response", () => {
      expect(isGuardDutyScanClean(mockEventBase)).toEqual(true);
    });

    it("should return false if the detail-type is incorrect", () => {
      // @ts-expect-error
      mockEventBase["detail-type"] = "invalid";
      expect(isGuardDutyScanClean(mockEventBase)).toEqual(false);
      expect(consoleLogSpy).toHaveBeenCalledWith("Not a GuardDuty Malware Protection scan result");
    });

    it("should return false if scan is not complete", () => {
      mockEventBase.detail.scanStatus = "FAILED";
      expect(isGuardDutyScanClean(mockEventBase)).toEqual(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Scan not completed"));
    });

    it("should return false if scan is not clean", () => {
      mockEventBase.detail.scanResultDetails.scanResultStatus = "THREATS_FOUND";
      expect(isGuardDutyScanClean(mockEventBase)).toEqual(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("File not clean"));
    });
    it("should return false if error is thrown", () => {
      expect(isGuardDutyScanClean(undefined)).toEqual(false);
    });
  });

  describe("extractS3InfoFromGuardDuty", () => {
    it("should return the bucket and key", () => {
      expect(extractS3InfoFromGuardDuty(mockEventBase)).toEqual({
        bucket: mockEventBase.detail.s3ObjectDetails.bucketName,
        key: mockEventBase.detail.s3ObjectDetails.objectKey,
      });
    });
    it("should throw if no object details are found", () => {
      mockEventBase.detail.s3ObjectDetails = undefined;
      expect(() => extractS3InfoFromGuardDuty(mockEventBase)).toThrow();
    });
  });

  describe("getApplicationId", () => {
    it("should return a application id", async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [{ application_id: "1" }] }),
      };
      const id = await getApplicationId(mockClient, "test");

      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining("FROM demos_app"), [
        "test",
      ]);
      expect(id).toEqual("1");
    });
    it("should throw when record is missing or empty", async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [{}] }),
      };
      const mockClient2 = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };

      await expect(getApplicationId(mockClient, "test")).rejects.toThrow(
        "No document_pending_upload record found"
      );
      await expect(getApplicationId(mockClient2, "test")).rejects.toThrow(
        "No document_pending_upload record found"
      );
    });
    it("should return proper error if query fails", async () => {
      const mockClient = {
        query: vi.fn().mockRejectedValue("unit test error"),
      };

      await expect(getApplicationId(mockClient, "test")).rejects.toThrow(
        "Failed to get application ID"
      );
    });
  });

  describe("moveFileToCleanBucket", () => {
    it("should send proper commands to s3", async () => {
      const mockSend = vi.fn();

      const mockCleanBucket = "mock-clean-bucket";
      const mockUploadBucket = "mock-upload-bucket";

      const mockKey = "mock-key";
      const mockApplicationId = "mock-application-id";

      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);

      const resp = await moveFileToCleanBucket(mockKey, mockApplicationId);

      expect(mockSend).toHaveBeenCalledTimes(2);

      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(CopyObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(DeleteObjectCommand));

      expect(mockSend.mock.calls[0][0].input).toEqual({
        Bucket: mockCleanBucket,
        CopySource: `${mockUploadBucket}/${mockKey}`,
        Key: `${mockApplicationId}/${mockKey}`,
      });

      expect(mockSend.mock.calls[1][0].input).toEqual({
        Bucket: mockUploadBucket,
        Key: mockKey,
      });

      expect(resp).toEqual(`${mockApplicationId}/${mockKey}`);
    });
  });
  describe("processGuardDutyResult", () => {
    test("should successfully process the file", async () => {
      const mockSend = vi.fn();
      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);

      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [{ application_id: "1" }] }),
      };
      console.log("mockEventBase", mockEventBase);
      await processGuardDutyResult(mockClient, mockEventBase);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Successfully processed clean file")
      );
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
      expect(mockClient.query).toHaveBeenLastCalledWith(
        expect.stringContaining("CALL demos_app.move_document_from_processing_to_clean"),
        expect.arrayContaining([expect.anything()])
      );
    });
  });

  describe("handler", () => {
    test("should properly handle clean file", async () => {
      const mockSend = vi.fn();
      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);
      vi.spyOn(SecretsManagerClient.prototype, "send").mockImplementation(() => ({
        SecretString: JSON.stringify({
          username: "something",
          password: "fake", // pragma: allowlist secret
          host: "fakehost",
          port: 1234,
          dbname: "test",
        }),
      }));

      mockQuery.mockResolvedValue({ rows: [{ application_id: "1" }] });

      await handler({
        Records: [
          {
            messageId: "123",
            receiptHandle: "",
            messageAttributes: {},
            md5OfBody: "",
            eventSource: "",
            eventSourceARN: "",
            awsRegion: "us-east-1",
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "mock timestamp",
              SenderId: "1",
              ApproximateFirstReceiveTimestamp: "",
            },
            body: JSON.stringify(mockEventBase),
          },
        ],
      });

      expect(consoleLogSpy).toHaveBeenCalledWith("All records processed successfully");
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    test("should properly handle failed file", async () => {
      const mockSend = vi.fn();
      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);
      vi.spyOn(SecretsManagerClient.prototype, "send").mockImplementation(() => ({
        SecretString: JSON.stringify({
          username: "something",
          password: "fake", // pragma: allowlist secret
          host: "fakehost",
          port: 1234,
          dbname: "test",
        }),
      }));

      mockQuery.mockResolvedValue({ rows: [{ application_id: "1" }] });

      mockEventBase.detail.scanResultDetails.scanResultStatus = "THREATS_FOUND";

      await handler({
        Records: [
          {
            messageId: "123",
            receiptHandle: "",
            messageAttributes: {},
            md5OfBody: "",
            eventSource: "",
            eventSourceARN: "",
            awsRegion: "us-east-1",
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "mock timestamp",
              SenderId: "1",
              ApproximateFirstReceiveTimestamp: "",
            },
            body: JSON.stringify(mockEventBase),
          },
        ],
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("is not clean. Skipping processing.")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("All records processed successfully");
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    test("should catch and rethrow error", async () => {
      const mockSend = vi.fn();
      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);
      vi.spyOn(SecretsManagerClient.prototype, "send").mockImplementation(() => ({
        SecretString: JSON.stringify({
          username: "something",
          password: "fake", // pragma: allowlist secret
          host: "fakehost",
          port: 1234,
          dbname: "test",
        }),
      }));

      mockQuery.mockRejectedValue("fail");

      const handlerEvent = {
        Records: [
          {
            messageId: "123",
            receiptHandle: "",
            messageAttributes: {},
            md5OfBody: "",
            eventSource: "",
            eventSourceARN: "",
            awsRegion: "us-east-1",
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "mock timestamp",
              SenderId: "1",
              ApproximateFirstReceiveTimestamp: "",
            },
            body: JSON.stringify(mockEventBase),
          },
        ],
      };

      await expect(handler(handlerEvent)).rejects.toThrow();
    });
    test("should catch and rethrow error", async () => {
      const mockSend = vi.fn();
      vi.spyOn(S3Client.prototype, "send").mockImplementation(() => {
        throw new Error("");
      });
      vi.spyOn(SecretsManagerClient.prototype, "send").mockImplementation(() => ({
        SecretString: JSON.stringify({
          username: "something",
          password: "fake", // pragma: allowlist secret
          host: "fakehost",
          port: 1234,
          dbname: "test",
        }),
      }));

      mockQuery.mockResolvedValue({ rows: [{ application_id: "1" }] });

      const handlerEvent = {
        Records: [
          {
            messageId: "123",
            receiptHandle: "",
            messageAttributes: {},
            md5OfBody: "",
            eventSource: "",
            eventSourceARN: "",
            awsRegion: "us-east-1",
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "mock timestamp",
              SenderId: "1",
              ApproximateFirstReceiveTimestamp: "",
            },
            body: JSON.stringify(mockEventBase),
          },
        ],
      };

      await expect(handler(handlerEvent)).rejects.toThrow();
    });
  });
});
