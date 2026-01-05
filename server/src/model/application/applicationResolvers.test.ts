import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import {
  getApplication,
  getManyApplications,
  deleteApplication,
  resolveApplicationDocuments,
  resolveApplicationCurrentPhaseName,
  resolveApplicationStatus,
  __resolveApplicationType,
  resolveApplicationPhases,
  PrismaApplication,
  resolveApplicationClearanceLevel,
  setApplicationClearanceLevel,
} from "./applicationResolvers.js";
import { ApplicationStatus, ApplicationType, PhaseName, ClearanceLevel } from "../../types.js";

// Mock imports
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

describe("applicationResolvers", () => {
  const regularMocks = {
    document: {
      findMany: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    applicationPhase: {
      findMany: vi.fn(),
    },
    demonstration: {
      update: vi.fn(),
    },
    amendment: {
      update: vi.fn(),
    },
    extension: {
      update: vi.fn(),
    },
  };
  const transactionMocks = {
    application: {
      delete: vi.fn(),
    },
    demonstration: {
      delete: vi.fn(),
    },
    amendment: {
      delete: vi.fn(),
    },
    extension: {
      delete: vi.fn(),
    },
  };
  const mockTransaction = {
    application: {
      delete: transactionMocks.application.delete,
    },
    demonstration: {
      delete: transactionMocks.demonstration.delete,
    },
    amendment: {
      delete: transactionMocks.amendment.delete,
    },
    extension: {
      delete: transactionMocks.extension.delete,
    },
  };
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
    document: {
      findMany: regularMocks.document.findMany,
    },
    application: {
      findUnique: regularMocks.application.findUnique,
      findMany: regularMocks.application.findMany,
    },
    applicationPhase: {
      findMany: regularMocks.applicationPhase.findMany,
    },
    demonstration: {
      update: regularMocks.demonstration.update,
    },
    amendment: {
      update: regularMocks.amendment.update,
    },
    extension: {
      update: regularMocks.extension.update,
    },
  };
  const testApplicationId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testDemonstrationApplicationTypeId: ApplicationType = "Demonstration";
  const testAmendmentApplicationTypeId: ApplicationType = "Amendment";
  const testExtensionApplicationTypeId: ApplicationType = "Extension";
  const testPhaseId: PhaseName = "Application Intake";
  const testApplicationStatusId: ApplicationStatus = "Approved";
  const testApplicationClearanceLevelId = "COMMs";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    // Note: this line is necessary because resetAllMocks() clears the implementation each time
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  describe("getApplication", () => {
    it("should find the requested application", async () => {
      mockPrismaClient.application.findUnique.mockResolvedValue("Just a non-null response");
      const expectedCall = {
        where: {
          id: testApplicationId,
          applicationTypeId: testDemonstrationApplicationTypeId,
        },
        include: {
          demonstration: true,
          amendment: true,
          extension: true,
        },
      };
      await getApplication(testApplicationId, testDemonstrationApplicationTypeId);
      expect(regularMocks.application.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });

    it("should throw if nothing is returned", async () => {
      mockPrismaClient.application.findUnique.mockResolvedValue(null);
      const expectedCall = {
        where: {
          id: testApplicationId,
          applicationTypeId: testDemonstrationApplicationTypeId,
        },
        include: {
          demonstration: true,
          amendment: true,
          extension: true,
        },
      };
      await expect(
        getApplication(testApplicationId, testDemonstrationApplicationTypeId)
      ).rejects.toThrowError(
        `Application of type ${testDemonstrationApplicationTypeId} with ID ${testApplicationId} not found`
      );
      expect(regularMocks.application.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });

  describe("getManyApplications", () => {
    it("should find the requested application type", async () => {
      mockPrismaClient.application.findMany.mockResolvedValue("Just a non-null response");
      const expectedCall = {
        where: {
          applicationTypeId: testDemonstrationApplicationTypeId,
        },
        include: {
          demonstration: true,
          amendment: true,
          extension: true,
        },
      };
      await getManyApplications(testDemonstrationApplicationTypeId);
      expect(regularMocks.application.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });

    it("should return [] if nothing is returned", async () => {
      mockPrismaClient.application.findUnique.mockResolvedValue(null);
      const expectedCall = {
        where: {
          applicationTypeId: testDemonstrationApplicationTypeId,
        },
        include: {
          demonstration: true,
          amendment: true,
          extension: true,
        },
      };
      const result = await getManyApplications(testDemonstrationApplicationTypeId);
      expect(regularMocks.application.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(result).toEqual([]);
    });
  });

  describe("deleteApplication", () => {
    it("should delete the application and then the demonstration in a transaction", async () => {
      const expectedCall = {
        where: {
          id: testApplicationId,
        },
      };
      await deleteApplication(testApplicationId, testDemonstrationApplicationTypeId);
      expect(transactionMocks.application.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(transactionMocks.demonstration.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(transactionMocks.amendment.delete).not.toHaveBeenCalled();
      expect(transactionMocks.extension.delete).not.toHaveBeenCalled();
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should delete the application and then the amendment in a transaction", async () => {
      const expectedCall = {
        where: {
          id: testApplicationId,
        },
      };
      await deleteApplication(testApplicationId, testAmendmentApplicationTypeId);
      expect(transactionMocks.application.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(transactionMocks.demonstration.delete).not.toHaveBeenCalled();
      expect(transactionMocks.amendment.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(transactionMocks.extension.delete).not.toHaveBeenCalled();
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should delete the application and then the extension in a transaction", async () => {
      const expectedCall = {
        where: {
          id: testApplicationId,
        },
      };
      await deleteApplication(testApplicationId, testExtensionApplicationTypeId);
      expect(transactionMocks.application.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(transactionMocks.demonstration.delete).not.toHaveBeenCalled();
      expect(transactionMocks.amendment.delete).not.toHaveBeenCalled();
      expect(transactionMocks.extension.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should properly handle failures when doing a delete", async () => {
      const testError = new Error("Database connection failed");
      transactionMocks.application.delete.mockRejectedValueOnce(testError);
      const expectedCall = {
        where: {
          id: testApplicationId,
        },
      };
      await expect(
        deleteApplication(testApplicationId, testDemonstrationApplicationTypeId)
      ).rejects.toThrowError(testHandlePrismaError);
      expect(transactionMocks.application.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(transactionMocks.demonstration.delete).not.toHaveBeenCalled();
      expect(transactionMocks.amendment.delete).not.toHaveBeenCalled();
      expect(transactionMocks.extension.delete).not.toHaveBeenCalled();
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
    });
  });

  describe("resolveApplicationDocuments", () => {
    it("should look up the relevant documents", async () => {
      const input: Partial<PrismaApplication> = {
        id: testApplicationId,
      };
      const expectedCall = {
        where: {
          applicationId: testApplicationId,
        },
      };
      await resolveApplicationDocuments(input as PrismaApplication);
      expect(regularMocks.document.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });

  describe("resolveApplicationCurrentPhaseName", () => {
    it("should resolve the current phase name", async () => {
      const input: Partial<PrismaApplication> = {
        currentPhaseId: testPhaseId,
      };
      const result = resolveApplicationCurrentPhaseName(input as PrismaApplication);
      expect(result).toBe(testPhaseId);
    });
  });

  describe("resolveApplicationStatus", () => {
    it("should resolve the current application status", async () => {
      const input: Partial<PrismaApplication> = {
        statusId: testApplicationStatusId,
      };
      const result = resolveApplicationStatus(input as PrismaApplication);
      expect(result).toBe(testApplicationStatusId);
    });
  });

  describe("__resolveApplicationType", () => {
    it("should resolve the application type", async () => {
      const input: Partial<PrismaApplication> = {
        applicationTypeId: testDemonstrationApplicationTypeId,
      };
      const result = __resolveApplicationType(input as PrismaApplication);
      expect(result).toBe(testDemonstrationApplicationTypeId);
    });
  });

  describe("resolveApplicationPhases", () => {
    it("should resolve the application phases", async () => {
      const input: Partial<PrismaApplication> = {
        id: testApplicationId,
      };
      const expectedCall = {
        where: {
          applicationId: testApplicationId,
        },
      };
      await resolveApplicationPhases(input as PrismaApplication);
      expect(regularMocks.applicationPhase.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });

  describe("resolveApplicationClearanceLevel", () => {
    it("should resolve the current application clearance level", async () => {
      const input: Partial<PrismaApplication> = {
        clearanceLevelId: testApplicationClearanceLevelId,
      };
      const result = resolveApplicationClearanceLevel(input as PrismaApplication);
      expect(result).toBe(testApplicationClearanceLevelId);
    });
  });

  describe("updateApplicationClearanceLevel", () => {
    const testClearanceLevel: ClearanceLevel = "CMS (OSORA)";
    const testUpdatedDemonstration = {
      id: testApplicationId,
      applicationTypeId: testDemonstrationApplicationTypeId,
      clearanceLevelId: testClearanceLevel,
    };
    const testUpdatedAmendment = {
      id: testApplicationId,
      applicationTypeId: testAmendmentApplicationTypeId,
      clearanceLevelId: testClearanceLevel,
    };
    const testUpdatedExtension = {
      id: testApplicationId,
      applicationTypeId: testExtensionApplicationTypeId,
      clearanceLevelId: testClearanceLevel,
    };

    it("should update clearance level for a Demonstration", async () => {
      const mockApplication = {
        id: testApplicationId,
        applicationTypeId: testDemonstrationApplicationTypeId,
        demonstration: {
          id: testApplicationId,
          applicationTypeId: testDemonstrationApplicationTypeId,
        },
        amendment: null,
        extension: null,
      };
      mockPrismaClient.application.findUnique.mockResolvedValue(mockApplication);
      regularMocks.demonstration.update.mockResolvedValue(testUpdatedDemonstration);

      const input = {
        applicationId: testApplicationId,
        clearanceLevel: testClearanceLevel,
      };

      const result = await setApplicationClearanceLevel(undefined, { input });

      expect(regularMocks.demonstration.update).toHaveBeenCalledExactlyOnceWith({
        where: { id: testApplicationId },
        data: { clearanceLevelId: testClearanceLevel },
      });
      expect(regularMocks.amendment.update).not.toHaveBeenCalled();
      expect(regularMocks.extension.update).not.toHaveBeenCalled();
      expect(result).toEqual(testUpdatedDemonstration);
    });

    it("should update clearance level for an Amendment", async () => {
      const mockApplication = {
        id: testApplicationId,
        applicationTypeId: testAmendmentApplicationTypeId,
        demonstration: null,
        amendment: {
          id: testApplicationId,
          applicationTypeId: testAmendmentApplicationTypeId,
        },
        extension: null,
      };
      mockPrismaClient.application.findUnique.mockResolvedValue(mockApplication);
      regularMocks.amendment.update.mockResolvedValue(testUpdatedAmendment);

      const input = {
        applicationId: testApplicationId,
        clearanceLevel: testClearanceLevel,
      };

      const result = await setApplicationClearanceLevel(undefined, { input });

      expect(regularMocks.amendment.update).toHaveBeenCalledExactlyOnceWith({
        where: { id: testApplicationId },
        data: { clearanceLevelId: testClearanceLevel },
      });
      expect(regularMocks.demonstration.update).not.toHaveBeenCalled();
      expect(regularMocks.extension.update).not.toHaveBeenCalled();
      expect(result).toEqual(testUpdatedAmendment);
    });

    it("should update clearance level for an Extension", async () => {
      const mockApplication = {
        id: testApplicationId,
        applicationTypeId: testExtensionApplicationTypeId,
        demonstration: null,
        amendment: null,
        extension: {
          id: testApplicationId,
          applicationTypeId: testExtensionApplicationTypeId,
        },
      };
      mockPrismaClient.application.findUnique.mockResolvedValue(mockApplication);
      regularMocks.extension.update.mockResolvedValue(testUpdatedExtension);

      const input = {
        applicationId: testApplicationId,
        clearanceLevel: testClearanceLevel,
      };

      const result = await setApplicationClearanceLevel(undefined, { input });

      expect(regularMocks.extension.update).toHaveBeenCalledExactlyOnceWith({
        where: { id: testApplicationId },
        data: { clearanceLevelId: testClearanceLevel },
      });
      expect(regularMocks.demonstration.update).not.toHaveBeenCalled();
      expect(regularMocks.amendment.update).not.toHaveBeenCalled();
      expect(result).toEqual(testUpdatedExtension);
    });

    it("should handle errors when updating clearance level", async () => {
      const mockApplication = {
        id: testApplicationId,
        applicationTypeId: testDemonstrationApplicationTypeId,
        demonstration: {
          id: testApplicationId,
          applicationTypeId: testDemonstrationApplicationTypeId,
        },
        amendment: null,
        extension: null,
      };
      mockPrismaClient.application.findUnique.mockResolvedValue(mockApplication);
      const testError = new Error("Database update failed");
      regularMocks.demonstration.update.mockRejectedValueOnce(testError);

      const input = {
        applicationId: testApplicationId,
        clearanceLevel: testClearanceLevel,
      };

      await expect(setApplicationClearanceLevel(undefined, { input })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
    });

    it("should handle errors when application is not found", async () => {
      mockPrismaClient.application.findUnique.mockResolvedValue(null);

      const input = {
        applicationId: testApplicationId,
        clearanceLevel: testClearanceLevel,
      };

      await expect(setApplicationClearanceLevel(undefined, { input })).rejects.toThrowError();
      expect(regularMocks.demonstration.update).not.toHaveBeenCalled();
      expect(regularMocks.amendment.update).not.toHaveBeenCalled();
      expect(regularMocks.extension.update).not.toHaveBeenCalled();
    });
  });
});
