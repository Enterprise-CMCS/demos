import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";
import { Document as PrismaDocument, User as PrismaUser } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import {
  UpdateDocumentInput,
  UploadDocumentInput,
  ApplicationDateInput,
  DocumentType,
  PhaseName,
} from "../../types";
import { prisma } from "../../prismaClient";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { getS3Adapter } from "../../adapters";
import { EasternNow, getEasternNow } from "../../dateUtilities";
import { getUser } from "../user";
import { getApplication } from "../application";
import { validateAndUpdateDates } from "../applicationDate";
import { startPhaseByDocument } from "../applicationPhase";
import { enqueueUiPath } from "../../services/uipathQueue";
import { updateDocument, handleDeleteDocument } from ".";
import {
  uploadDocument,
  triggerUiPath,
  updateDocument as updateDocumentResolver,
  deleteDocument,
  deleteDocuments,
  resolveApplication,
  documentResolvers,
  resolveHasPendingUIPathResult,
} from "./documentResolvers";
import { getDocument } from "./documentData";

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

vi.mock("../user", () => ({
  getUser: vi.fn(),
}));

vi.mock(".", () => ({
  updateDocument: vi.fn(),
  handleDeleteDocument: vi.fn(),
}));

describe("documentResolvers", () => {
  const mockTransaction = "mockTransaction" as any;
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
    uiPathResult: {
      findFirst: vi.fn(),
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

  const mockUser: PrismaUser = {
    id: testUserId,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    personTypeId: "demos-cms-user",
    cognitoSubject: "cognito-subject-123",
    username: "testuser",
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
    it("returns true when getDocument returns non-null", async () => {
      vi.mocked(getDocument).mockResolvedValue({ id: "abc123" } as PrismaDocument);
      const result = await documentResolvers.Query.documentExists(
        undefined,
        { documentId: "abc123" },
        mockContext
      );
      expect(getDocument).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, { id: testUserId });
      expect(result).toBe(true);
    });

    it("returns false when getDocument returns null", async () => {
      vi.mocked(getDocument).mockResolvedValue(null);
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
      } as PrismaDocument;

      await documentResolvers.Document.presignedDownloadUrl(document);
      expect(mockS3Adapter.getPresignedDownloadUrl).toHaveBeenCalledExactlyOnceWith(
        document.s3Path
      );
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
    it("delegates to userData.getUser", () => {
      documentResolvers.Document.owner(mockDocument, undefined, mockContext);
      expect(getUser).toHaveBeenCalledExactlyOnceWith(
        { id: mockDocument.ownerUserId },
        mockContext.user
      );
    });
  });

  describe("uploadDocument", () => {
    const mockUploadInput: UploadDocumentInput = {
      name: "test.pdf",
      description: "Test upload document",
      documentType: "State Application",
      applicationId: testApplicationId,
      phaseName: "Concept",
    };

    const mockUploadResponse = {
      document: mockDocument,
      uploadUrl: "https://s3.amazonaws.com/upload-url",
    };

    const mockEasternNow: EasternNow = {
      "Current Time": {
        easternTZDate: new TZDate("2025-01-15T12:34:56.789Z"),
        isEasternTZDate: true,
      },
      "End of Day": {
        easternTZDate: new TZDate("2025-01-15T23:59:59.999Z"),
        isEasternTZDate: true,
      },
      "Start of Day": {
        easternTZDate: new TZDate("2025-01-15T00:00:00.000Z"),
        isEasternTZDate: true,
      },
    };

    const mockPhaseStartDate: ApplicationDateInput = {
      dateType: "Application Intake Completion Date",
      dateValue: new TZDate("2025-01-20"),
    };

    it("should upload document with user context", async () => {
      vi.mocked(mockS3Adapter.uploadDocument).mockResolvedValue(mockUploadResponse);

      const result = await uploadDocument(undefined, { input: mockUploadInput }, mockContext);

      expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
        ["name", "documentType", "applicationId", "phaseName", "deliverableId"],
        mockUploadInput
      );

      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(mockS3Adapter.uploadDocument).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        mockUploadInput,
        testUserId
      );
      expect(result).toEqual(mockUploadResponse);
    });

    it("should call startPhaseByDocument with correct parameters", async () => {
      vi.mocked(mockS3Adapter.uploadDocument).mockResolvedValue(mockUploadResponse);
      vi.mocked(getEasternNow).mockReturnValue(mockEasternNow);
      vi.mocked(startPhaseByDocument).mockResolvedValue(null);

      await uploadDocument(undefined, { input: mockUploadInput }, mockContext);

      expect(getEasternNow).toHaveBeenCalledOnce();
      expect(startPhaseByDocument).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        testApplicationId,
        mockUploadInput,
        mockEasternNow
      );
    });

    it("should call validateAndUpdateDates when phase start date is returned", async () => {
      vi.mocked(mockS3Adapter.uploadDocument).mockResolvedValue(mockUploadResponse);
      vi.mocked(getEasternNow).mockReturnValue(mockEasternNow);
      vi.mocked(startPhaseByDocument).mockResolvedValue(mockPhaseStartDate);
      vi.mocked(validateAndUpdateDates).mockResolvedValue(undefined);

      await uploadDocument(undefined, { input: mockUploadInput }, mockContext);

      expect(validateAndUpdateDates).toHaveBeenCalledExactlyOnceWith(
        {
          applicationId: testApplicationId,
          applicationDates: [mockPhaseStartDate],
        },
        mockTransaction
      );
    });

    it("should not call validateAndUpdateDates when phase start date is null", async () => {
      vi.mocked(mockS3Adapter.uploadDocument).mockResolvedValue(mockUploadResponse);
      vi.mocked(getEasternNow).mockReturnValue(mockEasternNow);
      vi.mocked(startPhaseByDocument).mockResolvedValue(null);

      await uploadDocument(undefined, { input: mockUploadInput }, mockContext);

      expect(validateAndUpdateDates).not.toHaveBeenCalled();
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

    it("throws when document does not exist", async () => {
      vi.mocked(getDocument).mockResolvedValue(null);

      await expect(triggerUiPath(undefined, { documentId: "abc123" }, mockContext)).rejects.toThrow(
        `Document with ID abc123 does not exist.`
      );
      expect(getDocument).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, mockContext.user);
      expect(enqueueUiPath).not.toHaveBeenCalled();
    });
  });

  describe("updateDocument", () => {
    const mockUpdateInput: UpdateDocumentInput = {
      name: "Updated Document",
      description: "Updated description",
      documentType: "State Application",
      applicationId: testApplicationId,
      phaseName: "Concept",
    };

    it("should update document metadata", async () => {
      vi.mocked(updateDocument).mockResolvedValue(mockDocument);

      const result = await updateDocumentResolver(undefined, {
        id: testDocumentId,
        input: mockUpdateInput,
      });

      expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
        ["name", "documentType", "applicationId", "phaseName", "deliverableId"],
        mockUpdateInput
      );
      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(updateDocument).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        testDocumentId,
        mockUpdateInput
      );
      expect(result).toEqual(mockDocument);
    });
  });

  describe("deleteDocument", () => {
    it("should delete document and move to deleted bucket", async () => {
      vi.mocked(handleDeleteDocument).mockResolvedValue(mockDocument);

      const result = await deleteDocument(undefined, { id: testDocumentId });

      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(handleDeleteDocument).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        mockS3Adapter,
        testDocumentId
      );
      expect(result).toEqual(mockDocument);
    });
  });

  describe("deleteDocuments", () => {
    const testDocumentIds = ["doc-1", "doc-2", "doc-3"];

    it("should delete multiple documents and return count", async () => {
      vi.mocked(handleDeleteDocument).mockResolvedValue(mockDocument);
      const result = await deleteDocuments(undefined, { ids: testDocumentIds });

      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(handleDeleteDocument).toHaveBeenCalledTimes(3);
      expect(handleDeleteDocument).toHaveBeenCalledWith(mockTransaction, mockS3Adapter, "doc-1");
      expect(handleDeleteDocument).toHaveBeenCalledWith(mockTransaction, mockS3Adapter, "doc-2");
      expect(handleDeleteDocument).toHaveBeenCalledWith(mockTransaction, mockS3Adapter, "doc-3");
      expect(result).toBe(3);
    });

    it("should return 0 for empty array", async () => {
      const result = await deleteDocuments(undefined, { ids: [] });

      expect(handleDeleteDocument).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe("resolveApplication", () => {
    it("should resolve application by id", async () => {
      vi.mocked(getApplication).mockResolvedValue(mockApplication as any);

      const result = await resolveApplication(mockDocument);

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

  describe("resolver exports", () => {
    it("should export Mutation resolvers", () => {
      expect(documentResolvers.Mutation).toHaveProperty("uploadDocument");
      expect(documentResolvers.Mutation).toHaveProperty("updateDocument");
      expect(documentResolvers.Mutation).toHaveProperty("deleteDocument");
      expect(documentResolvers.Mutation).toHaveProperty("deleteDocuments");
      expect(documentResolvers.Mutation).toHaveProperty("triggerUiPath");
    });

    it("should export Document field resolvers", () => {
      expect(documentResolvers.Document).toHaveProperty("owner");
      expect(documentResolvers.Document).toHaveProperty("application");
    });
  });
});
