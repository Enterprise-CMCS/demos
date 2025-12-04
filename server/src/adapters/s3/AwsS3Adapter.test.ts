import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { S3Adapter } from "./S3Adapter.js";
import { UploadDocumentInput } from "../../types.js";
import { DocumentPendingUpload } from "@prisma/client";

// Mock AWS SDK using vi.hoisted - ALL mocks must be in here
const { mockSend, mockS3Client, mockGetSignedUrl } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const mockS3Client = vi.fn().mockImplementation(() => ({
    send: mockSend,
  }));
  const mockGetSignedUrl = vi.fn();

  return { mockSend, mockS3Client, mockGetSignedUrl };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: mockS3Client,
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  CopyObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

// Mock dependencies
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

// Import after mocks
import { createAWSS3Adapter } from "./AwsS3Adapter.js";
import {
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { DOCUMENT_TYPES } from "../../constants.js";

describe("AwsS3Adapter", () => {
  let adapter: S3Adapter;
  let originalEnv: NodeJS.ProcessEnv;

  const mockPrismaClient = {
    documentPendingUpload: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const testDocumentId = "doc-123-456";
  const testApplicationId = "app-789-012";
  const testUserId = "user-345-678";

  const mockUploadInput: UploadDocumentInput = {
    name: "Test Document.pdf",
    description: "A test document",
    documentType: "Approval Letter",
    applicationId: testApplicationId,
    phaseName: "Application Intake",
  };

  const mockDocumentPendingUpload: DocumentPendingUpload = {
    id: testDocumentId,
    name: mockUploadInput.name,
    description: mockUploadInput.description!,
    ownerUserId: testUserId,
    documentTypeId: mockUploadInput.documentType,
    applicationId: testApplicationId,
    phaseId: mockUploadInput.phaseName,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);

    // Reset the mock implementation to clear queued return values
    mockGetSignedUrl.mockReset();

    // Setup default $transaction behavior to execute the callback
    mockPrismaClient.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrismaClient);
    });

    // Save and set environment variables
    originalEnv = { ...process.env };
    process.env.UPLOAD_BUCKET = "test-upload-bucket";
    process.env.CLEAN_BUCKET = "test-clean-bucket";
    process.env.DELETED_BUCKET = "test-deleted-bucket";

    adapter = createAWSS3Adapter();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  describe("S3 Client Configuration", () => {
    it("should create S3 client with default AWS configuration when S3_ENDPOINT_LOCAL is not set", () => {
      delete process.env.S3_ENDPOINT_LOCAL;

      createAWSS3Adapter();

      expect(mockS3Client).toHaveBeenCalledWith({});
    });

    it("should create S3 client with custom local endpoint when S3_ENDPOINT_LOCAL is set", () => {
      process.env.S3_ENDPOINT_LOCAL = "http://localhost:4566";

      createAWSS3Adapter();

      expect(mockS3Client).toHaveBeenCalledWith({
        region: "us-east-1",
        endpoint: "http://localhost:4566",
        forcePathStyle: true,
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test", // pragma: allowlist secret
        },
      });
    });

    it("should use empty config for production AWS when no endpoint is set", () => {
      delete process.env.S3_ENDPOINT_LOCAL;

      createAWSS3Adapter();

      expect(mockS3Client).toHaveBeenCalledWith({});
    });
  });

  describe("uploadDocument", () => {
    it("should create document pending upload and return presigned URL", async () => {
      const mockPresignedUrl = "https://s3.amazonaws.com/presigned-upload-url";
      mockPrismaClient.documentPendingUpload.create.mockResolvedValueOnce(
        mockDocumentPendingUpload
      );
      mockGetSignedUrl.mockResolvedValueOnce(mockPresignedUrl);

      const result = await adapter.uploadDocument({ input: mockUploadInput }, testUserId);

      expect(mockPrismaClient.documentPendingUpload.create).toHaveBeenCalledExactlyOnceWith({
        data: {
          name: mockUploadInput.name,
          description: mockUploadInput.description,
          ownerUserId: testUserId,
          documentTypeId: mockUploadInput.documentType,
          applicationId: testApplicationId,
          phaseId: mockUploadInput.phaseName,
        },
      });
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-upload-bucket",
        Key: testDocumentId,
      });
      expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.any(PutObjectCommand), {
        expiresIn: 3600,
      });
      expect(result).toEqual({
        presignedURL: mockPresignedUrl,
        documentId: testDocumentId,
      });
    });

    it("should use correct upload bucket from environment", async () => {
      process.env.UPLOAD_BUCKET = "custom-upload-bucket";
      const customAdapter = createAWSS3Adapter();
      const mockPresignedUrl = "https://s3.amazonaws.com/presigned-upload-url";

      mockPrismaClient.documentPendingUpload.create.mockResolvedValueOnce(
        mockDocumentPendingUpload
      );
      mockGetSignedUrl.mockResolvedValueOnce(mockPresignedUrl);

      await customAdapter.uploadDocument({ input: mockUploadInput }, testUserId);

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "custom-upload-bucket",
        Key: testDocumentId,
      });
    });

    it("should handle Prisma errors", async () => {
      const testError = new Error("Database error");
      mockPrismaClient.documentPendingUpload.create.mockRejectedValueOnce(testError);

      await expect(
        adapter.uploadDocument({ input: mockUploadInput }, testUserId)
      ).rejects.toThrowError(testHandlePrismaError);

      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
    });

    it("should use document ID as S3 key", async () => {
      const mockPresignedUrl = "https://s3.amazonaws.com/presigned-upload-url";
      mockPrismaClient.documentPendingUpload.create.mockResolvedValueOnce(
        mockDocumentPendingUpload
      );
      mockGetSignedUrl.mockResolvedValueOnce(mockPresignedUrl);

      await adapter.uploadDocument({ input: mockUploadInput }, testUserId);

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: testDocumentId,
        })
      );
    });
  });

  describe("getPresignedDownloadUrl", () => {
    it("should return presigned download URL for document", async () => {
      const mockPresignedUrl = "https://s3.amazonaws.com/presigned-download-url";
      mockGetSignedUrl.mockResolvedValueOnce(mockPresignedUrl);

      const result = await adapter.getPresignedDownloadUrl(testDocumentId);

      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-clean-bucket",
        Key: testDocumentId,
      });
      expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.any(GetObjectCommand), {
        expiresIn: 3600,
      });
      expect(result).toBe(mockPresignedUrl);
    });

    it("should use correct clean bucket from environment", async () => {
      process.env.CLEAN_BUCKET = "custom-clean-bucket";
      const customAdapter = createAWSS3Adapter();
      const mockPresignedUrl = "https://s3.amazonaws.com/presigned-download-url";
      mockGetSignedUrl.mockResolvedValueOnce(mockPresignedUrl);

      await customAdapter.getPresignedDownloadUrl(testDocumentId);

      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: "custom-clean-bucket",
        Key: testDocumentId,
      });
    });
  });

  describe("moveDocumentFromCleanToDeleted", () => {
    it("should copy document to deleted bucket and delete from clean bucket", async () => {
      mockSend
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } }) // Copy
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } }); // Delete

      await adapter.moveDocumentFromCleanToDeleted(testDocumentId);

      expect(CopyObjectCommand).toHaveBeenCalledWith({
        CopySource: `test-clean-bucket/${testDocumentId}`,
        Bucket: "test-deleted-bucket",
        Key: testDocumentId,
      });
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-clean-bucket",
        Key: testDocumentId,
      });
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("should accept 200 status code for copy operation", async () => {
      mockSend
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } })
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } });

      await expect(adapter.moveDocumentFromCleanToDeleted(testDocumentId)).resolves.toBeUndefined();
    });

    it("should accept 200 status code for delete operation", async () => {
      mockSend
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } })
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } });

      await expect(adapter.moveDocumentFromCleanToDeleted(testDocumentId)).resolves.toBeUndefined();
    });

    it("should accept 204 status code for delete operation", async () => {
      mockSend
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } })
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } });

      await expect(adapter.moveDocumentFromCleanToDeleted(testDocumentId)).resolves.toBeUndefined();
    });

    it("should throw error if copy operation fails with non-200 status", async () => {
      mockSend.mockResolvedValueOnce({ $metadata: { httpStatusCode: 404 } });

      await expect(adapter.moveDocumentFromCleanToDeleted(testDocumentId)).rejects.toThrowError(
        "Error while copying document to deleted bucket"
      );

      expect(mockSend).toHaveBeenCalledOnce();
    });

    it("should throw error if copy operation throws exception", async () => {
      mockSend.mockRejectedValueOnce(new Error("S3 copy failed"));

      await expect(adapter.moveDocumentFromCleanToDeleted(testDocumentId)).rejects.toThrowError(
        "Error while copying document to deleted bucket"
      );
    });

    it("should throw error if delete operation fails with non-200/204 status", async () => {
      mockSend
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } })
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 403 } });

      await expect(adapter.moveDocumentFromCleanToDeleted(testDocumentId)).rejects.toThrowError(
        "Failed to delete document from clean bucket"
      );

      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("should throw error if delete operation throws exception", async () => {
      mockSend
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } })
        .mockRejectedValueOnce(new Error("S3 delete failed"));

      await expect(adapter.moveDocumentFromCleanToDeleted(testDocumentId)).rejects.toThrowError(
        "Failed to delete document from clean bucket"
      );
    });

    it("should use correct buckets from environment", async () => {
      process.env.CLEAN_BUCKET = "custom-clean-bucket";
      process.env.DELETED_BUCKET = "custom-deleted-bucket";
      const customAdapter = createAWSS3Adapter();

      mockSend
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } })
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } });

      await customAdapter.moveDocumentFromCleanToDeleted(testDocumentId);

      expect(CopyObjectCommand).toHaveBeenCalledWith({
        CopySource: `custom-clean-bucket/${testDocumentId}`,
        Bucket: "custom-deleted-bucket",
        Key: testDocumentId,
      });
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: "custom-clean-bucket",
        Key: testDocumentId,
      });
    });

    it("should perform operations in correct order: copy then delete", async () => {
      const callOrder: string[] = [];

      mockSend.mockImplementation(async (command) => {
        if (command instanceof CopyObjectCommand) {
          callOrder.push("copy");
          return { $metadata: { httpStatusCode: 200 } };
        }
        if (command instanceof DeleteObjectCommand) {
          callOrder.push("delete");
          return { $metadata: { httpStatusCode: 204 } };
        }
        return { $metadata: {} };
      });

      await adapter.moveDocumentFromCleanToDeleted(testDocumentId);

      expect(callOrder).toEqual(["copy", "delete"]);
    });
  });
});
