import { describe, it, expect, vi, beforeEach } from "vitest";
import { Document as PrismaDocument } from "@prisma/client";
import { getS3Adapter, S3Adapter } from "../../adapters/s3/S3Adapter";
import { handleDeleteDocument } from ".";
import { deleteDocument } from "./queries/deleteDocument";
import { BN_WORKBOOK_DOCUMENT_TYPE } from "../../constants";
import { deleteBudgetNeutralityWorkbook } from "../budgetNeutralityWorkbook/queries";
import { PrismaTransactionClient } from "../../prismaClient";

vi.mock("./queries/deleteDocument", () => ({
  deleteDocument: vi.fn(),
}));

vi.mock("../budgetNeutralityWorkbook/queries", () => ({
  deleteBudgetNeutralityWorkbook: vi.fn(),
}));

vi.mock("../../adapters/s3/S3Adapter", () => ({
  getS3Adapter: vi.fn(),
}));

describe("handleDeleteDocument", () => {
  const mockTransaction = {} as PrismaTransactionClient;
  const testDocumentId = "doc-123-456";
  const testApplicationId = "app-123-456";
  const mockMoveDocumentFromCleanToDeleted = vi.fn();
  const mockS3Adapter: Partial<S3Adapter> = {
    getPresignedUploadUrl: vi.fn(),
    getPresignedDownloadUrl: vi.fn(),
    moveDocumentFromCleanToDeleted: mockMoveDocumentFromCleanToDeleted,
    uploadDocument: vi.fn(),
  };

  const mockDeletedDocument: Partial<PrismaDocument> = {
    name: "Test Document",
    id: testDocumentId,
    description: "Test document description",
    s3Path: "s3/path/to/document.pdf",
    ownerUserId: "user-123",
    documentTypeId: "State Application",
    applicationId: testApplicationId,
    phaseId: "Concept",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-02T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getS3Adapter).mockReturnValue(mockS3Adapter as S3Adapter);
  });

  it("should validate that the document can be deleted before proceeding", async () => {
    vi.mocked(deleteDocument).mockResolvedValue(mockDeletedDocument as PrismaDocument);

    await handleDeleteDocument({ id: testDocumentId }, mockTransaction);

    expect(deleteDocument).toHaveBeenCalledExactlyOnceWith({ id: testDocumentId }, mockTransaction);
    expect(mockMoveDocumentFromCleanToDeleted).toHaveBeenCalledExactlyOnceWith(
      `${testApplicationId}/${testDocumentId}`
    );
  });

  it("should delete document by id and move it to deleted bucket", async () => {
    vi.mocked(deleteDocument).mockResolvedValue(mockDeletedDocument as PrismaDocument);

    await handleDeleteDocument({ id: testDocumentId }, mockTransaction);

    expect(deleteDocument).toHaveBeenCalledExactlyOnceWith({ id: testDocumentId }, mockTransaction);
    expect(mockMoveDocumentFromCleanToDeleted).toHaveBeenCalledExactlyOnceWith(
      `${testApplicationId}/${testDocumentId}`
    );
  });

  it("should return the deleted document", async () => {
    vi.mocked(deleteDocument).mockResolvedValue(mockDeletedDocument as PrismaDocument);

    const result = await handleDeleteDocument({ id: testDocumentId }, mockTransaction);

    expect(result).toEqual(mockDeletedDocument);
  });

  describe("BN Workbook", () => {
    it("should also delete the associated budget neutrality workbook if it is of type BN Workbook", async () => {
      const mockBNWorkbookDocument = {
        ...mockDeletedDocument,
        documentTypeId: BN_WORKBOOK_DOCUMENT_TYPE,
      } as PrismaDocument;
      vi.mocked(deleteDocument).mockResolvedValue(mockBNWorkbookDocument);
      await handleDeleteDocument({ id: testDocumentId }, mockTransaction);
      expect(deleteBudgetNeutralityWorkbook).toHaveBeenCalledExactlyOnceWith(
        { id: testDocumentId },
        mockTransaction
      );
    });

    it("should not attempt to delete a budget neutrality workbook if the document is not of type BN Workbook", async () => {
      const mockNonBNWorkbookDocument = {
        ...mockDeletedDocument,
        documentTypeId: "State Application",
      } as PrismaDocument;
      vi.mocked(deleteDocument).mockResolvedValue(mockNonBNWorkbookDocument);
      await handleDeleteDocument({ id: testDocumentId }, mockTransaction);
      expect(deleteBudgetNeutralityWorkbook).not.toHaveBeenCalled();
    });
  });
});
