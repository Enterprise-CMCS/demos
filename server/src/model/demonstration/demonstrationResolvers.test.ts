import { describe, it, expect, vi, beforeEach } from "vitest";
import { Demonstration } from "@prisma/client";

// Mock dependencies
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(() => ({
    demonstration: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    bundle: {
      create: vi.fn(),
    },
    state: {
      findUnique: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
    },
    modification: {
      findMany: vi.fn(),
    },
    bundlePhase: {
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
  getDemonstration,
  getManyDemonstrations,
  createDemonstration,
  updateDemonstration,
  demonstrationResolvers,
} from "./demonstrationResolvers";

describe("demonstrationResolvers", () => {
  const mockPrisma = {
    demonstration: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    bundle: {
      create: vi.fn(),
    },
    state: {
      findUnique: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
    },
    modification: {
      findMany: vi.fn(),
    },
    bundlePhase: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).mockReturnValue(mockPrisma);
  });

  describe("getDemonstration", () => {
    it("should return demonstration by id", async () => {
      const mockDemonstration = {
        id: "demo-1",
        name: "Test Demo",
        description: "Test Description",
      };

      mockPrisma.demonstration.findUnique.mockResolvedValue(mockDemonstration);

      const result = await getDemonstration(undefined, { id: "demo-1" });

      expect(mockPrisma.demonstration.findUnique).toHaveBeenCalledWith({
        where: { id: "demo-1" },
      });
      expect(result).toEqual(mockDemonstration);
    });

    it("should return null when demonstration not found", async () => {
      mockPrisma.demonstration.findUnique.mockResolvedValue(null);

      const result = await getDemonstration(undefined, { id: "non-existent" });

      expect(result).toBeNull();
    });
  });

  describe("getManyDemonstrations", () => {
    it("should return all demonstrations", async () => {
      const mockDemonstrations = [
        { id: "demo-1", name: "Demo 1" },
        { id: "demo-2", name: "Demo 2" },
      ];

      mockPrisma.demonstration.findMany.mockResolvedValue(mockDemonstrations);

      const result = await getManyDemonstrations();

      expect(mockPrisma.demonstration.findMany).toHaveBeenCalledWith();
      expect(result).toEqual(mockDemonstrations);
    });

    it("should return empty array when no demonstrations exist", async () => {
      mockPrisma.demonstration.findMany.mockResolvedValue([]);

      const result = await getManyDemonstrations();

      expect(result).toEqual([]);
    });
  });

  describe("createDemonstration", () => {
    const mockInput = {
      name: "Test Demo",
      description: "Test Description",
      cmcsDivision: "Division of System Reform Demonstrations",
      signatureLevel: "OA",
      stateId: "CA",
      projectOfficerUserId: "user-1",
    };

    it("should create demonstration successfully", async () => {
      const mockBundle = {
        id: "bundle-1",
        bundleTypeId: "DEMONSTRATION",
      };

      const mockDemonstration = {
        id: "bundle-1",
        bundleTypeId: "DEMONSTRATION",
        name: "Test Demo",
        description: "Test Description",
        cmcsDivisionId: "Division of System Reform Demonstrations",
        signatureLevelId: "OA",
        statusId: "Pre-Submission",
        stateId: "CA",
        currentPhaseId: "Concept",
        projectOfficerUserId: "user-1",
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          bundle: {
            create: vi.fn().mockResolvedValue(mockBundle),
          },
          demonstration: {
            create: vi.fn().mockResolvedValue(mockDemonstration),
          },
        };
        return await callback(tx);
      });

      const result = await createDemonstration(undefined, { input: mockInput });

      expect(result).toEqual({
        success: true,
        message: "Demonstration created successfully!",
      });
    });

    it("should handle creation error", async () => {
      const mockBundle = {
        id: "bundle-1",
        bundleTypeId: "DEMONSTRATION",
      };

      const error = new Error("Database constraint violation");

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          bundle: {
            create: vi.fn().mockResolvedValue(mockBundle),
          },
          demonstration: {
            create: vi.fn().mockRejectedValue(error),
          },
        };
        return await callback(tx);
      });

      const result = await createDemonstration(undefined, { input: mockInput });

      expect(result).toEqual({
        success: false,
        message: "Error creating demonstration: Database constraint violation",
      });
    });

    it("should handle non-Error exceptions", async () => {
      const mockBundle = {
        id: "bundle-1",
        bundleTypeId: "DEMONSTRATION",
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          bundle: {
            create: vi.fn().mockResolvedValue(mockBundle),
          },
          demonstration: {
            create: vi.fn().mockRejectedValue("String error"),
          },
        };
        return await callback(tx);
      });

      const result = await createDemonstration(undefined, { input: mockInput });

      expect(result).toEqual({
        success: false,
        message: "Error creating demonstration: String error",
      });
    });

    it("should create bundle and demonstration with correct data", async () => {
      const mockBundle = {
        id: "bundle-1",
        bundleTypeId: "DEMONSTRATION",
      };

      let capturedBundleData: any;
      let capturedDemoData: any;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          bundle: {
            create: vi.fn().mockImplementation((data) => {
              capturedBundleData = data;
              return Promise.resolve(mockBundle);
            }),
          },
          demonstration: {
            create: vi.fn().mockImplementation((data) => {
              capturedDemoData = data;
              return Promise.resolve({});
            }),
          },
        };
        return await callback(tx);
      });

      await createDemonstration(undefined, { input: mockInput });

      expect(capturedBundleData).toEqual({
        data: {
          bundleTypeId: "DEMONSTRATION",
        },
      });

      expect(capturedDemoData).toEqual({
        data: {
          id: "bundle-1",
          bundleTypeId: "DEMONSTRATION",
          name: "Test Demo",
          description: "Test Description",
          cmcsDivisionId: "Division of System Reform Demonstrations",
          signatureLevelId: "OA",
          statusId: "Pre-Submission",
          stateId: "CA",
          currentPhaseId: "Concept",
          projectOfficerUserId: "user-1",
        },
      });
    });
  });

  describe("updateDemonstration", () => {
    const mockInput = {
      name: "Updated Demo",
      description: "Updated Description",
      effectiveDate: new Date("2024-01-01"),
      expirationDate: new Date("2024-12-31"),
      cmcsDivision: "Division of Eligibility and Coverage Demonstrations",
      signatureLevel: "OCD",
      status: "Under Review",
      currentPhase: "State Application",
      stateId: "TX",
      projectOfficerUserId: "user-2",
    };

    it("should update demonstration successfully", async () => {
      const mockUpdatedDemo = {
        id: "demo-1",
        ...mockInput,
      };

      mockPrisma.demonstration.update.mockResolvedValue(mockUpdatedDemo);

      const result = await updateDemonstration(undefined, {
        id: "demo-1",
        input: mockInput,
      });

      expect(checkOptionalNotNullFields).toHaveBeenCalledWith(
        ["name", "status", "currentPhase", "stateId", "projectOfficerUserId"],
        mockInput
      );

      expect(mockPrisma.demonstration.update).toHaveBeenCalledWith({
        where: { id: "demo-1" },
        data: {
          name: "Updated Demo",
          description: "Updated Description",
          effectiveDate: new Date("2024-01-01"),
          expirationDate: new Date("2024-12-31"),
          cmcsDivisionId: "Division of Eligibility and Coverage Demonstrations",
          signatureLevelId: "OCD",
          statusId: "Under Review",
          currentPhaseId: "State Application",
          stateId: "TX",
          projectOfficerUserId: "user-2",
        },
      });

      expect(result).toEqual(mockUpdatedDemo);
    });

    it("should handle partial updates", async () => {
      const partialInput = {
        name: "Partially Updated Demo",
        description: "New description",
      };

      const mockUpdatedDemo = {
        id: "demo-1",
        name: "Partially Updated Demo",
        description: "New description",
      };

      mockPrisma.demonstration.update.mockResolvedValue(mockUpdatedDemo);

      const result = await updateDemonstration(undefined, {
        id: "demo-1",
        input: partialInput,
      });

      expect(mockPrisma.demonstration.update).toHaveBeenCalledWith({
        where: { id: "demo-1" },
        data: {
          name: "Partially Updated Demo",
          description: "New description",
          effectiveDate: undefined,
          expirationDate: undefined,
          cmcsDivisionId: undefined,
          signatureLevelId: undefined,
          statusId: undefined,
          currentPhaseId: undefined,
          stateId: undefined,
          projectOfficerUserId: undefined,
        },
      });

      expect(result).toEqual(mockUpdatedDemo);
    });
  });

  describe("demonstrationResolvers", () => {
    describe("Query resolvers", () => {
      it("should have demonstration query resolver", () => {
        expect(demonstrationResolvers.Query.demonstration).toBe(getDemonstration);
      });

      it("should have demonstrations query resolver", () => {
        expect(demonstrationResolvers.Query.demonstrations).toBe(getManyDemonstrations);
      });
    });

    describe("Mutation resolvers", () => {
      it("should have createDemonstration mutation resolver", () => {
        expect(demonstrationResolvers.Mutation.createDemonstration).toBe(createDemonstration);
      });

      it("should have updateDemonstration mutation resolver", () => {
        expect(demonstrationResolvers.Mutation.updateDemonstration).toBe(updateDemonstration);
      });

      it("should delete demonstration", async () => {
        const mockDeletedDemo = { id: "demo-1", name: "Deleted Demo" };
        mockPrisma.demonstration.delete.mockResolvedValue(mockDeletedDemo);

        const result = await demonstrationResolvers.Mutation.deleteDemonstration(
          undefined,
          { id: "demo-1" }
        );

        expect(mockPrisma.demonstration.delete).toHaveBeenCalledWith({
          where: { id: "demo-1" },
        });
        expect(result).toEqual(mockDeletedDemo);
      });
    });

    describe("Demonstration field resolvers", () => {
      const mockDemonstration: Demonstration = {
        id: "demo-1",
        bundleTypeId: "DEMONSTRATION",
        name: "Test Demo",
        description: "Test Description",
        effectiveDate: new Date("2024-01-01"),
        expirationDate: new Date("2024-12-31"),
        cmcsDivisionId: "Division of System Reform Demonstrations",
        signatureLevelId: "OA",
        statusId: "Under Review",
        stateId: "CA",
        currentPhaseId: "State Application",
        projectOfficerUserId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it("should resolve state", async () => {
        const mockState = { id: "CA", name: "California" };
        mockPrisma.state.findUnique.mockResolvedValue(mockState);

        const result = await demonstrationResolvers.Demonstration.state(mockDemonstration);

        expect(mockPrisma.state.findUnique).toHaveBeenCalledWith({
          where: { id: "CA" },
        });
        expect(result).toEqual(mockState);
      });

      it("should resolve projectOfficer", async () => {
        const mockUser = { id: "user-1", name: "John Doe" };
        (findUniqueUser as any).mockResolvedValue(mockUser);

        const result = await demonstrationResolvers.Demonstration.projectOfficer(mockDemonstration);

        expect(findUniqueUser).toHaveBeenCalledWith("user-1");
        expect(result).toEqual(mockUser);
      });

      it("should resolve documents", async () => {
        const mockDocuments = [
          { id: "doc-1", title: "Document 1" },
          { id: "doc-2", title: "Document 2" },
        ];
        mockPrisma.document.findMany.mockResolvedValue(mockDocuments);

        const result = await demonstrationResolvers.Demonstration.documents(mockDemonstration);

        expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
          where: { bundleId: "demo-1" },
        });
        expect(result).toEqual(mockDocuments);
      });

      it("should resolve amendments", async () => {
        const mockAmendments = [
          { id: "amend-1", name: "Amendment 1" },
          { id: "amend-2", name: "Amendment 2" },
        ];
        mockPrisma.modification.findMany.mockResolvedValue(mockAmendments);

        const result = await demonstrationResolvers.Demonstration.amendments(mockDemonstration);

        expect(mockPrisma.modification.findMany).toHaveBeenCalledWith({
          where: {
            demonstrationId: "demo-1",
            bundleTypeId: "AMENDMENT",
          },
        });
        expect(result).toEqual(mockAmendments);
      });

      it("should resolve extensions", async () => {
        const mockExtensions = [
          { id: "ext-1", name: "Extension 1" },
          { id: "ext-2", name: "Extension 2" },
        ];
        mockPrisma.modification.findMany.mockResolvedValue(mockExtensions);

        const result = await demonstrationResolvers.Demonstration.extensions(mockDemonstration);

        expect(mockPrisma.modification.findMany).toHaveBeenCalledWith({
          where: {
            demonstrationId: "demo-1",
            bundleTypeId: "EXTENSION",
          },
        });
        expect(result).toEqual(mockExtensions);
      });

      it("should resolve cmcsDivision", async () => {
        const result = await demonstrationResolvers.Demonstration.cmcsDivision(mockDemonstration);

        expect(result).toBe("Division of System Reform Demonstrations");
      });

      it("should resolve signatureLevel", async () => {
        const result = await demonstrationResolvers.Demonstration.signatureLevel(mockDemonstration);

        expect(result).toBe("OA");
      });

      it("should resolve currentPhase", async () => {
        const result = await demonstrationResolvers.Demonstration.currentPhase(mockDemonstration);

        expect(result).toBe("State Application");
      });

      it("should resolve status", () => {
        expect(demonstrationResolvers.Demonstration.status).toBe(resolveBundleStatus);
      });

      it("should resolve phases", async () => {
        const mockPhases = [
          { id: "phase-1", name: "Phase 1" },
          { id: "phase-2", name: "Phase 2" },
        ];
        mockPrisma.bundlePhase.findMany.mockResolvedValue(mockPhases);

        const result = await demonstrationResolvers.Demonstration.phases(mockDemonstration);

        expect(mockPrisma.bundlePhase.findMany).toHaveBeenCalledWith({
          where: { bundleId: "demo-1" },
        });
        expect(result).toEqual(mockPhases);
      });
    });
  });

  describe("error handling", () => {
    it("should handle database connection errors in getDemonstration", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.demonstration.findUnique.mockRejectedValue(dbError);

      await expect(getDemonstration(undefined, { id: "demo-1" })).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle database connection errors in getManyDemonstrations", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.demonstration.findMany.mockRejectedValue(dbError);

      await expect(getManyDemonstrations()).rejects.toThrow("Database connection failed");
    });

    it("should handle database connection errors in updateDemonstration", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.demonstration.update.mockRejectedValue(dbError);

      await expect(
        updateDemonstration(undefined, {
          id: "demo-1",
          input: { name: "Updated" },
        })
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle transaction rollback errors", async () => {
      const transactionError = new Error("Transaction failed");
      mockPrisma.$transaction.mockRejectedValue(transactionError);

      await expect(
        createDemonstration(undefined, {
          input: {
            name: "Test Demo",
            description: "Test Description",
            cmcsDivision: "Division of System Reform Demonstrations",
            signatureLevel: "OA",
            stateId: "CA",
            projectOfficerUserId: "user-1",
          },
        })
      ).rejects.toThrow("Transaction failed");
    });
  });

  describe("edge cases", () => {
    it("should handle null/undefined field values in update", async () => {
      const inputWithNulls = {
        name: "Test Demo",
        description: null,
        effectiveDate: undefined,
        cmcsDivision: null,
      };

      const mockUpdatedDemo = { id: "demo-1", name: "Test Demo" };
      mockPrisma.demonstration.update.mockResolvedValue(mockUpdatedDemo);

      const result = await updateDemonstration(undefined, {
        id: "demo-1",
        input: inputWithNulls,
      });

      expect(mockPrisma.demonstration.update).toHaveBeenCalledWith({
        where: { id: "demo-1" },
        data: {
          name: "Test Demo",
          description: null,
          effectiveDate: undefined,
          expirationDate: undefined,
          cmcsDivisionId: null,
          signatureLevelId: undefined,
          statusId: undefined,
          currentPhaseId: undefined,
          stateId: undefined,
          projectOfficerUserId: undefined,
        },
      });

      expect(result).toEqual(mockUpdatedDemo);
    });

    it("should handle empty arrays in field resolvers", async () => {
      const mockDemonstration: Demonstration = {
        id: "demo-1",
        bundleTypeId: "DEMONSTRATION",
        name: "Test Demo",
        description: "Test Description",
        effectiveDate: null,
        expirationDate: null,
        cmcsDivisionId: null,
        signatureLevelId: null,
        statusId: "Pre-Submission",
        stateId: "CA",
        currentPhaseId: "Concept",
        projectOfficerUserId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.modification.findMany.mockResolvedValue([]);
      mockPrisma.bundlePhase.findMany.mockResolvedValue([]);

      const documentsResult = await demonstrationResolvers.Demonstration.documents(mockDemonstration);
      const amendmentsResult = await demonstrationResolvers.Demonstration.amendments(mockDemonstration);
      const extensionsResult = await demonstrationResolvers.Demonstration.extensions(mockDemonstration);
      const phasesResult = await demonstrationResolvers.Demonstration.phases(mockDemonstration);

      expect(documentsResult).toEqual([]);
      expect(amendmentsResult).toEqual([]);
      expect(extensionsResult).toEqual([]);
      expect(phasesResult).toEqual([]);
    });
  });
});