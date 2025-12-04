import { describe, it, expect, vi, beforeEach } from "vitest";
import { documentResolvers } from "./documentResolvers.js";
import { Document as PrismaDocument, User as PrismaUser } from "@prisma/client";
import { DocumentType, PhaseName } from "../../types.js";
import { GraphQLContext } from "../../auth/auth.util.js";

// Mock adapter using vi.hoisted
const { mockS3Adapter } = vi.hoisted(() => ({
  mockS3Adapter: {
    getPresignedDownloadUrl: vi.fn(),
    moveDocumentFromCleanToDeleted: vi.fn(),
    uploadDocument: vi.fn(),
  },
}));

// Mock imports
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../adapters/s3/S3Adapter.js", () => ({
  createS3Adapter: () => mockS3Adapter,
}));

vi.mock("../user/userResolvers.js", () => ({
  getUser: vi.fn(),
}));

vi.mock("../application/applicationResolvers.js", () => ({
  getApplication: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../../errors/checkOptionalNotNullFields.js", () => ({
  checkOptionalNotNullFields: vi.fn(),
}));

// Import after mocks
import { prisma } from "../../prismaClient.js";
import { getUser } from "../user/userResolvers.js";
import { getApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { DOCUMENT_TYPES } from "../../constants.js";

describe("documentResolvers", () => {
  type TestValues = {
    documentId: string;
    userId: string;
    applicationId: string;
    documentName: string;
    documentDescription: string;
    documentTypeId: DocumentType;
    phaseId: PhaseName;
    s3Path: string;
  };

  const testValues: TestValues = {
    documentId: "doc-123-456",
    userId: "user-789-012",
    applicationId: "app-345-678",
    documentName: "Test Document.pdf",
    documentDescription: "A test document",
    documentTypeId: "Approval Letter",
    phaseId: "Application Intake",
    s3Path: "s3://bucket/app-345-678/doc-123-456",
  };

  const mockDocument: PrismaDocument = {
    id: testValues.documentId,
    name: testValues.documentName,
    description: testValues.documentDescription,
    ownerUserId: testValues.userId,
    documentTypeId: testValues.documentTypeId,
    applicationId: testValues.applicationId,
    phaseId: testValues.phaseId,
    s3Path: testValues.s3Path,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  };

  const mockUser: PrismaUser = {
    id: testValues.userId,
    username: "testuser",
    cognitoSubject: "cognito-123",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    personTypeId: "demos-cms-user",
  };

  const mockApplication = {
    id: testValues.applicationId,
    applicationTypeId: "Demonstration",
  };

  const mockContext: GraphQLContext = {
    user: {
      id: testValues.userId,
      role: "mock-role",
      sub: "cognito-123",
    },
  } as GraphQLContext;

  const mockPrismaClient = {
    document: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  describe("Query resolvers", () => {
    describe("document", () => {
      it("should return document when found", async () => {
        mockPrismaClient.document.findUniqueOrThrow.mockResolvedValueOnce(mockDocument);

        const result = await documentResolvers.Query.document(undefined, {
          id: testValues.documentId,
        });

        expect(mockPrismaClient.document.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith({
          where: { id: testValues.documentId },
        });
        expect(result).toEqual(mockDocument);
      });

      it("should handle document not found error", async () => {
        const testError = new Error("Document not found");
        mockPrismaClient.document.findUniqueOrThrow.mockRejectedValueOnce(testError);

        await expect(
          documentResolvers.Query.document(undefined, { id: "non-existent-id" })
        ).rejects.toThrowError(testHandlePrismaError);

        expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
      });
    });

    describe("documentExists", () => {
      it("should return true when document exists", async () => {
        mockPrismaClient.document.findUnique.mockResolvedValueOnce(mockDocument);

        const result = await documentResolvers.Query.documentExists(undefined, {
          documentId: testValues.documentId,
        });

        expect(mockPrismaClient.document.findUnique).toHaveBeenCalledExactlyOnceWith({
          where: { id: testValues.documentId },
        });
        expect(result).toBe(true);
      });

      it("should return false when document does not exist", async () => {
        mockPrismaClient.document.findUnique.mockResolvedValueOnce(null);

        const result = await documentResolvers.Query.documentExists(undefined, {
          documentId: "non-existent-id",
        });

        expect(result).toBe(false);
      });
    });
  });

  describe("Mutation resolvers", () => {
    describe("uploadDocument", () => {
      it("should upload document and return presigned URL", async () => {
        const mockInput = {
          name: testValues.documentName,
          description: testValues.documentDescription,
          documentType: testValues.documentTypeId,
          applicationId: testValues.applicationId,
          phaseName: testValues.phaseId,
        };
        const mockResponse = {
          presignedURL: "https://presigned-url.com",
          documentId: testValues.documentId,
        };

        mockS3Adapter.uploadDocument.mockResolvedValueOnce(mockResponse);

        const result = await documentResolvers.Mutation.uploadDocument(
          undefined,
          { input: mockInput },
          mockContext
        );

        expect(mockS3Adapter.uploadDocument).toHaveBeenCalledExactlyOnceWith(
          { input: mockInput },
          testValues.userId
        );
        expect(result).toEqual(mockResponse);
      });

      it("should throw error when user is not authenticated", async () => {
        const contextWithoutUser: GraphQLContext = {
          user: null,
        } as GraphQLContext;

        await expect(
          documentResolvers.Mutation.uploadDocument(
            undefined,
            { input: {} as any },
            contextWithoutUser
          )
        ).rejects.toThrowError(
          "The GraphQL context does not have user information. Are you properly authenticated?"
        );

        expect(mockS3Adapter.uploadDocument).not.toHaveBeenCalled();
      });
    });

    describe("downloadDocument", () => {
      it("should return presigned download URL", async () => {
        const mockUrl = "https://download-url.com";
        mockPrismaClient.document.findUniqueOrThrow.mockResolvedValueOnce(mockDocument);
        mockS3Adapter.getPresignedDownloadUrl.mockResolvedValueOnce(mockUrl);

        const result = await documentResolvers.Mutation.downloadDocument(undefined, {
          id: testValues.documentId,
        });

        expect(mockPrismaClient.document.findUniqueOrThrow).toHaveBeenCalledWith({
          where: { id: testValues.documentId },
        });
        expect(mockS3Adapter.getPresignedDownloadUrl).toHaveBeenCalledWith(
          testValues.documentId
        );
        expect(result).toBe(mockUrl);
      });

      it("should handle document not found error", async () => {
        const testError = new Error("Document not found");
        mockPrismaClient.document.findUniqueOrThrow.mockRejectedValueOnce(testError);

        await expect(
          documentResolvers.Mutation.downloadDocument(undefined, { id: "non-existent-id" })
        ).rejects.toThrowError(testHandlePrismaError);

        expect(handlePrismaError).toHaveBeenCalledWith(testError);
      });
    });

    describe("updateDocument", () => {
      it("should update document with all fields", async () => {
        const mockInput = {
          name: "Updated Document.pdf",
          description: "Updated description",
          documentType: "Extension" as DocumentType,
          applicationId: testValues.applicationId,
          phaseName: "Completeness" as PhaseName,
        };
        const updatedDocument = { ...mockDocument, ...mockInput };

        mockPrismaClient.document.update.mockResolvedValueOnce(updatedDocument);

        const result = await documentResolvers.Mutation.updateDocument(undefined, {
          id: testValues.documentId,
          input: mockInput,
        });

        expect(checkOptionalNotNullFields).toHaveBeenCalledWith(
          ["name", "documentType", "applicationId", "phaseName"],
          mockInput
        );
        expect(mockPrismaClient.document.update).toHaveBeenCalledWith({
          where: { id: testValues.documentId },
          data: {
            name: mockInput.name,
            description: mockInput.description,
            documentTypeId: mockInput.documentType,
            applicationId: mockInput.applicationId,
            phaseId: mockInput.phaseName,
          },
        });
        expect(result).toEqual(updatedDocument);
      });

      it("should handle update errors", async () => {
        const mockInput = { name: "Updated.pdf" };
        const testError = new Error("Update failed");
        mockPrismaClient.document.update.mockRejectedValueOnce(testError);

        await expect(
          documentResolvers.Mutation.updateDocument(undefined, {
            id: testValues.documentId,
            input: mockInput,
          })
        ).rejects.toThrowError(testHandlePrismaError);

        expect(handlePrismaError).toHaveBeenCalledWith(testError);
      });
    });

    describe("deleteDocument", () => {
      it("should delete document and move it in S3", async () => {
        mockPrismaClient.$transaction.mockImplementation(async (callback) => {
          const mockTx = {
            document: {
              delete: vi.fn().mockResolvedValue(mockDocument),
            },
          };
          return callback(mockTx);
        });
        mockS3Adapter.moveDocumentFromCleanToDeleted.mockResolvedValueOnce(undefined);

        const result = await documentResolvers.Mutation.deleteDocument(undefined, {
          id: testValues.documentId,
        });

        expect(mockS3Adapter.moveDocumentFromCleanToDeleted).toHaveBeenCalledWith(
          `${testValues.applicationId}/${testValues.documentId}`
        );
        expect(result).toEqual(mockDocument);
      });

      it("should handle delete errors", async () => {
        const testError = new Error("Delete failed");
        mockPrismaClient.$transaction.mockRejectedValueOnce(testError);

        await expect(
          documentResolvers.Mutation.deleteDocument(undefined, { id: testValues.documentId })
        ).rejects.toThrowError(testHandlePrismaError);

        expect(handlePrismaError).toHaveBeenCalledWith(testError);
      });
    });

    describe("deleteDocuments", () => {
      it("should delete multiple documents and move them in S3", async () => {
        const ids = [testValues.documentId, "doc-999-888"];
        const documents = [mockDocument, { ...mockDocument, id: "doc-999-888" }];

        mockPrismaClient.$transaction.mockImplementation(async (callback) => {
          const mockTx = {
            document: {
              findMany: vi.fn().mockResolvedValue(documents),
              deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
            },
          };
          return callback(mockTx);
        });
        mockS3Adapter.moveDocumentFromCleanToDeleted.mockResolvedValue(undefined);

        const result = await documentResolvers.Mutation.deleteDocuments(undefined, { ids });

        expect(mockS3Adapter.moveDocumentFromCleanToDeleted).toHaveBeenCalledTimes(2);
        expect(result).toBe(2);
      });

      it("should return zero when no documents found", async () => {
        mockPrismaClient.$transaction.mockImplementation(async (callback) => {
          const mockTx = {
            document: {
              findMany: vi.fn().mockResolvedValue([]),
              deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            },
          };
          return callback(mockTx);
        });

        const result = await documentResolvers.Mutation.deleteDocuments(undefined, {
          ids: ["non-existent"],
        });

        expect(mockS3Adapter.moveDocumentFromCleanToDeleted).not.toHaveBeenCalled();
        expect(result).toBe(0);
      });
    });
  });

  describe("Document field resolvers", () => {
    describe("owner", () => {
      it("should return user for document owner", async () => {
        vi.mocked(getUser).mockResolvedValueOnce(mockUser);

        const result = await documentResolvers.Document.owner(mockDocument);

        expect(getUser).toHaveBeenCalledExactlyOnceWith(testValues.userId);
        expect(result).toEqual(mockUser);
      });
    });

    describe("documentType", () => {
      it("should return documentTypeId as DocumentType", () => {
        const result = documentResolvers.Document.documentType(mockDocument);

        expect(result).toBe(testValues.documentTypeId);
      });
    });

    describe("application", () => {
      it("should return application for document", async () => {
        vi.mocked(getApplication).mockResolvedValueOnce(mockApplication as any);

        const result = await documentResolvers.Document.application(mockDocument);

        expect(getApplication).toHaveBeenCalledExactlyOnceWith(testValues.applicationId);
        expect(result).toEqual(mockApplication);
      });
    });

    describe("phaseName", () => {
      it("should return phaseId as PhaseName", () => {
        const result = documentResolvers.Document.phaseName(mockDocument);

        expect(result).toBe(testValues.phaseId);
      });
    });
  });

  describe("Resolver structure", () => {
    it("should have all Query resolvers", () => {
      expect(documentResolvers.Query).toHaveProperty("document");
      expect(documentResolvers.Query).toHaveProperty("documentExists");
    });

    it("should have all Mutation resolvers", () => {
      expect(documentResolvers.Mutation).toHaveProperty("uploadDocument");
      expect(documentResolvers.Mutation).toHaveProperty("downloadDocument");
      expect(documentResolvers.Mutation).toHaveProperty("updateDocument");
      expect(documentResolvers.Mutation).toHaveProperty("deleteDocument");
      expect(documentResolvers.Mutation).toHaveProperty("deleteDocuments");
    });

    it("should have all Document field resolvers", () => {
      expect(documentResolvers.Document).toHaveProperty("owner");
      expect(documentResolvers.Document).toHaveProperty("documentType");
      expect(documentResolvers.Document).toHaveProperty("application");
      expect(documentResolvers.Document).toHaveProperty("phaseName");
    });
  });
});
