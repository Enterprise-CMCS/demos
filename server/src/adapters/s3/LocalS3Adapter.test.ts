import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaTransactionClient } from "../../prismaClient";
import { createLocalS3Adapter } from "./LocalS3Adapter";
import {
  Prisma,
  Document as PrismaDocument,
  DocumentPendingUpload as PrismaDocumentPendingUpload,
} from "@prisma/client";

describe("LocalS3Adapter", () => {
  const mockTransaction = {
    document: {
      create: vi.fn(),
    },
    documentPendingUpload: {
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
  });

  describe("getPresignedDownloadUrl", () => {
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

  describe("getDownloadFileName", () => {
    it("returns the sanitized name without an extension", async () => {
      const adapter = createLocalS3Adapter();

      const result = await adapter.getDownloadFileName("uuid-123", "Budget FY25/26");

      expect(result).toBe("Budget FY25 26");
    });

    it("falls back to the key when the name is entirely invalid characters", async () => {
      const adapter = createLocalS3Adapter();

      const result = await adapter.getDownloadFileName("uuid-123", "///");

      expect(result).toBe("uuid-123");
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
    const mockUploadInput = {
      name: "test.pdf",
      description: "Test document",
      documentTypeId: "State Application",
      applicationId: "app-123",
      phaseId: "Concept",
      ownerUserId: testUserId,
    };

    const mockCreatedDocument: Partial<PrismaDocument> = {
      id: testDocumentId,
      name: "test.pdf",
      description: "Test document",
      ownerUserId: testUserId,
      documentTypeId: "State Application",
      applicationId: "app-123",
      phaseId: "Concept",
      s3Path: "s3://local-demos-bucket/app-123/doc-123-456",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    };

    it("should create document in database and return presigned URL", async () => {
      vi.mocked(mockTransaction.document.create).mockResolvedValue(
        mockCreatedDocument as PrismaDocument
      );
      vi.mocked(mockTransaction.documentPendingUpload.create).mockResolvedValue(
        mockCreatedDocument as PrismaDocument
      );

      const adapter = createLocalS3Adapter();
      const result = await adapter.uploadDocument(
        mockUploadInput as Prisma.DocumentCreateArgs["data"],
        mockTransaction
      );

      expect(mockTransaction.documentPendingUpload.create).toHaveBeenCalledExactlyOnceWith({
        data: {
          name: "test.pdf",
          description: "Test document",
          ownerUserId: testUserId,
          documentTypeId: "State Application",
          applicationId: "app-123",
          phaseId: "Concept",
        },
      });

      expect(mockTransaction.document.create).toHaveBeenCalledExactlyOnceWith({
        data: {
          id: testDocumentId,
          name: "test.pdf",
          description: "Test document",
          ownerUserId: testUserId,
          documentTypeId: "State Application",
          applicationId: "app-123",
          phaseId: "Concept",
          s3Path: `LocalS3Adapter/local-demos-bucket/${testDocumentId}`,
        },
      });
      expect(result).toMatchObject({
        id: testDocumentId,
      });
    });

    it("should handle input without description", async () => {
      const inputWithoutDescription = {
        ...mockUploadInput,
        description: undefined,
      };
      vi.mocked(mockTransaction.documentPendingUpload.create).mockResolvedValue({
        ...mockCreatedDocument,
        description: null,
      } as PrismaDocument);

      const adapter = createLocalS3Adapter();
      await adapter.uploadDocument(inputWithoutDescription, mockTransaction);

      expect(mockTransaction.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: undefined,
        }),
      });
    });

    it("should construct s3Path with applicationId and documentId", async () => {
      vi.mocked(mockTransaction.documentPendingUpload.create).mockResolvedValue(
        mockCreatedDocument as PrismaDocumentPendingUpload
      );

      const adapter = createLocalS3Adapter();
      await adapter.uploadDocument(mockUploadInput, mockTransaction);

      const createCall = vi.mocked(mockTransaction.document.create).mock.calls[0][0];
      expect(createCall.data.s3Path).toMatch(`LocalS3Adapter/local-demos-bucket/${testDocumentId}`);
    });

    it("should add uploaded document to in-memory tracking", async () => {
      vi.mocked(mockTransaction.documentPendingUpload.create).mockResolvedValue(
        mockCreatedDocument as PrismaDocumentPendingUpload
      );

      const adapter = createLocalS3Adapter();
      const result = await adapter.uploadDocument(mockUploadInput, mockTransaction);

      // Verify the document can be downloaded (exists in memory)
      const downloadUrl = await adapter.getPresignedDownloadUrl(result.id);
      expect(downloadUrl).toMatch(
        `LocalS3Adapter/local-demos-bucket/${testDocumentId}?download=true&expires=3600`
      );
    });
  });

  describe("uploadOnDemandReport", () => {
    it("should return the correct key for the report", async () => {
      const adapter = createLocalS3Adapter();
      const reportId = "report-abc-123";

      const result = await adapter.uploadOnDemandReport(reportId, Buffer.from("data"));

      expect(result).toBe(`reports/on-demand/${reportId}.xlsx`);
    });

    it("should make the uploaded report downloadable with its byte size", async () => {
      const adapter = createLocalS3Adapter();
      const reportId = "report-abc-123";
      const reportData = Buffer.from("report contents");

      const key = await adapter.uploadOnDemandReport(reportId, reportData);
      const downloadUrl = await adapter.getPresignedDownloadUrl(key);

      expect(downloadUrl).toBe(
        `LocalS3Adapter/local-demos-bucket/${key}?download=true&expires=3600&size=${reportData.byteLength}`
      );
    });
  });

  describe("deleteOnDemandReport", () => {
    it("should return the correct key for the report", async () => {
      const adapter = createLocalS3Adapter();
      const reportId = "report-abc-123";

      const result = await adapter.deleteOnDemandReport(reportId);

      expect(result).toBe(`reports/on-demand/${reportId}.xlsx`);
    });

    it("should not throw when deleting a non-existent report", async () => {
      const adapter = createLocalS3Adapter();

      await expect(adapter.deleteOnDemandReport("non-existent-id")).resolves.not.toThrow();
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
