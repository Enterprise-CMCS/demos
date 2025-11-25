import {
  Context,
  GuardDutyScanResultNotificationEvent,
  GuardDutyScanResultNotificationEventDetail,
} from "aws-lambda";
import {
  moveFile,
  getApplicationId,
  handler,
  processGuardDutyResult,
  processInfectedDatabaseRecord,
  processCleanDatabaseRecord,
} from ".";

import { CopyObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

import { log } from "./log";

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
let mockEventInfected: GuardDutyScanResultNotificationEvent;
let logDebugSpy = vi.spyOn(log, "debug");
let logInfoSpy = vi.spyOn(log, "info");
let logWarnSpy = vi.spyOn(log, "warn");
const mockContext = { awsRequestId: "00000000-aaaa-bbbb-cccc-000000000000" } as Context;

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
    mockEventInfected = {
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
          scanResultStatus: "THREATS_FOUND",
          threats: [
            {
              name: "Malware.Test",
            },
          ],
        },
      },
      resources: [],
    };
  });
  afterEach(() => {
    vi.resetAllMocks();
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

  describe("moveFile", () => {
    it("should send proper commands to s3", async () => {
      const mockSend = vi.fn();

      const mockUploadBucket = "mock-upload-bucket";
      const mockDestinationBucket = "mock-destination-bucket";

      const mockApplicationId = "mock-application-id";
      const mockDocumentId = "mock-document-id";

      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);

      const resp = await moveFile(
        mockDocumentId,
        mockDestinationBucket,
        `${mockApplicationId}/${mockDocumentId}`
      );

      expect(mockSend).toHaveBeenCalledTimes(2);

      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(CopyObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(DeleteObjectCommand));

      expect(mockSend.mock.calls[0][0].input).toEqual({
        Bucket: mockDestinationBucket,
        CopySource: `${mockUploadBucket}/${mockDocumentId}`,
        Key: `${mockApplicationId}/${mockDocumentId}`,
      });

      expect(mockSend.mock.calls[1][0].input).toEqual({
        Bucket: mockUploadBucket,
        Key: mockDocumentId,
      });
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
      expect(logInfoSpy).toHaveBeenCalledTimes(3);
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("successfully copied file to mock-clean-bucket")
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("successfully deleted file from mock-upload-bucket")
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining("successfully processed clean file in database.")
      );
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
      expect(mockClient.query).toHaveBeenLastCalledWith(
        expect.stringContaining("CALL demos_app.move_document_from_pending_to_clean"),
        expect.arrayContaining([expect.anything()])
      );
    });
  });

  describe("processCleanDatabaseRecord", () => {
    it("should call the database with correct parameters", async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };

      await processCleanDatabaseRecord(mockClient, "test-doc-id", "test-app-id");

      expect(mockClient.query).toHaveBeenCalledWith(
        "CALL demos_app.move_document_from_pending_to_clean($1::UUID, $2::TEXT);",
        ["test-doc-id", "test-app-id/test-doc-id"]
      );
      expect(logInfoSpy).toHaveBeenCalledWith("successfully processed clean file in database.");
    });

    it("should throw error if database query fails", async () => {
      const mockClient = {
        query: vi.fn().mockRejectedValue(new Error("database error")),
      };

      await expect(
        processCleanDatabaseRecord(mockClient, "test-doc-id", "test-app-id")
      ).rejects.toThrow("database error");
    });
  });

  describe("processInfectedDatabaseRecord", () => {
    it("should call the database with correct parameters for infected file", async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };

      const mockScanResultDetails: GuardDutyScanResultNotificationEventDetail["scanResultDetails"] =
        {
          scanResultStatus: "THREATS_FOUND",
          threats: [{ name: "Trojan.Generic" }, { name: "Malware.Test" }],
        };

      await processInfectedDatabaseRecord(
        mockClient,
        "test-doc-id",
        "test-app-id",
        mockScanResultDetails
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        "CALL demos_app.move_document_from_pending_to_infected($1::UUID, $2::TEXT, $3::TEXT, $4::TEXT);",
        ["test-doc-id", "test-app-id/test-doc-id", "THREATS_FOUND", "Trojan.Generic, Malware.Test"]
      );
      expect(logInfoSpy).toHaveBeenCalledWith("successfully processed infected file in database.");
    });

    it("should handle empty threats array", async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };

      const mockScanResultDetails: GuardDutyScanResultNotificationEventDetail["scanResultDetails"] =
        {
          scanResultStatus: "THREATS_FOUND",
          threats: [],
        };

      await processInfectedDatabaseRecord(
        mockClient,
        "test-doc-id",
        "test-app-id",
        mockScanResultDetails
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        "CALL demos_app.move_document_from_pending_to_infected($1::UUID, $2::TEXT, $3::TEXT, $4::TEXT);",
        ["test-doc-id", "test-app-id/test-doc-id", "THREATS_FOUND", ""]
      );
    });

    it("should throw error if database query fails", async () => {
      const mockClient = {
        query: vi.fn().mockRejectedValue(new Error("database error")),
      };

      const mockScanResultDetails: GuardDutyScanResultNotificationEventDetail["scanResultDetails"] =
        {
          scanResultStatus: "THREATS_FOUND",
          threats: [{ name: "Trojan.Generic" }],
        };

      await expect(
        processInfectedDatabaseRecord(
          mockClient,
          "test-doc-id",
          "test-app-id",
          mockScanResultDetails
        )
      ).rejects.toThrow("database error");
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

      await handler(
        {
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
        },
        mockContext
      );

      expect(logInfoSpy).toHaveBeenCalledTimes(4);
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("successfully copied file to mock-clean-bucket")
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("successfully deleted file from mock-upload-bucket")
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining("successfully processed clean file in database.")
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        4,
        {
          results: {
            cleanFiles: 1,
            infectedFiles: 0,
            processedRecords: 1,
          },
        },
        "all records processed successfully."
      );
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(CopyObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(DeleteObjectCommand));

      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("SET search_path TO demos_app, public;")
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        "SELECT application_id FROM demos_app.document_pending_upload WHERE id = $1;",
        ["test-key"]
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        3,
        "CALL demos_app.move_document_from_pending_to_clean($1::UUID, $2::TEXT);",
        ["test-key", "1/test-key"]
      );
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    test("should properly handle infected file", async () => {
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

      await handler(
        {
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
              body: JSON.stringify(mockEventInfected),
            },
          ],
        },
        mockContext
      );

      expect(logInfoSpy).toHaveBeenCalledTimes(4);
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("successfully copied file to mock-infected-bucket")
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("successfully deleted file from mock-upload-bucket")
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining("successfully processed infected file in database.")
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        4,
        {
          results: {
            cleanFiles: 0,
            infectedFiles: 1,
            processedRecords: 1,
          },
        },
        "all records processed successfully."
      );
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(CopyObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(DeleteObjectCommand));

      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("SET search_path TO demos_app, public;")
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        "SELECT application_id FROM demos_app.document_pending_upload WHERE id = $1;",
        ["test-key"]
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        3,
        "CALL demos_app.move_document_from_pending_to_infected($1::UUID, $2::TEXT, $3::TEXT, $4::TEXT);",
        ["test-key", "1/test-key", "THREATS_FOUND", "Malware.Test"]
      );
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

      await expect(handler(handlerEvent, mockContext)).rejects.toThrow();
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

      await expect(handler(handlerEvent, mockContext)).rejects.toThrow();
    });
  });
});
