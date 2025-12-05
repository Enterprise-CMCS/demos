import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLocalS3Adapter } from "./LocalS3Adapter.js";
import { UploadDocumentInput } from "../../model/document/documentSchema.js";
import { PrismaTransactionClient } from "../../prismaClient.js";

describe("LocalS3Adapter", () => {
  const mockTransaction = {
    document: {
      create: vi.fn(),
    },
  } as unknown as PrismaTransactionClient;

  const testUserId = "user-123";
  const testDocumentId = "doc-123-456";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getPresignedUploadUrl", () => {
    it("should return a fake presigned upload URL", async () => {
      const adapter = createLocalS3Adapter();
      const testKey = "test-key";

      const result = await adapter.getPresignedUploadUrl(testKey);

      expect(result).toBe("LocalS3Adapter/local-demos-bucket/test-key?upload=true&expires=3600");
    });

    it("should track uploaded keys in memory", async () => {
      const adapter = createLocalS3Adapter();
      const testKey = "test-key";

      await adapter.getPresignedUploadUrl(testKey);
      const downloadUrl = await adapter.getPresignedDownloadUrl(testKey);

      expect(downloadUrl).toBe(
        "LocalS3Adapter/local-demos-bucket/test-key?download=true&expires=3600"
      );
    });
  });

  describe("getPresignedDownloadUrl", () => {
    it("should return a fake presigned download URL for uploaded files", async () => {
      const adapter = createLocalS3Adapter();
      const testKey = "test-key";

      await adapter.getPresignedUploadUrl(testKey);
      const result = await adapter.getPresignedDownloadUrl(testKey);

      expect(result).toBe("LocalS3Adapter/local-demos-bucket/test-key?download=true&expires=3600");
    });

    it("should return error message for non-existent files", async () => {
      const adapter = createLocalS3Adapter();
      const testKey = "non-existent-key";

      const result = await adapter.getPresignedDownloadUrl(testKey);

      expect(result).toBe("non-existent-key does not exist!");
    });

    it("should return error message for deleted files", async () => {
      const adapter = createLocalS3Adapter();
      const testKey = "test-key";

      await adapter.getPresignedUploadUrl(testKey);
      await adapter.moveDocumentFromCleanToDeleted(testKey);
      const result = await adapter.getPresignedDownloadUrl(testKey);

      expect(result).toBe("test-key does not exist!");
    });
  });

  describe("moveDocumentFromCleanToDeleted", () => {
    it("should remove file from uploaded files set", async () => {
      const adapter = createLocalS3Adapter();
      const testKey = "test-key";

      await adapter.getPresignedUploadUrl(testKey);
      await adapter.moveDocumentFromCleanToDeleted(testKey);
      const downloadUrl = await adapter.getPresignedDownloadUrl(testKey);

      expect(downloadUrl).toBe("test-key does not exist!");
    });

    it("should not throw error when deleting non-existent file", async () => {
      const adapter = createLocalS3Adapter();
      const testKey = "non-existent-key";

      await expect(adapter.moveDocumentFromCleanToDeleted(testKey)).resolves.not.toThrow();
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

    const mockCreatedDocument = {
      id: testDocumentId,
      name: "test.pdf",
      description: "Test document",
      ownerUserId: testUserId,
      documentTypeId: "State Application",
      applicationId: "app-123",
      phaseId: "Concept",
      s3Path: "s3://local-simple-upload/app-123/doc-123-456",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    };

    it("should create document in database and return presigned URL", async () => {
      vi.mocked(mockTransaction.document.create).mockResolvedValue(mockCreatedDocument);

      const adapter = createLocalS3Adapter();
      const result = await adapter.uploadDocument(mockTransaction, mockUploadInput, testUserId);

      expect(mockTransaction.document.create).toHaveBeenCalledExactlyOnceWith({
        data: {
          id: expect.any(String),
          name: "test.pdf",
          description: "Test document",
          ownerUserId: testUserId,
          documentTypeId: "State Application",
          applicationId: "app-123",
          phaseId: "Concept",
          s3Path: expect.stringMatching(/^s3:\/\/local-simple-upload\/app-123\/.+$/),
        },
      });
      expect(result).toHaveProperty("presignedURL");
      expect(result).toHaveProperty("documentId", testDocumentId);
      expect(result.presignedURL).toMatch(
        /^LocalS3Adapter\/local-demos-bucket\/.+\?upload=true&expires=3600$/
      );
    });

    it("should handle input without description", async () => {
      const inputWithoutDescription = {
        ...mockUploadInput,
        description: undefined,
      };
      vi.mocked(mockTransaction.document.create).mockResolvedValue(mockCreatedDocument);

      const adapter = createLocalS3Adapter();
      await adapter.uploadDocument(mockTransaction, inputWithoutDescription, testUserId);

      expect(mockTransaction.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: "",
        }),
      });
    });

    it("should generate UUID for document ID", async () => {
      vi.mocked(mockTransaction.document.create).mockResolvedValue(mockCreatedDocument);

      const adapter = createLocalS3Adapter();
      await adapter.uploadDocument(mockTransaction, mockUploadInput, testUserId);

      const createCall = vi.mocked(mockTransaction.document.create).mock.calls[0][0];
      expect(createCall.data.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it("should construct s3Path with applicationId and documentId", async () => {
      vi.mocked(mockTransaction.document.create).mockResolvedValue(mockCreatedDocument);

      const adapter = createLocalS3Adapter();
      await adapter.uploadDocument(mockTransaction, mockUploadInput, testUserId);

      const createCall = vi.mocked(mockTransaction.document.create).mock.calls[0][0];
      expect(createCall.data.s3Path).toMatch(/^s3:\/\/local-simple-upload\/app-123\/.+$/);
    });

    it("should use UPLOAD_BUCKET environment variable if set", async () => {
      const originalEnv = process.env.UPLOAD_BUCKET;
      process.env.UPLOAD_BUCKET = "custom-upload-bucket";
      vi.mocked(mockTransaction.document.create).mockResolvedValue({
        ...mockCreatedDocument,
        s3Path: "s3://custom-upload-bucket/app-123/doc-123-456",
      });

      const adapter = createLocalS3Adapter();
      await adapter.uploadDocument(mockTransaction, mockUploadInput, testUserId);

      const createCall = vi.mocked(mockTransaction.document.create).mock.calls[0][0];
      expect(createCall.data.s3Path).toMatch(/^s3:\/\/custom-upload-bucket\/.+$/);

      // Restore original env
      if (originalEnv !== undefined) {
        process.env.UPLOAD_BUCKET = originalEnv;
      } else {
        delete process.env.UPLOAD_BUCKET;
      }
    });

    it("should add uploaded document to in-memory tracking", async () => {
      vi.mocked(mockTransaction.document.create).mockResolvedValue(mockCreatedDocument);

      const adapter = createLocalS3Adapter();
      const result = await adapter.uploadDocument(mockTransaction, mockUploadInput, testUserId);

      // Verify the document can be downloaded (exists in memory)
      const downloadUrl = await adapter.getPresignedDownloadUrl(result.documentId);
      expect(downloadUrl).toMatch(
        /^LocalS3Adapter\/local-demos-bucket\/.+\?download=true&expires=3600$/
      );
    });
  });

  describe("in-memory state isolation", () => {
    it("should maintain separate state for each adapter instance", async () => {
      const adapter1 = createLocalS3Adapter();
      const adapter2 = createLocalS3Adapter();

      await adapter1.getPresignedUploadUrl("key1");
      await adapter2.getPresignedUploadUrl("key2");

      const result1 = await adapter1.getPresignedDownloadUrl("key2");
      const result2 = await adapter2.getPresignedDownloadUrl("key1");

      expect(result1).toBe("key2 does not exist!");
      expect(result2).toBe("key1 does not exist!");
    });
  });
});
