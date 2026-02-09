import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";
import { Document as PrismaDocument, User as PrismaUser } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util.js";
import { UpdateDocumentInput, UploadDocumentInput, ApplicationDateInput } from "../../types";
import { prisma } from "../../prismaClient.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { getS3Adapter } from "../../adapters";
import { EasternNow, getEasternNow } from "../../dateUtilities";
import { findUserById } from "../user";
import { getApplication } from "../application";
import { validateAndUpdateDates } from "../applicationDate";
import { startPhaseByDocument } from "../applicationPhase";
import { getDocumentById, checkDocumentExists, updateDocument, handleDeleteDocument } from ".";
import {
  getDocument,
  documentExists,
  uploadDocument,
  updateDocument as updateDocumentResolver,
  deleteDocument,
  deleteDocuments,
  resolveOwner,
  resolveDocumentType,
  resolveApplication,
  resolvePhaseName,
  documentResolvers,
  resolvePresignedDownloadUrl,
} from "./documentResolvers.js";

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

vi.mock("../application", () => ({
  getApplication: vi.fn(),
}));

vi.mock("../../dateUtilities", () => ({
  getEasternNow: vi.fn(),
}));

vi.mock("../applicationPhase", () => ({
  startPhaseByDocument: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  validateAndUpdateDates: vi.fn(),
}));

vi.mock("../user", () => ({
  findUserById: vi.fn(),
}));

vi.mock(".", () => ({
  getDocumentById: vi.fn(),
  checkDocumentExists: vi.fn(),
  updateDocument: vi.fn(),
  handleDeleteDocument: vi.fn(),
}));

describe("documentResolvers", () => {
  const mockTransaction = "mockTransaction" as any;
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  const testDocumentId = "doc-123-456";
  const testUserId = "user-123-456";
  const testApplicationId = "app-123-456";

  const mockDocument: PrismaDocument = {
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

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(getS3Adapter).mockReturnValue(mockS3Adapter as any);
  });

  describe("getDocument", () => {
    it("should get document by id", async () => {
      vi.mocked(getDocumentById).mockResolvedValue(mockDocument);

      const result = await getDocument(undefined, { id: testDocumentId });

      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(getDocumentById).toHaveBeenCalledExactlyOnceWith(mockTransaction, testDocumentId);
      expect(result).toEqual(mockDocument);
    });
  });

  describe("documentExists", () => {
    it("should check if document exists", async () => {
      vi.mocked(checkDocumentExists).mockResolvedValue(true);

      const result = await documentExists(undefined, { documentId: testDocumentId });

      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(checkDocumentExists).toHaveBeenCalledExactlyOnceWith(mockTransaction, testDocumentId);
      expect(result).toBe(true);
    });

    it("should return false when document does not exist", async () => {
      vi.mocked(checkDocumentExists).mockResolvedValue(false);

      const result = await documentExists(undefined, { documentId: testDocumentId });

      expect(result).toBe(false);
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

    const mockContext: GraphQLContext = {
      user: {
        id: testUserId,
        sub: "1234-1234-1234-1234-1234",
        role: "demos-cms-user",
      },
    };

    const mockUploadResponse = {
      document: mockDocument,
      uploadUrl: "https://s3.amazonaws.com/upload-url",
    };

    const mockEasternNow: EasternNow = {
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

      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(mockS3Adapter.uploadDocument).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        mockUploadInput,
        testUserId
      );
      expect(result).toEqual(mockUploadResponse);
    });

    it("should throw error when user is not authenticated", async () => {
      const contextWithoutUser: GraphQLContext = {
        user: null,
      };

      await expect(
        uploadDocument(undefined, { input: mockUploadInput }, contextWithoutUser)
      ).rejects.toThrow(
        "The GraphQL context does not have user information. Are you properly authenticated?"
      );

      expect(mockS3Adapter.uploadDocument).not.toHaveBeenCalled();
      expect(mockPrismaClient.$transaction).not.toHaveBeenCalled();
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

  describe("resolvePresignedDownloadUrl", () => {
    const mockPresignedUrl = "https://s3.amazonaws.com/download-url";

    it("should generate presigned download URL", async () => {
      vi.mocked(getDocumentById).mockResolvedValue(mockDocument);
      vi.mocked(mockS3Adapter.getPresignedDownloadUrl).mockResolvedValue(mockPresignedUrl);

      const result = await resolvePresignedDownloadUrl({ id: testDocumentId });

      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(mockS3Adapter.getPresignedDownloadUrl).toHaveBeenCalledExactlyOnceWith(testDocumentId);
      expect(result).toBe(mockPresignedUrl);
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
        ["name", "documentType", "applicationId", "phaseName"],
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

  describe("resolveOwner", () => {
    it("should resolve document owner", async () => {
      vi.mocked(findUserById).mockResolvedValue(mockUser);

      const result = await resolveOwner(mockDocument);

      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(findUserById).toHaveBeenCalledExactlyOnceWith(mockTransaction, "user-123");
      expect(result).toEqual(mockUser);
    });
  });

  describe("resolveDocumentType", () => {
    it("should resolve document type from documentTypeId", () => {
      const result = resolveDocumentType(mockDocument);

      expect(result).toBe("State Application");
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

  describe("resolvePhaseName", () => {
    it("should resolve phase name from phaseId", () => {
      const result = resolvePhaseName(mockDocument);

      expect(result).toBe("Concept");
    });
  });

  describe("resolver exports", () => {
    it("should export Query resolvers", () => {
      expect(documentResolvers.Query).toHaveProperty("document");
      expect(documentResolvers.Query).toHaveProperty("documentExists");
    });

    it("should export Mutation resolvers", () => {
      expect(documentResolvers.Mutation).toHaveProperty("uploadDocument");
      expect(documentResolvers.Mutation).toHaveProperty("updateDocument");
      expect(documentResolvers.Mutation).toHaveProperty("deleteDocument");
      expect(documentResolvers.Mutation).toHaveProperty("deleteDocuments");
    });

    it("should export Document field resolvers", () => {
      expect(documentResolvers.Document).toHaveProperty("owner");
      expect(documentResolvers.Document).toHaveProperty("documentType");
      expect(documentResolvers.Document).toHaveProperty("application");
      expect(documentResolvers.Document).toHaveProperty("phaseName");
      expect(documentResolvers.Document).toHaveProperty("presignedDownloadUrl");
    });
  });
});
