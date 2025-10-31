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
} from "./applicationResolvers.js";
import { ApplicationStatus, ApplicationType, PhaseName } from "../../types.js";

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
  };
  const testApplicationId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testDemonstrationApplicationTypeId: ApplicationType = "Demonstration";
  const testAmendmentApplicationTypeId: ApplicationType = "Amendment";
  const testExtensionApplicationTypeId: ApplicationType = "Extension";
  const testPhaseId: PhaseName = "Application Intake";
  const testApplicationStatusId: ApplicationStatus = "Approved";

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
      const result = getManyApplications(testDemonstrationApplicationTypeId);
      expect(regularMocks.application.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(result).resolves.toStrictEqual([]);
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
});
