import { describe, it, expect, vi, beforeEach } from "vitest";
import { Modification } from "@prisma/client";

// Mock dependencies
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(() => ({
    modification: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    bundle: {
      create: vi.fn(),
    },
    demonstration: {
      findUnique: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  })),
}));

vi.mock("../user/userResolvers.js", () => ({
  findUniqueUser: vi.fn(),
}));

vi.mock("../bundleStatus/bundleStatusResolvers.js", () => ({
  resolveBundleStatus: vi.fn(),
}));

vi.mock("../../errors/checkOptionalNotNullFields.js", () => ({
  checkOptionalNotNullFields: vi.fn(),
}));

vi.mock("../../constants.js", () => ({
  BUNDLE_TYPE: {
    DEMONSTRATION: "DEMONSTRATION",
    AMENDMENT: "AMENDMENT",
    EXTENSION: "EXTENSION",
  },
}));

import { prisma } from "../../prismaClient.js";
import { findUniqueUser } from "../user/userResolvers.js";
import { resolveBundleStatus } from "../bundleStatus/bundleStatusResolvers.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import {
  getAmendment,
  getExtension,
  getManyAmendments,
  getManyExtensions,
  createAmendment,
  createExtension,
  updateAmendment,
  updateExtension,
  modificationResolvers,
} from "./modificationResolvers";

describe("modificationResolvers", () => {
  const mockPrisma = {
    modification: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    bundle: {
      create: vi.fn(),
    },
    demonstration: {
      findUnique: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).mockReturnValue(mockPrisma);
  });

  describe("getAmendment", () => {
    it("should return amendment by id", async () => {
      const mockAmendment = {
        id: "amendment-1",
        name: "Test Amendment",
        bundleTypeId: "AMENDMENT",
      };

      mockPrisma.modification.findUnique.mockResolvedValue(mockAmendment);

      const result = await getAmendment(undefined, { id: "amendment-1" });

      expect(mockPrisma.modification.findUnique).toHaveBeenCalledWith({
        where: {
          id: "amendment-1",
          bundleTypeId: "AMENDMENT",
        },
      });
      expect(result).toEqual(mockAmendment);
    });

    it("should return null when amendment not found", async () => {
      mockPrisma.modification.findUnique.mockResolvedValue(null);

      const result = await getAmendment(undefined, { id: "non-existent" });

      expect(result).toBeNull();
    });

    it("should handle optional context and info parameters", async () => {
      const mockAmendment = {
        id: "amendment-1",
        name: "Test Amendment",
        bundleTypeId: "AMENDMENT",
      };

      mockPrisma.modification.findUnique.mockResolvedValue(mockAmendment);

      const result = await getAmendment(undefined, { id: "amendment-1" }, undefined, undefined);

      expect(result).toEqual(mockAmendment);
    });
  });

  describe("getExtension", () => {
    it("should return extension by id", async () => {
      const mockExtension = {
        id: "extension-1",
        name: "Test Extension",
        bundleTypeId: "EXTENSION",
      };

      mockPrisma.modification.findUnique.mockResolvedValue(mockExtension);

      const result = await getExtension(undefined, { id: "extension-1" });

      expect(mockPrisma.modification.findUnique).toHaveBeenCalledWith({
        where: {
          id: "extension-1",
          bundleTypeId: "EXTENSION",
        },
      });
      expect(result).toEqual(mockExtension);
    });

    it("should return null when extension not found", async () => {
      mockPrisma.modification.findUnique.mockResolvedValue(null);

      const result = await getExtension(undefined, { id: "non-existent" });

      expect(result).toBeNull();
    });

    it("should handle optional context and info parameters", async () => {
      const mockExtension = {
        id: "extension-1",
        name: "Test Extension",
        bundleTypeId: "EXTENSION",
      };

      mockPrisma.modification.findUnique.mockResolvedValue(mockExtension);

      const result = await getExtension(undefined, { id: "extension-1" }, undefined, undefined);

      expect(result).toEqual(mockExtension);
    });
  });

  describe("getManyAmendments", () => {
    it("should return all amendments", async () => {
      const mockAmendments = [
        { id: "amendment-1", name: "Amendment 1", bundleTypeId: "AMENDMENT" },
        { id: "amendment-2", name: "Amendment 2", bundleTypeId: "AMENDMENT" },
      ];

      mockPrisma.modification.findMany.mockResolvedValue(mockAmendments);

      const result = await getManyAmendments();

      expect(mockPrisma.modification.findMany).toHaveBeenCalledWith({
        where: {
          bundleTypeId: "AMENDMENT",
        },
      });
      expect(result).toEqual(mockAmendments);
    });

    it("should return empty array when no amendments exist", async () => {
      mockPrisma.modification.findMany.mockResolvedValue([]);

      const result = await getManyAmendments();

      expect(result).toEqual([]);
    });
  });

  describe("getManyExtensions", () => {
    it("should return all extensions", async () => {
      const mockExtensions = [
        { id: "extension-1", name: "Extension 1", bundleTypeId: "EXTENSION" },
        { id: "extension-2", name: "Extension 2", bundleTypeId: "EXTENSION" },
      ];

      mockPrisma.modification.findMany.mockResolvedValue(mockExtensions);

      const result = await getManyExtensions();

      expect(mockPrisma.modification.findMany).toHaveBeenCalledWith({
        where: {
          bundleTypeId: "EXTENSION",
        },
      });
      expect(result).toEqual(mockExtensions);
    });

    it("should return empty array when no extensions exist", async () => {
      mockPrisma.modification.findMany.mockResolvedValue([]);

      const result = await getManyExtensions();

      expect(result).toEqual([]);
    });
  });

  describe("createAmendment", () => {
    const mockInput = {
      demonstrationId: "demo-1",
      name: "Test Amendment",
      description: "Test Description",
      projectOfficerUserId: "user-1",
    };

    it("should create amendment successfully", async () => {
      const mockBundle = {
        id: "bundle-1",
        bundleTypeId: "AMENDMENT",
      };

      const mockAmendment = {
        id: "bundle-1",
        bundleTypeId: "AMENDMENT",
        demonstrationId: "demo-1",
        name: "Test Amendment",
        description: "Test Description",
        statusId: "Pre-Submission",
        currentPhaseId: "Concept",
        projectOfficerUserId: "user-1",
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          bundle: {
            create: vi.fn().mockResolvedValue(mockBundle),
          },
          modification: {
            create: vi.fn().mockResolvedValue(mockAmendment),
          },
        };
        return await callback(tx);
      });

      const result = await createAmendment(undefined, { input: mockInput });

      expect(result).toEqual(mockAmendment);
    });

    it("should handle optional context and info parameters", async () => {
      const mockBundle = {
        id: "bundle-1",
        bundleTypeId: "AMENDMENT",
      };

      const mockAmendment = {
        id: "bundle-1",
        bundleTypeId: "AMENDMENT",
        demonstrationId: "demo-1",
        name: "Test Amendment",
        description: "Test Description",
        statusId: "Pre-Submission",
        currentPhaseId: "Concept",
        projectOfficerUserId: "user-1",
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          bundle: {
            create: vi.fn().mockResolvedValue(mockBundle),
          },
          modification: {
            create: vi.fn().mockResolvedValue(mockAmendment),
          },
        };
        return await callback(tx);
      });

      const result = await createAmendment(
        undefined,
        { input: mockInput },
        undefined,
        undefined
      );

      expect(result).toEqual(mockAmendment);
    });

    it("should create bundle and amendment with correct data", async () => {
      const mockBundle = {
        id: "bundle-1",
        bundleTypeId: "AMENDMENT",
      };

      let capturedBundleData: any;
      let capturedAmendmentData: any;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          bundle: {
            create: vi.fn().mockImplementation((data) => {
              capturedBundleData = data;
              return Promise.resolve(mockBundle);
            }),
          },
          modification: {
            create: vi.fn().mockImplementation((data) => {
              capturedAmendmentData = data;
              return Promise.resolve({});
            }),
          },
        };
        return await callback(tx);
      });

      await createAmendment(undefined, { input: mockInput });

      expect(capturedBundleData).toEqual({
        data: {
          bundleTypeId: "AMENDMENT",
        },
      });

      expect(capturedAmendmentData).toEqual({
        data: {
          id: "bundle-1",
          bundleTypeId: "AMENDMENT",
          demonstrationId: "demo-1",
          name: "Test Amendment",
          description: "Test Description",
          statusId: "Pre-Submission",
          currentPhaseId: "Concept",
          projectOfficerUserId: "user-1",
        },
      });
    });

    it("should handle transaction errors", async () => {
      const transactionError = new Error("Transaction failed");
      mockPrisma.$transaction.mockRejectedValue(transactionError);

      await expect(
        createAmendment(undefined, { input: mockInput })
      ).rejects.toThrow("Transaction failed");
    });
  });

  describe("createExtension", () => {
    const mockInput = {
      demonstrationId: "demo-1",
      name: "Test Extension",
      description: "Test Description",
      projectOfficerUserId: "user-1",
    };

    it("should create extension successfully", async () => {
      const mockBundle = {
        id: "bundle-1",
        bundleTypeId: "EXTENSION",
      };

      const mockExtension = {
        id: "bundle-1",
        bundleTypeId: "EXTENSION",
        demonstrationId: "demo-1",
        name: "Test Extension",
        description: "Test Description",
        statusId: "Pre-Submission",
        currentPhaseId: "Concept",
        projectOfficerUserId: "user-1",
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          bundle: {
            create: vi.fn().mockResolvedValue(mockBundle),
          },
          modification: {
            create: vi.fn().mockResolvedValue(mockExtension),
          },
        };
        return await callback(tx);
      });

      const result = await createExtension(undefined, { input: mockInput });

      expect(result).toEqual(mockExtension);
    });

    it("should create bundle and extension with correct data", async () => {
      const mockBundle = {
        id: "bundle-1",
        bundleTypeId: "EXTENSION",
      };

      let capturedBundleData: any;
      let capturedExtensionData: any;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          bundle: {
            create: vi.fn().mockImplementation((data) => {
              capturedBundleData = data;
              return Promise.resolve(mockBundle);
            }),
          },
          modification: {
            create: vi.fn().mockImplementation((data) => {
              capturedExtensionData = data;
              return Promise.resolve({});
            }),
          },
        };
        return await callback(tx);
      });

      await createExtension(undefined, { input: mockInput });

      expect(capturedBundleData).toEqual({
        data: {
          bundleTypeId: "EXTENSION",
        },
      });

      expect(capturedExtensionData).toEqual({
        data: {
          id: "bundle-1",
          bundleTypeId: "EXTENSION",
          demonstrationId: "demo-1",
          name: "Test Extension",
          description: "Test Description",
          statusId: "Pre-Submission",
          currentPhaseId: "Concept",
          projectOfficerUserId: "user-1",
        },
      });
    });
  });

  describe("updateAmendment", () => {
    const mockInput = {
      demonstrationId: "demo-2",
      name: "Updated Amendment",
      description: "Updated Description",
      effectiveDate: new Date("2024-01-01"),
      expirationDate: new Date("2024-12-31"),
      status: "Under Review",
      currentPhase: "State Application",
      projectOfficerUserId: "user-2",
    };

    it("should update amendment successfully", async () => {
      const mockUpdatedAmendment = {
        id: "amendment-1",
        ...mockInput,
      };

      mockPrisma.modification.update.mockResolvedValue(mockUpdatedAmendment);

      const result = await updateAmendment(undefined, {
        id: "amendment-1",
        input: mockInput,
      });

      expect(checkOptionalNotNullFields).toHaveBeenCalledWith(
        ["demonstrationId", "name", "status", "currentPhase", "projectOfficerUserId"],
        mockInput
      );

      expect(mockPrisma.modification.update).toHaveBeenCalledWith({
        where: {
          id: "amendment-1",
          bundleTypeId: "AMENDMENT",
        },
        data: {
          demonstrationId: "demo-2",
          name: "Updated Amendment",
          description: "Updated Description",
          effectiveDate: new Date("2024-01-01"),
          expirationDate: new Date("2024-12-31"),
          statusId: "Under Review",
          currentPhaseId: "State Application",
          projectOfficerUserId: "user-2",
        },
      });

      expect(result).toEqual(mockUpdatedAmendment);
    });

    it("should handle partial updates", async () => {
      const partialInput = {
        name: "Partially Updated Amendment",
        description: "New description",
      };

      const mockUpdatedAmendment = {
        id: "amendment-1",
        name: "Partially Updated Amendment",
        description: "New description",
      };

      mockPrisma.modification.update.mockResolvedValue(mockUpdatedAmendment);

      const result = await updateAmendment(undefined, {
        id: "amendment-1",
        input: partialInput,
      });

      expect(mockPrisma.modification.update).toHaveBeenCalledWith({
        where: {
          id: "amendment-1",
          bundleTypeId: "AMENDMENT",
        },
        data: {
          demonstrationId: undefined,
          name: "Partially Updated Amendment",
          description: "New description",
          effectiveDate: undefined,
          expirationDate: undefined,
          statusId: undefined,
          currentPhaseId: undefined,
          projectOfficerUserId: undefined,
        },
      });

      expect(result).toEqual(mockUpdatedAmendment);
    });

    it("should handle optional context and info parameters", async () => {
      const mockUpdatedAmendment = {
        id: "amendment-1",
        name: "Updated Amendment",
      };

      mockPrisma.modification.update.mockResolvedValue(mockUpdatedAmendment);

      const result = await updateAmendment(
        undefined,
        { id: "amendment-1", input: { name: "Updated Amendment" } },
        undefined,
        undefined
      );

      expect(result).toEqual(mockUpdatedAmendment);
    });
  });

  describe("updateExtension", () => {
    const mockInput = {
      demonstrationId: "demo-2",
      name: "Updated Extension",
      description: "Updated Description",
      effectiveDate: new Date("2024-01-01"),
      expirationDate: new Date("2024-12-31"),
      status: "Under Review",
      currentPhase: "State Application",
      projectOfficerUserId: "user-2",
    };

    it("should update extension successfully", async () => {
      const mockUpdatedExtension = {
        id: "extension-1",
        ...mockInput,
      };

      mockPrisma.modification.update.mockResolvedValue(mockUpdatedExtension);

      const result = await updateExtension(undefined, {
        id: "extension-1",
        input: mockInput,
      });

      expect(checkOptionalNotNullFields).toHaveBeenCalledWith(
        ["demonstrationId", "name", "status", "currentPhase", "projectOfficerUserId"],
        mockInput
      );

      expect(mockPrisma.modification.update).toHaveBeenCalledWith({
        where: {
          id: "extension-1",
          bundleTypeId: "EXTENSION",
        },
        data: {
          demonstrationId: "demo-2",
          name: "Updated Extension",
          description: "Updated Description",
          effectiveDate: new Date("2024-01-01"),
          expirationDate: new Date("2024-12-31"),
          statusId: "Under Review",
          currentPhaseId: "State Application",
          projectOfficerUserId: "user-2",
        },
      });

      expect(result).toEqual(mockUpdatedExtension);
    });
  });

  describe("modificationResolvers", () => {
    describe("Query resolvers", () => {
      it("should have amendment query resolver", () => {
        expect(modificationResolvers.Query.amendment).toBe(getAmendment);
      });

      it("should have amendments query resolver", () => {
        expect(modificationResolvers.Query.amendments).toBe(getManyAmendments);
      });

      it("should have extension query resolver", () => {
        expect(modificationResolvers.Query.extension).toBe(getExtension);
      });

      it("should have extensions query resolver", () => {
        expect(modificationResolvers.Query.extensions).toBe(getManyExtensions);
      });
    });

    describe("Mutation resolvers", () => {
      it("should have createAmendment mutation resolver", () => {
        expect(modificationResolvers.Mutation.createAmendment).toBe(createAmendment);
      });

      it("should have updateAmendment mutation resolver", () => {
        expect(modificationResolvers.Mutation.updateAmendment).toBe(updateAmendment);
      });

      it("should have createExtension mutation resolver", () => {
        expect(modificationResolvers.Mutation.createExtension).toBe(createExtension);
      });

      it("should have updateExtension mutation resolver", () => {
        expect(modificationResolvers.Mutation.updateExtension).toBe(updateExtension);
      });

      it("should delete amendment", async () => {
        const mockDeletedAmendment = { id: "amendment-1", name: "Deleted Amendment" };
        mockPrisma.modification.delete.mockResolvedValue(mockDeletedAmendment);

        const result = await modificationResolvers.Mutation.deleteAmendment(
          undefined,
          { id: "amendment-1" }
        );

        expect(mockPrisma.modification.delete).toHaveBeenCalledWith({
          where: {
            id: "amendment-1",
            bundleTypeId: "AMENDMENT",
          },
        });
        expect(result).toEqual(mockDeletedAmendment);
      });

      it("should delete extension", async () => {
        const mockDeletedExtension = { id: "extension-1", name: "Deleted Extension" };
        mockPrisma.modification.delete.mockResolvedValue(mockDeletedExtension);

        const result = await modificationResolvers.Mutation.deleteExtension(
          undefined,
          { id: "extension-1" }
        );

        expect(mockPrisma.modification.delete).toHaveBeenCalledWith({
          where: {
            id: "extension-1",
            bundleTypeId: "EXTENSION",
          },
        });
        expect(result).toEqual(mockDeletedExtension);
      });
    });

    describe("Amendment field resolvers", () => {
      const mockAmendment: Modification = {
        id: "amendment-1",
        bundleTypeId: "AMENDMENT",
        demonstrationId: "demo-1",
        name: "Test Amendment",
        description: "Test Description",
        effectiveDate: new Date("2024-01-01"),
        expirationDate: new Date("2024-12-31"),
        statusId: "Under Review",
        currentPhaseId: "State Application",
        projectOfficerUserId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it("should resolve demonstration", async () => {
        const mockDemonstration = { id: "demo-1", name: "Test Demonstration" };
        mockPrisma.demonstration.findUnique.mockResolvedValue(mockDemonstration);

        const result = await modificationResolvers.Amendment.demonstration(mockAmendment);

        expect(mockPrisma.demonstration.findUnique).toHaveBeenCalledWith({
          where: { id: "demo-1" },
        });
        expect(result).toEqual(mockDemonstration);
      });

      it("should resolve projectOfficer", async () => {
        const mockUser = { id: "user-1", name: "John Doe" };
        (findUniqueUser as any).mockResolvedValue(mockUser);

        const result = await modificationResolvers.Amendment.projectOfficer(mockAmendment);

        expect(findUniqueUser).toHaveBeenCalledWith("user-1");
        expect(result).toEqual(mockUser);
      });

      it("should resolve documents", async () => {
        const mockDocuments = [
          { id: "doc-1", title: "Document 1" },
          { id: "doc-2", title: "Document 2" },
        ];
        mockPrisma.document.findMany.mockResolvedValue(mockDocuments);

        const result = await modificationResolvers.Amendment.documents(mockAmendment);

        expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
          where: { bundleId: "amendment-1" },
        });
        expect(result).toEqual(mockDocuments);
      });

      it("should resolve currentPhase", async () => {
        const result = await modificationResolvers.Amendment.currentPhase(mockAmendment);

        expect(result).toBe("State Application");
      });

      it("should resolve status", () => {
        expect(modificationResolvers.Amendment.status).toBe(resolveBundleStatus);
      });
    });

    describe("Extension field resolvers", () => {
      const mockExtension: Modification = {
        id: "extension-1",
        bundleTypeId: "EXTENSION",
        demonstrationId: "demo-1",
        name: "Test Extension",
        description: "Test Description",
        effectiveDate: new Date("2024-01-01"),
        expirationDate: new Date("2024-12-31"),
        statusId: "Under Review",
        currentPhaseId: "State Application",
        projectOfficerUserId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it("should resolve demonstration", async () => {
        const mockDemonstration = { id: "demo-1", name: "Test Demonstration" };
        mockPrisma.demonstration.findUnique.mockResolvedValue(mockDemonstration);

        const result = await modificationResolvers.Extension.demonstration(mockExtension);

        expect(mockPrisma.demonstration.findUnique).toHaveBeenCalledWith({
          where: { id: "demo-1" },
        });
        expect(result).toEqual(mockDemonstration);
      });

      it("should resolve projectOfficer", async () => {
        const mockUser = { id: "user-1", name: "John Doe" };
        (findUniqueUser as any).mockResolvedValue(mockUser);

        const result = await modificationResolvers.Extension.projectOfficer(mockExtension);

        expect(findUniqueUser).toHaveBeenCalledWith("user-1");
        expect(result).toEqual(mockUser);
      });

      it("should resolve documents", async () => {
        const mockDocuments = [
          { id: "doc-1", title: "Document 1" },
          { id: "doc-2", title: "Document 2" },
        ];
        mockPrisma.document.findMany.mockResolvedValue(mockDocuments);

        const result = await modificationResolvers.Extension.documents(mockExtension);

        expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
          where: { bundleId: "extension-1" },
        });
        expect(result).toEqual(mockDocuments);
      });

      it("should resolve currentPhase", async () => {
        const result = await modificationResolvers.Extension.currentPhase(mockExtension);

        expect(result).toBe("State Application");
      });

      it("should resolve status", () => {
        expect(modificationResolvers.Extension.status).toBe(resolveBundleStatus);
      });
    });
  });

  describe("Error handling", () => {
    it("should handle database connection errors in getAmendment", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.modification.findUnique.mockRejectedValue(dbError);

      await expect(getAmendment(undefined, { id: "amendment-1" })).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle database connection errors in getExtension", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.modification.findUnique.mockRejectedValue(dbError);

      await expect(getExtension(undefined, { id: "extension-1" })).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle database connection errors in getManyAmendments", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.modification.findMany.mockRejectedValue(dbError);

      await expect(getManyAmendments()).rejects.toThrow("Database connection failed");
    });

    it("should handle database connection errors in getManyExtensions", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.modification.findMany.mockRejectedValue(dbError);

      await expect(getManyExtensions()).rejects.toThrow("Database connection failed");
    });

    it("should handle transaction rollback errors in createAmendment", async () => {
      const transactionError = new Error("Transaction failed");
      mockPrisma.$transaction.mockRejectedValue(transactionError);

      await expect(
        createAmendment(undefined, {
          input: {
            demonstrationId: "demo-1",
            name: "Test Amendment",
            description: "Test Description",
            projectOfficerUserId: "user-1",
          },
        })
      ).rejects.toThrow("Transaction failed");
    });

    it("should handle transaction rollback errors in createExtension", async () => {
      const transactionError = new Error("Transaction failed");
      mockPrisma.$transaction.mockRejectedValue(transactionError);

      await expect(
        createExtension(undefined, {
          input: {
            demonstrationId: "demo-1",
            name: "Test Extension",
            description: "Test Description",
            projectOfficerUserId: "user-1",
          },
        })
      ).rejects.toThrow("Transaction failed");
    });

    it("should handle update errors", async () => {
      const updateError = new Error("Update failed");
      mockPrisma.modification.update.mockRejectedValue(updateError);

      await expect(
        updateAmendment(undefined, {
          id: "amendment-1",
          input: { name: "Updated" },
        })
      ).rejects.toThrow("Update failed");
    });

    it("should handle delete errors", async () => {
      const deleteError = new Error("Delete failed");
      mockPrisma.modification.delete.mockRejectedValue(deleteError);

      await expect(
        modificationResolvers.Mutation.deleteAmendment(undefined, { id: "amendment-1" })
      ).rejects.toThrow("Delete failed");
    });
  });

  describe("Edge cases", () => {
    it("should handle null/undefined field values in update", async () => {
      const inputWithNulls = {
        name: "Test Amendment",
        description: null,
        effectiveDate: undefined,
        demonstrationId: null,
      };

      const mockUpdatedAmendment = { id: "amendment-1", name: "Test Amendment" };
      mockPrisma.modification.update.mockResolvedValue(mockUpdatedAmendment);

      const result = await updateAmendment(undefined, {
        id: "amendment-1",
        input: inputWithNulls,
      });

      expect(mockPrisma.modification.update).toHaveBeenCalledWith({
        where: {
          id: "amendment-1",
          bundleTypeId: "AMENDMENT",
        },
        data: {
          demonstrationId: null,
          name: "Test Amendment",
          description: null,
          effectiveDate: undefined,
          expirationDate: undefined,
          statusId: undefined,
          currentPhaseId: undefined,
          projectOfficerUserId: undefined,
        },
      });

      expect(result).toEqual(mockUpdatedAmendment);
    });

    it("should handle empty arrays in field resolvers", async () => {
      const mockModification: Modification = {
        id: "mod-1",
        bundleTypeId: "AMENDMENT",
        demonstrationId: "demo-1",
        name: "Test Modification",
        description: "Test Description",
        effectiveDate: null,
        expirationDate: null,
        statusId: "Pre-Submission",
        currentPhaseId: "Concept",
        projectOfficerUserId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.demonstration.findUnique.mockResolvedValue(null);
      (findUniqueUser as any).mockResolvedValue(null);

      const documentsResult = await modificationResolvers.Amendment.documents(mockModification);
      const demonstrationResult = await modificationResolvers.Amendment.demonstration(mockModification);
      const projectOfficerResult = await modificationResolvers.Amendment.projectOfficer(mockModification);

      expect(documentsResult).toEqual([]);
      expect(demonstrationResult).toBeNull();
      expect(projectOfficerResult).toBeNull();
    });

    it("should handle missing projectOfficerUserId", async () => {
      const mockModification: Modification = {
        id: "mod-1",
        bundleTypeId: "AMENDMENT",
        demonstrationId: "demo-1",
        name: "Test Modification",
        description: "Test Description",
        effectiveDate: null,
        expirationDate: null,
        statusId: "Pre-Submission",
        currentPhaseId: "Concept",
        projectOfficerUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (findUniqueUser as any).mockResolvedValue(null);

      const result = await modificationResolvers.Amendment.projectOfficer(mockModification);

      expect(findUniqueUser).toHaveBeenCalledWith(null);
      expect(result).toBeNull();
    });

    it("should handle missing demonstrationId", async () => {
      const mockModification: Modification = {
        id: "mod-1",
        bundleTypeId: "AMENDMENT",
        demonstrationId: null,
        name: "Test Modification",
        description: "Test Description",
        effectiveDate: null,
        expirationDate: null,
        statusId: "Pre-Submission",
        currentPhaseId: "Concept",
        projectOfficerUserId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.demonstration.findUnique.mockResolvedValue(null);

      const result = await modificationResolvers.Amendment.demonstration(mockModification);

      expect(mockPrisma.demonstration.findUnique).toHaveBeenCalledWith({
        where: { id: null },
      });
      expect(result).toBeNull();
    });
  });

  describe("Bundle type consistency", () => {
    it("should consistently use AMENDMENT bundle type for amendments", async () => {
      mockPrisma.modification.findUnique.mockResolvedValue(null);
      mockPrisma.modification.findMany.mockResolvedValue([]);

      await getAmendment(undefined, { id: "test" });
      await getManyAmendments();

      expect(mockPrisma.modification.findUnique).toHaveBeenCalledWith({
        where: { id: "test", bundleTypeId: "AMENDMENT" },
      });
      expect(mockPrisma.modification.findMany).toHaveBeenCalledWith({
        where: { bundleTypeId: "AMENDMENT" },
      });
    });

    it("should consistently use EXTENSION bundle type for extensions", async () => {
      mockPrisma.modification.findUnique.mockResolvedValue(null);
      mockPrisma.modification.findMany.mockResolvedValue([]);

      await getExtension(undefined, { id: "test" });
      await getManyExtensions();

      expect(mockPrisma.modification.findUnique).toHaveBeenCalledWith({
        where: { id: "test", bundleTypeId: "EXTENSION" },
      });
      expect(mockPrisma.modification.findMany).toHaveBeenCalledWith({
        where: { bundleTypeId: "EXTENSION" },
      });
    });
  });
});