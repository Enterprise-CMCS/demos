import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GraphQLError } from "graphql";
import { Document, DocumentPendingUpload, Bundle } from "@prisma/client";

// Mock dependencies
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(() => ({
    document: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    documentPendingUpload: {
      create: vi.fn(),
    },
    bundle: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    documentType: {
      findUnique: vi.fn(),
    },
    demonstration: {
      findUnique: vi.fn(),
    },
    modification: {
      findUnique: vi.fn(),
    },
  })),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({})),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock("../../constants.js", () => ({
  BUNDLE_TYPE: {
    DEMONSTRATION: "DEMONSTRATION",
    AMENDMENT: "AMENDMENT",
    EXTENSION: "EXTENSION",
  },
}));

import { prisma } from "../../prismaClient.js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { documentResolvers } from "./documentResolvers";
import { GraphQLContext } from "../../auth/auth.util.js";

describe("documentResolvers", () => {
  const mockPrisma = {
    document: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    documentPendingUpload: {
      create: vi.fn(),
    },
    bundle: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    documentType: {
      findUnique: vi.fn(),
    },
    demonstration: {
      findUnique: vi.fn(),
    },
    modification: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).mockReturnValue(mockPrisma);
    (getSignedUrl as any).mockResolvedValue("https://signed-url.example.com");
  });

  afterEach(() => {
    delete process.env.S3_ENDPOINT_LOCAL;
    delete process.env.UPLOAD_BUCKET;
    delete process.env.CLEAN_BUCKET;
  });

  describe("Query resolvers", () => {
    describe("document", () => {
      it("should return document by id", async () => {
        const mockDocument = {
          id: "doc-1",
          title: "Test Document",
          description: "Test Description",
        };

        mockPrisma.document.findUnique.mockResolvedValue(mockDocument);

        const result = await documentResolvers.Query.document(undefined, { id: "doc-1" });

        expect(mockPrisma.document.findUnique).toHaveBeenCalledWith({
          where: { id: "doc-1" },
        });
        expect(result).toEqual(mockDocument);
      });

      it("should return null when document not found", async () => {
        mockPrisma.document.findUnique.mockResolvedValue(null);

        const result = await documentResolvers.Query.document(undefined, { id: "non-existent" });

        expect(result).toBeNull();
      });
    });

    describe("documents", () => {
      it("should return all documents when no bundleTypeId provided", async () => {
        const mockDocuments = [
          { id: "doc-1", title: "Document 1" },
          { id: "doc-2", title: "Document 2" },
        ];

        mockPrisma.document.findMany.mockResolvedValue(mockDocuments);

        const result = await documentResolvers.Query.documents(undefined, {});

        expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
          where: {
            bundle: {
              bundleType: {
                id: undefined,
              },
            },
          },
        });
        expect(result).toEqual(mockDocuments);
      });

      it("should filter documents by valid bundleTypeId", async () => {
        const mockDocuments = [
          { id: "doc-1", title: "Demonstration Document" },
        ];

        mockPrisma.document.findMany.mockResolvedValue(mockDocuments);

        const result = await documentResolvers.Query.documents(undefined, {
          bundleTypeId: "DEMONSTRATION",
        });

        expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
          where: {
            bundle: {
              bundleType: {
                id: "DEMONSTRATION",
              },
            },
          },
        });
        expect(result).toEqual(mockDocuments);
      });

      it("should throw error for invalid bundleTypeId", async () => {
        await expect(
          documentResolvers.Query.documents(undefined, { bundleTypeId: "INVALID_TYPE" })
        ).rejects.toThrow(GraphQLError);

        await expect(
          documentResolvers.Query.documents(undefined, { bundleTypeId: "INVALID_TYPE" })
        ).rejects.toThrow("The requested bundle type is not valid.");
      });

      it("should accept all valid bundle types", async () => {
        const validTypes = ["DEMONSTRATION", "AMENDMENT", "EXTENSION"];
        mockPrisma.document.findMany.mockResolvedValue([]);

        for (const bundleType of validTypes) {
          await documentResolvers.Query.documents(undefined, { bundleTypeId: bundleType });
          expect(mockPrisma.document.findMany).toHaveBeenLastCalledWith({
            where: {
              bundle: {
                bundleType: {
                  id: bundleType,
                },
              },
            },
          });
        }
      });
    });
  });

  describe("Mutation resolvers", () => {
    describe("uploadDocument", () => {
      const mockContext: GraphQLContext = {
        user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
      };

      const mockInput = {
        title: "Test Document",
        description: "Test Description",
        documentType: "type-1",
        bundleId: "bundle-1",
      };

      it("should create document pending upload and return presigned URL", async () => {
        process.env.UPLOAD_BUCKET = "test-upload-bucket";

        const mockDocumentPendingUpload = {
          id: "pending-1",
          title: "Test Document",
          description: "Test Description",
        };

        mockPrisma.documentPendingUpload.create.mockResolvedValue(mockDocumentPendingUpload);

        const result = await documentResolvers.Mutation.uploadDocument(mockContext, {
          input: mockInput,
        });

        expect(mockPrisma.documentPendingUpload.create).toHaveBeenCalledWith({
          data: {
            title: "Test Document",
            description: "Test Description",
            owner: { connect: { id: "user-1" } },
            documentType: { connect: { id: "type-1" } },
            bundle: { connect: { id: "bundle-1" } },
          },
        });

        expect(PutObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-upload-bucket",
          Key: "pending-1",
        });

        expect(result).toEqual({
          presignedURL: "https://signed-url.example.com",
        });
      });

      it("should configure S3 client for local development", async () => {
        process.env.S3_ENDPOINT_LOCAL = "http://localhost:4566";
        process.env.UPLOAD_BUCKET = "test-upload-bucket";

        const mockDocumentPendingUpload = {
          id: "pending-1",
          title: "Test Document",
        };

        mockPrisma.documentPendingUpload.create.mockResolvedValue(mockDocumentPendingUpload);

        await documentResolvers.Mutation.uploadDocument(mockContext, {
          input: mockInput,
        });

        expect(S3Client).toHaveBeenCalledWith({
          region: "us-east-1",
          endpoint: "http://localhost:4566",
          forcePathStyle: true,
          credentials: {
            accessKeyId: "",
            secretAccessKey: "",
          },
        });
      });

      it("should configure S3 client for production", async () => {
        // No S3_ENDPOINT_LOCAL set
        process.env.UPLOAD_BUCKET = "test-upload-bucket";

        const mockDocumentPendingUpload = {
          id: "pending-1",
          title: "Test Document",
        };

        mockPrisma.documentPendingUpload.create.mockResolvedValue(mockDocumentPendingUpload);

        await documentResolvers.Mutation.uploadDocument(mockContext, {
          input: mockInput,
        });

        expect(S3Client).toHaveBeenCalledWith({});
      });

      it("should handle missing user context", async () => {
        const contextWithoutUser: GraphQLContext = { user: null };

        const mockDocumentPendingUpload = {
          id: "pending-1",
          title: "Test Document",
        };

        mockPrisma.documentPendingUpload.create.mockResolvedValue(mockDocumentPendingUpload);

        await documentResolvers.Mutation.uploadDocument(contextWithoutUser, {
          input: mockInput,
        });

        expect(mockPrisma.documentPendingUpload.create).toHaveBeenCalledWith({
          data: {
            title: "Test Document",
            description: "Test Description",
            owner: { connect: { id: undefined } },
            documentType: { connect: { id: "type-1" } },
            bundle: { connect: { id: "bundle-1" } },
          },
        });
      });
    });

    describe("downloadDocument", () => {
      it("should return presigned download URL for existing document", async () => {
        process.env.CLEAN_BUCKET = "test-clean-bucket";

        const mockDocument = {
          id: "doc-1",
          bundleId: "bundle-1",
          title: "Test Document",
        };

        mockPrisma.document.findUnique.mockResolvedValue(mockDocument);

        const result = await documentResolvers.Mutation.downloadDocument(undefined, {
          id: "doc-1",
        });

        expect(mockPrisma.document.findUnique).toHaveBeenCalledWith({
          where: { id: "doc-1" },
        });

        expect(GetObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-clean-bucket",
          Key: "bundle-1/doc-1",
        });

        expect(result).toBe("https://signed-url.example.com");
      });

      it("should throw error when document not found", async () => {
        mockPrisma.document.findUnique.mockResolvedValue(null);

        await expect(
          documentResolvers.Mutation.downloadDocument(undefined, { id: "non-existent" })
        ).rejects.toThrow(GraphQLError);

        await expect(
          documentResolvers.Mutation.downloadDocument(undefined, { id: "non-existent" })
        ).rejects.toThrow("Document not found.");
      });

      it("should configure S3 client for local development in download", async () => {
        process.env.S3_ENDPOINT_LOCAL = "http://localhost:4566";
        process.env.CLEAN_BUCKET = "test-clean-bucket";

        const mockDocument = {
          id: "doc-1",
          bundleId: "bundle-1",
          title: "Test Document",
        };

        mockPrisma.document.findUnique.mockResolvedValue(mockDocument);

        await documentResolvers.Mutation.downloadDocument(undefined, { id: "doc-1" });

        expect(S3Client).toHaveBeenCalledWith({
          region: "us-east-1",
          endpoint: "http://localhost:4566",
          forcePathStyle: true,
          credentials: {
            accessKeyId: "",
            secretAccessKey: "",
          },
        });
      });
    });

    describe("updateDocument", () => {
      it("should update document with all fields", async () => {
        const mockInput = {
          title: "Updated Title",
          description: "Updated Description",
          documentType: "new-type",
          bundleId: "new-bundle",
        };

        const mockUpdatedDocument = {
          id: "doc-1",
          title: "Updated Title",
          description: "Updated Description",
        };

        mockPrisma.document.update.mockResolvedValue(mockUpdatedDocument);

        const result = await documentResolvers.Mutation.updateDocument(undefined, {
          id: "doc-1",
          input: mockInput,
        });

        expect(mockPrisma.document.update).toHaveBeenCalledWith({
          where: { id: "doc-1" },
          data: {
            title: "Updated Title",
            description: "Updated Description",
            documentType: {
              connect: { id: "new-type" },
            },
            bundle: {
              connect: { id: "new-bundle" },
            },
          },
        });

        expect(result).toEqual(mockUpdatedDocument);
      });

      it("should update document with partial fields", async () => {
        const mockInput = {
          title: "Updated Title",
        };

        const mockUpdatedDocument = {
          id: "doc-1",
          title: "Updated Title",
        };

        mockPrisma.document.update.mockResolvedValue(mockUpdatedDocument);

        const result = await documentResolvers.Mutation.updateDocument(undefined, {
          id: "doc-1",
          input: mockInput,
        });

        expect(mockPrisma.document.update).toHaveBeenCalledWith({
          where: { id: "doc-1" },
          data: {
            title: "Updated Title",
          },
        });

        expect(result).toEqual(mockUpdatedDocument);
      });

      it("should handle undefined documentType and bundleId", async () => {
        const mockInput = {
          title: "Updated Title",
          documentType: undefined,
          bundleId: undefined,
        };

        const mockUpdatedDocument = {
          id: "doc-1",
          title: "Updated Title",
        };

        mockPrisma.document.update.mockResolvedValue(mockUpdatedDocument);

        await documentResolvers.Mutation.updateDocument(undefined, {
          id: "doc-1",
          input: mockInput,
        });

        expect(mockPrisma.document.update).toHaveBeenCalledWith({
          where: { id: "doc-1" },
          data: {
            title: "Updated Title",
          },
        });
      });
    });

    describe("deleteDocuments", () => {
      it("should delete multiple documents and return count", async () => {
        const mockDeleteResult = { count: 2 };
        mockPrisma.document.deleteMany.mockResolvedValue(mockDeleteResult);

        const result = await documentResolvers.Mutation.deleteDocuments(undefined, {
          ids: ["doc-1", "doc-2"],
        });

        expect(mockPrisma.document.deleteMany).toHaveBeenCalledWith({
          where: { id: { in: ["doc-1", "doc-2"] } },
        });

        expect(result).toBe(2);
      });

      it("should handle empty array of ids", async () => {
        const mockDeleteResult = { count: 0 };
        mockPrisma.document.deleteMany.mockResolvedValue(mockDeleteResult);

        const result = await documentResolvers.Mutation.deleteDocuments(undefined, {
          ids: [],
        });

        expect(mockPrisma.document.deleteMany).toHaveBeenCalledWith({
          where: { id: { in: [] } },
        });

        expect(result).toBe(0);
      });
    });
  });

  describe("Document field resolvers", () => {
    const mockDocument: Document = {
      id: "doc-1",
      title: "Test Document",
      description: "Test Description",
      s3Path: "path/to/document",
      ownerUserId: "user-1",
      documentTypeId: "type-1",
      bundleId: "bundle-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe("owner", () => {
      it("should return user with person data", async () => {
        const mockUser = {
          id: "user-1",
          username: "testuser",
          person: {
            id: "person-1",
            fullName: "Test User",
            email: "test@example.com",
          },
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const result = await documentResolvers.Document.owner(mockDocument);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: "user-1" },
          include: { person: true },
        });

        expect(result).toEqual({
          id: "user-1",
          username: "testuser",
          person: {
            id: "person-1",
            fullName: "Test User",
            email: "test@example.com",
          },
          ...mockUser.person,
        });
      });

      it("should handle user without person data", async () => {
        const mockUser = {
          id: "user-1",
          username: "testuser",
          person: null,
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const result = await documentResolvers.Document.owner(mockDocument);

        expect(result).toEqual({
          id: "user-1",
          username: "testuser",
          person: null,
          ...null,
        });
      });

      it("should handle null user", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await documentResolvers.Document.owner(mockDocument);

        expect(result).toEqual({
          ...null,
          ...undefined,
        });
      });
    });

    describe("documentType", () => {
      it("should return document type", async () => {
        const mockDocumentType = {
          id: "type-1",
          name: "Test Type",
          description: "Test Type Description",
        };

        mockPrisma.documentType.findUnique.mockResolvedValue(mockDocumentType);

        const result = await documentResolvers.Document.documentType(mockDocument);

        expect(mockPrisma.documentType.findUnique).toHaveBeenCalledWith({
          where: { id: "type-1" },
        });

        expect(result).toEqual(mockDocumentType);
      });

      it("should handle null document type", async () => {
        mockPrisma.documentType.findUnique.mockResolvedValue(null);

        const result = await documentResolvers.Document.documentType(mockDocument);

        expect(result).toBeNull();
      });
    });

    describe("bundle", () => {
      beforeEach(() => {
        // Mock getBundleTypeId function behavior
        mockPrisma.bundle.findUnique.mockResolvedValue({
          bundleType: { id: "DEMONSTRATION" },
        });
      });

      it("should return demonstration bundle", async () => {
        const mockDemonstration = {
          id: "bundle-1",
          name: "Test Demonstration",
          bundleTypeId: "DEMONSTRATION",
        };

        mockPrisma.bundle.findUnique.mockResolvedValue({
          bundleType: { id: "DEMONSTRATION" },
        });
        mockPrisma.demonstration.findUnique.mockResolvedValue(mockDemonstration);

        const result = await documentResolvers.Document.bundle(mockDocument);

        expect(mockPrisma.demonstration.findUnique).toHaveBeenCalledWith({
          where: { id: "bundle-1" },
        });

        expect(result).toEqual(mockDemonstration);
      });

      it("should return amendment bundle", async () => {
        const mockAmendment = {
          id: "bundle-1",
          name: "Test Amendment",
          bundleTypeId: "AMENDMENT",
        };

        mockPrisma.bundle.findUnique.mockResolvedValue({
          bundleType: { id: "AMENDMENT" },
        });
        mockPrisma.modification.findUnique.mockResolvedValue(mockAmendment);

        const result = await documentResolvers.Document.bundle(mockDocument);

        expect(mockPrisma.modification.findUnique).toHaveBeenCalledWith({
          where: {
            id: "bundle-1",
            bundleTypeId: "AMENDMENT",
          },
        });

        expect(result).toEqual(mockAmendment);
      });

      it("should return extension bundle", async () => {
        const mockExtension = {
          id: "bundle-1",
          name: "Test Extension",
          bundleTypeId: "EXTENSION",
        };

        mockPrisma.bundle.findUnique.mockResolvedValue({
          bundleType: { id: "EXTENSION" },
        });
        mockPrisma.modification.findUnique.mockResolvedValue(mockExtension);

        const result = await documentResolvers.Document.bundle(mockDocument);

        expect(mockPrisma.modification.findUnique).toHaveBeenCalledWith({
          where: {
            id: "bundle-1",
            bundleTypeId: "EXTENSION",
          },
        });

        expect(result).toEqual(mockExtension);
      });

      it("should return null for unknown bundle type", async () => {
        mockPrisma.bundle.findUnique.mockResolvedValue({
          bundleType: { id: "UNKNOWN_TYPE" },
        });

        const result = await documentResolvers.Document.bundle(mockDocument);

        expect(result).toBeNull();
      });

      it("should handle null bundle response", async () => {
        mockPrisma.bundle.findUnique.mockResolvedValue(null);

        await expect(documentResolvers.Document.bundle(mockDocument)).rejects.toThrow();
      });
    });

    describe("bundleType", () => {
      it("should return bundle type id", async () => {
        mockPrisma.bundle.findUnique.mockResolvedValue({
          bundleType: { id: "DEMONSTRATION" },
        });

        const result = await documentResolvers.Document.bundleType(mockDocument);

        expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
          where: { id: "bundle-1" },
          select: {
            bundleType: {
              select: {
                id: true,
              },
            },
          },
        });

        expect(result).toBe("DEMONSTRATION");
      });
    });
  });

  describe("Bundle type resolver", () => {
    describe("__resolveType", () => {
      it("should resolve Demonstration type", () => {
        const bundle: Bundle = {
          id: "bundle-1",
          bundleTypeId: "DEMONSTRATION",
        };

        const result = documentResolvers.Bundle.__resolveType(bundle);

        expect(result).toBe("Demonstration");
      });

      it("should resolve Amendment type", () => {
        const bundle: Bundle = {
          id: "bundle-1",
          bundleTypeId: "AMENDMENT",
        };

        const result = documentResolvers.Bundle.__resolveType(bundle);

        expect(result).toBe("Amendment");
      });

      it("should resolve Extension type", () => {
        const bundle: Bundle = {
          id: "bundle-1",
          bundleTypeId: "EXTENSION",
        };

        const result = documentResolvers.Bundle.__resolveType(bundle);

        expect(result).toBe("Extension");
      });

      it("should return undefined for unknown bundle type", () => {
        const bundle: Bundle = {
          id: "bundle-1",
          bundleTypeId: "UNKNOWN_TYPE",
        };

        const result = documentResolvers.Bundle.__resolveType(bundle);

        expect(result).toBeUndefined();
      });
    });
  });

  describe("Error handling", () => {
    it("should handle S3 errors in upload", async () => {
      process.env.UPLOAD_BUCKET = "test-upload-bucket";

      const mockContext: GraphQLContext = {
        user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
      };

      const mockInput = {
        title: "Test Document",
        description: "Test Description",
        documentType: "type-1",
        bundleId: "bundle-1",
      };

      const mockDocumentPendingUpload = {
        id: "pending-1",
        title: "Test Document",
      };

      mockPrisma.documentPendingUpload.create.mockResolvedValue(mockDocumentPendingUpload);
      (getSignedUrl as any).mockRejectedValue(new Error("S3 connection failed"));

      await expect(
        documentResolvers.Mutation.uploadDocument(mockContext, { input: mockInput })
      ).rejects.toThrow("S3 connection failed");
    });

    it("should handle S3 errors in download", async () => {
      process.env.CLEAN_BUCKET = "test-clean-bucket";

      const mockDocument = {
        id: "doc-1",
        bundleId: "bundle-1",
        title: "Test Document",
      };

      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      (getSignedUrl as any).mockRejectedValue(new Error("S3 connection failed"));

      await expect(
        documentResolvers.Mutation.downloadDocument(undefined, { id: "doc-1" })
      ).rejects.toThrow("S3 connection failed");
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.document.findUnique.mockRejectedValue(dbError);

      await expect(
        documentResolvers.Query.document(undefined, { id: "doc-1" })
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle validation errors in GraphQL", async () => {
      const validationError = new GraphQLError("Validation failed");
      mockPrisma.document.findMany.mockRejectedValue(validationError);

      await expect(
        documentResolvers.Query.documents(undefined, { bundleTypeId: "DEMONSTRATION" })
      ).rejects.toThrow("Validation failed");
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete upload flow", async () => {
      process.env.UPLOAD_BUCKET = "test-upload-bucket";

      const mockContext: GraphQLContext = {
        user: { id: "user-1", sub: "sub-1", role: "demos-admin" },
      };

      const mockInput = {
        title: "Integration Test Document",
        description: "Full upload flow test",
        documentType: "type-1",
        bundleId: "bundle-1",
      };

      const mockDocumentPendingUpload = {
        id: "pending-123",
        title: "Integration Test Document",
        description: "Full upload flow test",
      };

      mockPrisma.documentPendingUpload.create.mockResolvedValue(mockDocumentPendingUpload);

      const result = await documentResolvers.Mutation.uploadDocument(mockContext, {
        input: mockInput,
      });

      expect(result.presignedURL).toBe("https://signed-url.example.com");
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-upload-bucket",
        Key: "pending-123",
      });
    });

    it("should handle complete download flow", async () => {
      process.env.CLEAN_BUCKET = "test-clean-bucket";

      const mockDocument = {
        id: "doc-123",
        bundleId: "bundle-456",
        title: "Integration Test Document",
      };

      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);

      const result = await documentResolvers.Mutation.downloadDocument(undefined, {
        id: "doc-123",
      });

      expect(result).toBe("https://signed-url.example.com");
      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-clean-bucket",
        Key: "bundle-456/doc-123",
      });
    });
  });
});