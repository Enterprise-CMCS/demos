import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UploadDocumentInput } from "../../model/document/documentSchema";
import { createAWSS3Adapter } from "./AwsS3Adapter";
import { createDocumentPendingUpload } from "../../model/documentPendingUpload";

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn((params) => ({ params })),
  GetObjectCommand: vi.fn((params) => ({ params })),
  CopyObjectCommand: vi.fn((params) => ({ params })),
  DeleteObjectCommand: vi.fn((params) => ({ params })),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock("../../model/documentPendingUpload/queries/createDocumentPendingUpload.js", () => ({
  createDocumentPendingUpload: vi.fn(),
}));

describe("AwsS3Adapter", () => {
  const originalEnv = { ...process.env };
  const mockTransaction = "mockTransaction" as any;
  const testUserId = "user-123";

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.UPLOAD_BUCKET = "test-upload-bucket";
    process.env.CLEAN_BUCKET = "test-clean-bucket";
    process.env.DELETED_BUCKET = "test-deleted-bucket";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getPresignedUploadUrl", () => {
    it("should generate presigned upload URL for given key", async () => {
      const testKey = "test-document-id";
      const mockPresignedUrl = "https://s3.amazonaws.com/upload/presigned-url";
      vi.mocked(getSignedUrl).mockResolvedValue(mockPresignedUrl);

      const adapter = createAWSS3Adapter();
      const result = await adapter.getPresignedUploadUrl(testKey);

      expect(result).toBe(mockPresignedUrl);
      expect(getSignedUrl).toHaveBeenCalledOnce();
    });

    it("should use upload bucket from environment", async () => {
      const testKey = "test-document-id";
      vi.mocked(getSignedUrl).mockResolvedValue("https://presigned-url");

      const adapter = createAWSS3Adapter();
      await adapter.getPresignedUploadUrl(testKey);

      const putObjectCommand = vi.mocked(getSignedUrl).mock.calls[0][1];
      expect(putObjectCommand).toHaveProperty("params");
      expect((putObjectCommand as any).params.Bucket).toBe("test-upload-bucket");
      expect((putObjectCommand as any).params.Key).toBe(testKey);
    });
  });

  describe("getPresignedDownloadUrl", () => {
    it("should generate presigned download URL for given key", async () => {
      const testKey = "test-document-id";
      const mockPresignedUrl = "https://s3.amazonaws.com/download/presigned-url";
      vi.mocked(getSignedUrl).mockResolvedValue(mockPresignedUrl);

      const adapter = createAWSS3Adapter();
      const result = await adapter.getPresignedDownloadUrl(testKey);

      expect(result).toBe(mockPresignedUrl);
      expect(getSignedUrl).toHaveBeenCalledOnce();
    });

    it("should use clean bucket from environment", async () => {
      const testKey = "test-document-id";
      vi.mocked(getSignedUrl).mockResolvedValue("https://presigned-url");

      const adapter = createAWSS3Adapter();
      await adapter.getPresignedDownloadUrl(testKey);

      const getObjectCommand = vi.mocked(getSignedUrl).mock.calls[0][1];
      expect(getObjectCommand).toHaveProperty("params");
      expect((getObjectCommand as any).params.Bucket).toBe("test-clean-bucket");
      expect((getObjectCommand as any).params.Key).toBe(testKey);
    });
  });

  describe("moveDocumentFromCleanToDeleted", () => {
    it("should copy document from clean to deleted bucket and delete from clean", async () => {
      const testKey = "test-document-id";
      const mockS3Client = {
        send: vi
          .fn()
          .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } }) // copy response
          .mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } }), // delete response
      };
      vi.mocked(S3Client).mockReturnValue(mockS3Client as any);

      const adapter = createAWSS3Adapter();
      await adapter.moveDocumentFromCleanToDeleted(testKey);

      expect(mockS3Client.send).toHaveBeenCalledTimes(2);
    });

    it("should throw error if copy operation fails", async () => {
      const testKey = "test-document-id";
      const mockS3Client = {
        send: vi.fn().mockResolvedValueOnce({ $metadata: { httpStatusCode: 500 } }),
      };
      vi.mocked(S3Client).mockReturnValue(mockS3Client as any);

      const adapter = createAWSS3Adapter();

      await expect(adapter.moveDocumentFromCleanToDeleted(testKey)).rejects.toThrow(
        "Response from copy operation returned with a non-200 status"
      );
    });

    it("should throw error if delete operation fails", async () => {
      const testKey = "test-document-id";
      const mockS3Client = {
        send: vi
          .fn()
          .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } })
          .mockResolvedValueOnce({ $metadata: { httpStatusCode: 500 } }),
      };
      vi.mocked(S3Client).mockReturnValue(mockS3Client as any);

      const adapter = createAWSS3Adapter();

      await expect(adapter.moveDocumentFromCleanToDeleted(testKey)).rejects.toThrow(
        "Response from delete operation returned with a non-200 status"
      );
    });
  });

  describe("uploadDocument", () => {
    const mockUploadInput: UploadDocumentInput = {
      name: "test.pdf",
      description: "Test document",
      documentType: "State Application",
      applicationId: "app-123",
      phaseName: "Concept",
    };

    const mockDocumentPendingUpload = {
      id: "pending-doc-123",
      name: "test.pdf",
      description: "Test document",
      documentTypeId: "State Application",
      applicationId: "app-123",
      phaseId: "Concept",
      ownerUserId: testUserId,
      createdAt: new Date(),
    };

    it("should create pending upload and return presigned URL with document ID", async () => {
      const mockPresignedUrl = "https://s3.amazonaws.com/upload/presigned-url";
      vi.mocked(createDocumentPendingUpload).mockResolvedValue(mockDocumentPendingUpload as any);
      vi.mocked(getSignedUrl).mockResolvedValue(mockPresignedUrl);

      const adapter = createAWSS3Adapter();
      const result = await adapter.uploadDocument(mockTransaction, mockUploadInput, testUserId);

      expect(createDocumentPendingUpload).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        mockUploadInput,
        testUserId
      );
      expect(result).toEqual({
        presignedURL: mockPresignedUrl,
        documentId: "pending-doc-123",
      });
    });

    it("should use document pending upload ID for presigned URL key", async () => {
      const mockPresignedUrl = "https://s3.amazonaws.com/upload/presigned-url";
      vi.mocked(createDocumentPendingUpload).mockResolvedValue(mockDocumentPendingUpload as any);
      vi.mocked(getSignedUrl).mockResolvedValue(mockPresignedUrl);

      const adapter = createAWSS3Adapter();
      await adapter.uploadDocument(mockTransaction, mockUploadInput, testUserId);

      const putObjectCommand = vi.mocked(getSignedUrl).mock.calls[0][1];
      expect((putObjectCommand as any).params.Key).toBe("pending-doc-123");
    });
  });

  describe("S3Client configuration", () => {
    it("should configure S3Client with S3_ENDPOINT_LOCAL when set", () => {
      process.env.S3_ENDPOINT_LOCAL = "http://custom-endpoint:4566";

      createAWSS3Adapter();

      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          region: "us-east-1",
          endpoint: "http://custom-endpoint:4566",
        })
      );
    });

    it("should configure S3Client with default AWS config when no local endpoint", () => {
      delete process.env.S3_ENDPOINT_LOCAL;

      createAWSS3Adapter();

      expect(S3Client).toHaveBeenCalledWith({});
    });
  });
});
