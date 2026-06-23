import { describe, it, expect, vi, beforeEach } from "vitest";
import { Document as PrismaDocument } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { UpdateDocumentInput, DocumentType, PhaseName } from "../../types";
import { prisma } from "../../prismaClient";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { getS3Adapter } from "../../adapters";
import { selectUserOrThrow } from "../user/queries";
import { getApplication } from "../application";
import { enqueueUiPath } from "../../services/uipathQueue";
import {
  triggerUiPath,
  documentResolvers,
  resolveBudgetNeutralityValidation,
  resolveHasPendingUIPathResult,
} from "./documentResolvers";
import { editDocument, getDocument, removeDocument } from "./documentData";

// Mock dependencies
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../errors/checkOptionalNotNullFields", () => ({
  checkOptionalNotNullFields: vi.fn(),
}));

vi.mock("../../adapters", () => ({
  getS3Adapter: vi.fn(),
}));

vi.mock("./documentData", () => ({
  getDocument: vi.fn(),
  editDocument: vi.fn(),
  removeDocument: vi.fn(),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
}));

vi.mock("../../dateUtilities", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../dateUtilities")>();
  return {
    ...actual,
    getEasternNow: vi.fn(),
  };
});

vi.mock("../applicationPhase", () => ({
  startPhaseByDocument: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  validateAndUpdateDates: vi.fn(),
}));

vi.mock("../../services/uipathQueue", () => ({
  enqueueUiPath: vi.fn(),
}));

vi.mock("../user/queries", () => ({
  selectUserOrThrow: vi.fn(),
}));

describe("documentResolvers", () => {
  const mockTransaction = "mockTransaction" as any;
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
    uiPathResult: {
      findFirst: vi.fn(),
    },
    budgetNeutralityWorkbook: {
      findUnique: vi.fn(),
    },
  };

  const testDocumentId = "doc-123-456";
  const testUserId = "user-123-456";
  const testApplicationId = "app-123-456";
  const testDocumentS3Path = "s3/path/to/document.pdf";

  const mockDocument: PrismaDocument = {
    name: "Test Document",
    id: testDocumentId,
    description: "Test document description",
    s3Path: testDocumentS3Path,
    ownerUserId: "user-123",
    documentTypeId: "State Application",
    applicationId: testApplicationId,
    phaseId: "Concept",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-02T00:00:00.000Z"),
    deliverableId: null,
    deliverableTypeId: null,
    deliverableIsCmsAttachedFile: null,
    deliverableSubmissionActionId: null,
    deliverableSubmissionActionTypeId: null,
  };

  const mockApplication = {
    id: testApplicationId,
    demonstrationId: "demo-123",
  };

  const mockS3Adapter = {
    uploadDocument: vi.fn(),
    getPresignedDownloadUrl: vi.fn(),
    moveDocumentFromCleanToDeleted: vi.fn(),
  };

  const mockContext: GraphQLContext = {
    user: {
      id: testUserId,
    },
  } as GraphQLContext;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(getS3Adapter).mockReturnValue(mockS3Adapter as any);
  });

  describe("Query.document", () => {
    it("delegates to `documentData.getDocument`", async () => {
      await documentResolvers.Query.document(undefined, { id: "abc123" }, mockContext);
      expect(getDocument).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, { id: testUserId });
    });
  });

  describe("Query.documentExists", () => {
    it("returns true when getDocument returns", async () => {
      vi.mocked(getDocument).mockResolvedValue({ id: "abc123" } as PrismaDocument);
      const result = await documentResolvers.Query.documentExists(
        undefined,
        { documentId: "abc123" },
        mockContext
      );
      expect(getDocument).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, { id: testUserId });
      expect(result).toBe(true);
    });

    it("returns false when getDocument throws", async () => {
      vi.mocked(getDocument).mockRejectedValue(new Error());
      const result = await documentResolvers.Query.documentExists(
        undefined,
        { documentId: "abc123" },
        mockContext
      );
      expect(getDocument).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, { id: testUserId });
      expect(result).toBe(false);
    });
  });

  describe("Document.documentType", () => {
    it("returns documentTypeId", () => {
      const document = {
        documentTypeId: "Approval Letter" satisfies DocumentType,
      } as PrismaDocument;

      const result = documentResolvers.Document.documentType(document);
      expect(result).toBe(document.documentTypeId);
    });
  });
  describe("Document.presignedDownloadUrl", () => {
    it("delegates to s3adapter.getPresignedDownloadUrl", async () => {
      const document = {
        s3Path: "s3/path/to/document.pdf",
        name: "My Document.pdf",
      } as PrismaDocument;

      await documentResolvers.Document.presignedDownloadUrl(document);
      expect(mockS3Adapter.getPresignedDownloadUrl).toHaveBeenCalledExactlyOnceWith(
        document.s3Path,
        document.name
      );
    });
  });

  describe("Document.isPartOfDeliverableSubmission", () => {
    it("returns true when deliverableSubmissionActionId is not null", () => {
      const document = {
        deliverableSubmissionActionId: "action-123",
      } as PrismaDocument;

      const result = documentResolvers.Document.isPartOfDeliverableSubmission(document);
      expect(result).toBe(true);
    });

    it("returns false when deliverableSubmissionActionId is null", () => {
      const document = {
        deliverableSubmissionActionId: null,
      } as PrismaDocument;

      const result = documentResolvers.Document.isPartOfDeliverableSubmission(document);
      expect(result).toBe(false);
    });
  });
  describe("Document.phaseName", () => {
    it("returns phaseId", () => {
      const document = {
        phaseId: "Approval Summary" satisfies PhaseName,
      } as PrismaDocument;

      const result = documentResolvers.Document.phaseName(document);
      expect(result).toBe(document.phaseId);
    });
  });

  describe("Document.owner", () => {
    it("delegates to userData/queries.selectUserOrThrow", () => {
      documentResolvers.Document.owner(mockDocument);
      expect(selectUserOrThrow).toHaveBeenCalledExactlyOnceWith({ id: mockDocument.ownerUserId });
    });
  });

  describe("triggerUiPath", () => {
    it("enqueues UiPath using only documentId", async () => {
      vi.mocked(getDocument).mockResolvedValue({ id: testDocumentId } as PrismaDocument);
      vi.mocked(enqueueUiPath).mockResolvedValue("msg-123");
      const result = await triggerUiPath(undefined, { documentId: testDocumentId }, mockContext);

      expect(getDocument).toHaveBeenCalledExactlyOnceWith({ id: testDocumentId }, mockContext.user);
      expect(enqueueUiPath).toHaveBeenCalledExactlyOnceWith({
        documentId: testDocumentId,
      });
      expect(result).toBe("msg-123");
    });

    it("passes the provided documentId through to the queue", async () => {
      vi.mocked(getDocument).mockResolvedValue({ id: testDocumentId } as PrismaDocument);
      vi.mocked(enqueueUiPath).mockResolvedValue("msg-456");

      const result = await triggerUiPath(undefined, { documentId: testDocumentId }, mockContext);

      expect(getDocument).toHaveBeenCalledExactlyOnceWith({ id: testDocumentId }, mockContext.user);
      expect(enqueueUiPath).toHaveBeenCalledExactlyOnceWith({
        documentId: testDocumentId,
      });
      expect(result).toBe("msg-456");
    });

    it("throws when enqueuing fails", async () => {
      vi.mocked(getDocument).mockResolvedValue({ id: "abc123" } as PrismaDocument);
      vi.mocked(enqueueUiPath).mockRejectedValue(new Error("Queue send failed"));

      await expect(
        triggerUiPath(undefined, { documentId: testDocumentId }, mockContext)
      ).rejects.toThrow("Queue send failed");
    });
  });

  describe("Mutation.updateDocument", () => {
    it("should update document metadata under a transaction", async () => {
      const mockUpdateInput: UpdateDocumentInput = {
        name: "Updated Document",
        description: "Updated description",
      };
      vi.mocked(editDocument).mockResolvedValue(mockDocument);
      const updatedDocument = await documentResolvers.Mutation.updateDocument(
        undefined,
        {
          id: testDocumentId,
          input: mockUpdateInput,
        },
        mockContext
      );
      expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
        ["name", "description"],
        mockUpdateInput
      );
      expect(editDocument).toHaveBeenCalledExactlyOnceWith(
        { id: testDocumentId },
        {
          name: "Updated Document",
          description: "Updated description",
        },
        mockContext.user
      );
      expect(updatedDocument).toEqual(mockDocument);
    });
  });

  describe("Mutation.deleteDocument", () => {
    it("should delete the document under a transaction", () => {
      documentResolvers.Mutation.deleteDocument(undefined, { id: testDocumentId }, mockContext);
      expect(removeDocument).toHaveBeenCalledExactlyOnceWith(
        { id: testDocumentId },
        mockContext.user,
        mockTransaction
      );
    });
  });

  describe("Mutation.deleteDocuments", () => {
    it("should delete multiple documents in a transaction and return count", async () => {
      const documentIds = ["doc-1", "doc-2", "doc-3"];
      vi.mocked(removeDocument).mockResolvedValue(mockDocument);

      const result = await documentResolvers.Mutation.deleteDocuments(
        undefined,
        { ids: documentIds },
        mockContext
      );

      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(removeDocument).toHaveBeenCalledTimes(documentIds.length);
      for (const documentId of documentIds) {
        expect(removeDocument).toHaveBeenCalledWith(
          { id: documentId },
          mockContext.user,
          mockTransaction
        );
      }
      expect(result).toBe(documentIds.length);
    });

    it("should return 0 if no document ids are provided", async () => {
      const result = await documentResolvers.Mutation.deleteDocuments(
        undefined,
        { ids: [] },
        mockContext
      );

      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(removeDocument).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe("document.application", () => {
    it("should defer to Application.getApplication", async () => {
      vi.mocked(getApplication).mockResolvedValue(mockApplication as any);

      const result = await documentResolvers.Document.application(mockDocument);

      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
      expect(result).toEqual(mockApplication);
    });
  });

  describe("resolveHasPendingUIPathResult", () => {
    it("should return false when pending UiPath result exists", async () => {
      vi.mocked(mockPrismaClient.uiPathResult.findFirst).mockResolvedValue(null);

      const result = await resolveHasPendingUIPathResult(mockDocument);
      expect(result).toBe(false);
    });

    it("should return true when pending UiPath result exists", async () => {
      vi.mocked(mockPrismaClient.uiPathResult.findFirst).mockResolvedValue({
        id: "some-id",
      } as any);

      const result = await resolveHasPendingUIPathResult(mockDocument);

      expect(mockPrismaClient.uiPathResult.findFirst).toHaveBeenCalledOnce();
      expect(result).toBe(true);
    });

    it("should throw when an error is occurred during DB processing", async () => {
      vi.mocked(mockPrismaClient.uiPathResult.findFirst).mockRejectedValue(new Error("DB error"));

      await expect(resolveHasPendingUIPathResult(mockDocument)).rejects.toThrow("DB error");
    });
  });

  describe("resolveBudgetNeutralityValidation", () => {
    it("returns null when no budget_neutrality_workbook row exists for the document", async () => {
      vi.mocked(mockPrismaClient.budgetNeutralityWorkbook.findUnique).mockResolvedValue(null);

      const result = await resolveBudgetNeutralityValidation(mockDocument);

      expect(mockPrismaClient.budgetNeutralityWorkbook.findUnique).toHaveBeenCalledExactlyOnceWith({
        where: { id: testDocumentId },
        select: { validationStatusId: true, validationData: true },
      });
      expect(result).toBeNull();
    });

    it("returns the mapped result with an empty errors array when validation succeeded", async () => {
      vi.mocked(mockPrismaClient.budgetNeutralityWorkbook.findUnique).mockResolvedValue({
        validationStatusId: "Succeeded",
        validationData: [],
      } as any);

      const result = await resolveBudgetNeutralityValidation(mockDocument);

      expect(result).toEqual({ status: "Succeeded", errors: [] });
    });

    it("returns the mapped result with the errors array when validation failed", async () => {
      const errors = [
        { code: "RULE_1", message: "Cell A1 must not be empty." },
        { code: "RULE_2", message: "Total does not match sum of rows." },
      ];
      vi.mocked(mockPrismaClient.budgetNeutralityWorkbook.findUnique).mockResolvedValue({
        validationStatusId: "Failed",
        validationData: errors,
      } as any);

      const result = await resolveBudgetNeutralityValidation(mockDocument);

      expect(result).toEqual({ status: "Failed", errors });
    });

    it("throws when the database query fails", async () => {
      vi.mocked(mockPrismaClient.budgetNeutralityWorkbook.findUnique).mockRejectedValue(
        new Error("DB error")
      );

      await expect(resolveBudgetNeutralityValidation(mockDocument)).rejects.toThrow("DB error");
    });
  });

  describe("resolver exports", () => {
    it("should export Mutation resolvers", () => {
      expect(documentResolvers.Mutation).toHaveProperty("updateDocument");
      expect(documentResolvers.Mutation).toHaveProperty("deleteDocument");
      expect(documentResolvers.Mutation).toHaveProperty("deleteDocuments");
      expect(documentResolvers.Mutation).toHaveProperty("triggerUiPath");
    });

    it("should export Document field resolvers", () => {
      expect(documentResolvers.Document).toHaveProperty("owner");
      expect(documentResolvers.Document).toHaveProperty("application");
      expect(documentResolvers.Document).toHaveProperty("budgetNeutralityValidation");
    });
  });
});
