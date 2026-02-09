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
  updateContentType,
} from ".";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
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
let logDebugSpy;
let logInfoSpy;
let logWarnSpy;
const mockContext = { awsRequestId: "00000000-aaaa-bbbb-cccc-000000000000" } as Context;

describe("file-process", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    logDebugSpy = vi.spyOn(log, "debug");
    logInfoSpy = vi.spyOn(log, "info");
    logWarnSpy = vi.spyOn(log, "warn");

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
      const mockSend = vi.fn((command) => {
        if (command instanceof GetObjectCommand) {
          return Promise.resolve({
            Body: {
              transformToByteArray: async () => new Uint8Array([0x25, 0x50, 0x44, 0x46]), // PDF magic number
            },
          });
        }
        return Promise.resolve({});
      });
      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);

      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [{ application_id: "1" }] }),
      };
      console.log("mockEventBase", mockEventBase);
      await processGuardDutyResult(mockClient, mockEventBase);
      expect(logInfoSpy).toHaveBeenCalledTimes(5);
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
        { key: "1/test-key", contentType: "application/pdf" },
        "Updating content type"
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        4,
        { key: "1/test-key", contentType: "application/pdf" },
        "Successfully updated content type"
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        5,
        expect.stringContaining("successfully processed clean file in database.")
      );
      expect(mockSend).toHaveBeenCalledTimes(4);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(CopyObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(DeleteObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(3, expect.any(GetObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(4, expect.any(CopyObjectCommand));
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
      const mockSend = vi.fn((command) => {
        if (command instanceof GetObjectCommand) {
          return Promise.resolve({
            Body: {
              transformToByteArray: async () => new Uint8Array([0x25, 0x50, 0x44, 0x46]), // PDF magic number
            },
          });
        }
        return Promise.resolve({});
      });
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

      expect(logInfoSpy).toHaveBeenCalledTimes(6);
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
        { key: "1/test-key", contentType: "application/pdf" },
        "Updating content type"
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        4,
        { key: "1/test-key", contentType: "application/pdf" },
        "Successfully updated content type"
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        5,
        expect.stringContaining("successfully processed clean file in database.")
      );
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        6,
        {
          results: {
            cleanFiles: 1,
            infectedFiles: 0,
            processedRecords: 1,
          },
        },
        "all records processed successfully."
      );
      expect(mockSend).toHaveBeenCalledTimes(4);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(CopyObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(DeleteObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(3, expect.any(GetObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(4, expect.any(CopyObjectCommand));

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

  describe("updateContentType", () => {
    it("should fetch file bytes, detect type, and update content type", async () => {
      const mockSend = vi.fn();
      const mockBuffer = Buffer.from([0xff, 0xd8, 0xff]); // JPEG magic bytes

      mockSend.mockResolvedValueOnce({
        Body: {
          transformToByteArray: vi.fn().mockResolvedValue(mockBuffer),
        },
      });

      mockSend.mockResolvedValueOnce({});

      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);

      await updateContentType("test-bucket", "test-key");

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(GetObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(CopyObjectCommand));

      const getObjectCall = mockSend.mock.calls[0][0];
      expect(getObjectCall.input).toEqual({
        Bucket: "test-bucket",
        Key: "test-key",
        Range: "bytes=0-4100",
      });

      const copyObjectCall = mockSend.mock.calls[1][0];
      expect(copyObjectCall.input.Bucket).toBe("test-bucket");
      expect(copyObjectCall.input.Key).toBe("test-key");
      expect(copyObjectCall.input.CopySource).toBe("test-bucket/test-key");
      expect(copyObjectCall.input.ContentType).toBe("image/jpeg");
      expect(copyObjectCall.input.MetadataDirective).toBe("REPLACE");
    });

    it("should handle case when file body is not returned", async () => {
      const mockSend = vi.fn().mockResolvedValue({
        Body: null,
      });

      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);

      await updateContentType("test-bucket", "test-key");

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(logWarnSpy).toHaveBeenCalledWith({ key: "test-key" }, "No file body returned");
    });

    it("should handle case when content type cannot be determined", async () => {
      const mockSend = vi.fn();
      const mockBuffer = Buffer.from([0x00, 0x00, 0x00]); // Unknown file type

      mockSend.mockResolvedValueOnce({
        Body: {
          transformToByteArray: vi.fn().mockResolvedValue(mockBuffer),
        },
      });

      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);

      await updateContentType("test-bucket", "test-key");

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(logWarnSpy).toHaveBeenCalledWith(
        { key: "test-key" },
        "Could not determine content type from file content"
      );
    });

    it("should not throw error if update fails", async () => {
      const mockSend = vi.fn();
      const mockBuffer = Buffer.from([0xff, 0xd8, 0xff]);

      mockSend.mockResolvedValueOnce({
        Body: {
          transformToByteArray: vi.fn().mockResolvedValue(mockBuffer),
        },
      });

      mockSend.mockRejectedValueOnce(new Error("S3 error"));

      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);
      const logErrorSpy = vi.spyOn(log, "error");

      await expect(updateContentType("test-bucket", "test-key")).resolves.not.toThrow();

      expect(logErrorSpy).toHaveBeenCalledWith(
        { error: "S3 error", bucket: "test-bucket", key: "test-key" },
        "Failed to update content type"
      );
    });
  });

  describe("processGuardDutyResult - updateContentType integration", () => {
    it("should call updateContentType when document is clean", async () => {
      const mockSend = vi.fn();
      const mockBuffer = Buffer.from([0xff, 0xd8, 0xff]);

      // Mock moveFile operations (CopyObject and DeleteObject)
      mockSend.mockResolvedValueOnce({}); // CopyObjectCommand for moveFile
      mockSend.mockResolvedValueOnce({}); // DeleteObjectCommand for moveFile

      // Mock updateContentType operations (GetObject and CopyObject)
      mockSend.mockResolvedValueOnce({
        Body: {
          transformToByteArray: vi.fn().mockResolvedValue(mockBuffer),
        },
      });
      mockSend.mockResolvedValueOnce({}); // CopyObjectCommand for updateContentType

      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);

      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [{ application_id: "test-app-id" }] }),
      };

      await processGuardDutyResult(mockClient, mockEventBase);

      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(CopyObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(DeleteObjectCommand));

      expect(mockSend).toHaveBeenNthCalledWith(3, expect.any(GetObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(4, expect.any(CopyObjectCommand));

      expect(mockSend).toHaveBeenCalledTimes(4);
    });

    it("should not call updateContentType when document is infected", async () => {
      const mockSend = vi.fn();

      mockSend.mockResolvedValueOnce({}); // CopyObjectCommand
      mockSend.mockResolvedValueOnce({}); // DeleteObjectCommand

      vi.spyOn(S3Client.prototype, "send").mockImplementation(mockSend);

      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [{ application_id: "test-app-id" }] }),
      };

      await processGuardDutyResult(mockClient, mockEventInfected);

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(CopyObjectCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(DeleteObjectCommand));
    });
  });
});
