import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DocumentAdapter } from "./DocumentAdapter.js";
import { UploadDocumentInput, UploadDocumentResponse } from "../../types.js";
import { Document as PrismaDocument } from "@prisma/client";

// Mock dependencies
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../log.js", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

// Mock crypto.randomUUID
vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(),
}));

// Import after mocks
import { createLocalDocumentAdapter } from "./LocalDocumentAdapter.js";
import { prisma } from "../../prismaClient.js";
import { log } from "../../log.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { randomUUID, UUID } from "node:crypto";

describe("LocalDocumentAdapter", () => {
  let adapter: DocumentAdapter;
  let originalUploadBucket: string | undefined;

  const mockPrismaClient = {
    document: {
      create: vi.fn(),
    },
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

  const mockDocument: PrismaDocument = {
    id: testDocumentId,
    name: mockUploadInput.name,
    description: mockUploadInput.description!,
    ownerUserId: testUserId,
    documentTypeId: mockUploadInput.documentType,
    applicationId: testApplicationId,
    phaseId: mockUploadInput.phaseName,
    s3Path: `s3://local-simple-upload/${testApplicationId}/${testDocumentId}`,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(randomUUID).mockReturnValue(testDocumentId as UUID);
    adapter = createLocalDocumentAdapter();
    originalUploadBucket = process.env.UPLOAD_BUCKET;
  });

  afterEach(() => {
    if (originalUploadBucket === undefined) {
      delete process.env.UPLOAD_BUCKET;
    } else {
      process.env.UPLOAD_BUCKET = originalUploadBucket;
    }
  });

  describe("uploadDocument", () => {
    it("should create document and return presigned URL", async () => {
      mockPrismaClient.document.create.mockResolvedValueOnce(mockDocument);

      const result = await adapter.uploadDocument({ input: mockUploadInput }, testUserId);

      expect(randomUUID).toHaveBeenCalledOnce();
      expect(mockPrismaClient.document.create).toHaveBeenCalledExactlyOnceWith({
        data: {
          id: testDocumentId,
          name: mockUploadInput.name,
          description: mockUploadInput.description,
          ownerUserId: testUserId,
          documentTypeId: mockUploadInput.documentType,
          applicationId: testApplicationId,
          phaseId: mockUploadInput.phaseName,
          s3Path: `s3://local-simple-upload/${testApplicationId}/${testDocumentId}`,
        },
      });
      expect(result).toEqual({
        presignedURL: `LocalS3Adapter/local-demos-bucket/${testDocumentId}?upload=true&expires=3600`,
        documentId: testDocumentId,
      });
    });

    it("should use custom UPLOAD_BUCKET from environment", async () => {
      process.env.UPLOAD_BUCKET = "custom-bucket";
      mockPrismaClient.document.create.mockResolvedValueOnce({
        ...mockDocument,
        s3Path: `s3://custom-bucket/${testApplicationId}/${testDocumentId}`,
      });

      await adapter.uploadDocument({ input: mockUploadInput }, testUserId);

      expect(mockPrismaClient.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            s3Path: `s3://custom-bucket/${testApplicationId}/${testDocumentId}`,
          }),
        })
      );
    });

    it("should use default bucket when UPLOAD_BUCKET is not set", async () => {
      delete process.env.UPLOAD_BUCKET;
      mockPrismaClient.document.create.mockResolvedValueOnce(mockDocument);

      await adapter.uploadDocument({ input: mockUploadInput }, testUserId);

      expect(mockPrismaClient.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            s3Path: `s3://local-simple-upload/${testApplicationId}/${testDocumentId}`,
          }),
        })
      );
    });

    it("should handle Prisma errors", async () => {
      const testError = new Error("Database error");
      mockPrismaClient.document.create.mockRejectedValueOnce(testError);

      await expect(
        adapter.uploadDocument({ input: mockUploadInput }, testUserId)
      ).rejects.toThrowError(testHandlePrismaError);

      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
    });

    it("should return UploadDocumentResponse structure", async () => {
      mockPrismaClient.document.create.mockResolvedValueOnce(mockDocument);

      const result = await adapter.uploadDocument({ input: mockUploadInput }, testUserId);

      expect(result).toHaveProperty("presignedURL");
      expect(result).toHaveProperty("documentId");
      expect(typeof result.presignedURL).toBe("string");
      expect(typeof result.documentId).toBe("string");
    });

    it("should track uploaded file internally", async () => {
      mockPrismaClient.document.create.mockResolvedValueOnce(mockDocument);

      await adapter.uploadDocument({ input: mockUploadInput }, testUserId);

      // Now the file should be accessible via getPresignedDownloadUrl
      const downloadUrl = await adapter.getPresignedDownloadUrl(testDocumentId);

      expect(downloadUrl).toBe(
        `LocalS3Adapter/local-demos-bucket/${testDocumentId}?download=true&expires=3600`
      );
    });
  });

  describe("getPresignedDownloadUrl", () => {
    it("should return download URL for uploaded document", async () => {
      // First upload a document
      mockPrismaClient.document.create.mockResolvedValueOnce(mockDocument);
      await adapter.uploadDocument({ input: mockUploadInput }, testUserId);

      // Then get download URL
      const url = await adapter.getPresignedDownloadUrl(testDocumentId);

      expect(url).toBe(
        `LocalS3Adapter/local-demos-bucket/${testDocumentId}?download=true&expires=3600`
      );
    });

    it("should return error message for non-existent document", async () => {
      const url = await adapter.getPresignedDownloadUrl("non-existent-id");

      expect(url).toBe("non-existent-id does not exist!");
    });

    it("should work with multiple uploaded documents", async () => {
      const documentIds: UUID[] = [
        "aaaa-aaaa-aaaa-aaaa-aaaa",
        "bbbb-bbbb-bbbb-bbbb-bbbb",
        "cccc-cccc-cccc-cccc-cccc",
      ];
      let callCount = 0;
      vi.mocked(randomUUID).mockImplementation(() => documentIds[callCount++]);

      // Upload multiple documents
      for (const docId of documentIds) {
        mockPrismaClient.document.create.mockResolvedValueOnce({
          ...mockDocument,
          id: docId,
        });
        await adapter.uploadDocument({ input: mockUploadInput }, testUserId);
      }

      // Check all can be downloaded
      for (const docId of documentIds) {
        const url = await adapter.getPresignedDownloadUrl(docId);
        expect(url).toBe(`LocalS3Adapter/local-demos-bucket/${docId}?download=true&expires=3600`);
      }
    });
  });

  describe("moveDocumentFromCleanToDeleted", () => {
    it("should remove document from tracking", async () => {
      // Upload document
      mockPrismaClient.document.create.mockResolvedValueOnce(mockDocument);
      await adapter.uploadDocument({ input: mockUploadInput }, testUserId);

      // Verify it exists
      let url = await adapter.getPresignedDownloadUrl(testDocumentId);
      expect(url).toContain("download=true");

      // Move to deleted
      await adapter.moveDocumentFromCleanToDeleted(testDocumentId);

      // Verify it no longer exists
      url = await adapter.getPresignedDownloadUrl(testDocumentId);
      expect(url).toBe(`${testDocumentId} does not exist!`);
    });

    it("should not throw error for non-existent document", async () => {
      await expect(
        adapter.moveDocumentFromCleanToDeleted("non-existent-id")
      ).resolves.toBeUndefined();
    });

    it("should handle multiple deletions", async () => {
      const documentIds: UUID[] = [
        "aaaa-aaaa-aaaa-aaaa-aaaa",
        "bbbb-bbbb-bbbb-bbbb-bbbb",
        "cccc-cccc-cccc-cccc-cccc",
      ];
      let callCount = 0;
      vi.mocked(randomUUID).mockImplementation(() => documentIds[callCount++]);

      // Upload multiple documents
      for (const docId of documentIds) {
        mockPrismaClient.document.create.mockResolvedValueOnce({
          ...mockDocument,
          id: docId,
        });
        await adapter.uploadDocument({ input: mockUploadInput }, testUserId);
      }

      // Delete them
      for (const docId of documentIds) {
        await adapter.moveDocumentFromCleanToDeleted(docId);
      }

      // Verify all are deleted
      for (const docId of documentIds) {
        const url = await adapter.getPresignedDownloadUrl(docId);
        expect(url).toBe(`${docId} does not exist!`);
      }
    });
  });

  describe("In-memory state management", () => {
    it("should persist state within same adapter instance", async () => {
      // Setup first document
      const firstDocId = testDocumentId as UUID;
      vi.mocked(randomUUID).mockReturnValueOnce(firstDocId);
      mockPrismaClient.document.create.mockResolvedValueOnce(mockDocument);
      await adapter.uploadDocument({ input: mockUploadInput }, testUserId);

      // Setup second document
      const secondDocId = "1234-1234-1234-1234-1234" as UUID;
      vi.mocked(randomUUID).mockReturnValueOnce(secondDocId);
      const secondMockDocument = {
        ...mockDocument,
        id: secondDocId,
      };
      mockPrismaClient.document.create.mockResolvedValueOnce(secondMockDocument);
      await adapter.uploadDocument({ input: mockUploadInput }, testUserId);

      // Both should be accessible
      const url1 = await adapter.getPresignedDownloadUrl(firstDocId);
      const url2 = await adapter.getPresignedDownloadUrl(secondDocId);

      expect(url1).toContain("download=true");
      expect(url2).toContain("download=true");
    });
  });
});
