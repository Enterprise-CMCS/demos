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
  const mockApplicationFindUnique = vi.fn();
  const mockApplicationFindMany = vi.fn();
  const mockDocumentFindMany = vi.fn();
  const mockApplicationPhaseFindMany = vi.fn();
  const mockApplicationDelete = vi.fn();
  const mockDemonstrationDelete = vi.fn();
  const mockAmendmentDelete = vi.fn();
  const mockExtensionDelete = vi.fn();
  const mockTransaction = {
    application: {
      delete: mockApplicationDelete,
    },
    demonstration: {
      delete: mockDemonstrationDelete,
    },
    amendment: {
      delete: mockAmendmentDelete,
    },
    extension: {
      delete: mockExtensionDelete,
    },
  };
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
    document: {
      findMany: mockDocumentFindMany,
    },
    application: {
      findUnique: mockApplicationFindUnique,
      findMany: mockApplicationFindMany,
    },
    applicationPhase: {
      findMany: mockApplicationPhaseFindMany,
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
      expect(mockApplicationFindUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
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
      expect(mockApplicationFindUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
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
      expect(mockApplicationFindMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });

    it("should return null if nothing is returned", async () => {
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
      expect(mockApplicationFindMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(result).resolves.toBeNull();
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
      expect(mockApplicationDelete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(mockDemonstrationDelete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(mockAmendmentDelete).not.toHaveBeenCalled();
      expect(mockExtensionDelete).not.toHaveBeenCalled();
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should delete the application and then the amendment in a transaction", async () => {
      const expectedCall = {
        where: {
          id: testApplicationId,
        },
      };
      await deleteApplication(testApplicationId, testAmendmentApplicationTypeId);
      expect(mockApplicationDelete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(mockDemonstrationDelete).not.toHaveBeenCalled();
      expect(mockAmendmentDelete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(mockExtensionDelete).not.toHaveBeenCalled();
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should delete the application and then the extension in a transaction", async () => {
      const expectedCall = {
        where: {
          id: testApplicationId,
        },
      };
      await deleteApplication(testApplicationId, testExtensionApplicationTypeId);
      expect(mockApplicationDelete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(mockDemonstrationDelete).not.toHaveBeenCalled();
      expect(mockAmendmentDelete).not.toHaveBeenCalled();
      expect(mockExtensionDelete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should properly handle failures when doing a delete", async () => {
      const testError = new Error("Database connection failed");
      mockApplicationDelete.mockRejectedValueOnce(testError);
      const expectedCall = {
        where: {
          id: testApplicationId,
        },
      };
      await expect(
        deleteApplication(testApplicationId, testDemonstrationApplicationTypeId)
      ).rejects.toThrowError(testHandlePrismaError);
      expect(mockApplicationDelete).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(mockDemonstrationDelete).not.toHaveBeenCalled();
      expect(mockAmendmentDelete).not.toHaveBeenCalled();
      expect(mockExtensionDelete).not.toHaveBeenCalled();
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
      expect(mockDocumentFindMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
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
      expect(mockApplicationPhaseFindMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });
});
