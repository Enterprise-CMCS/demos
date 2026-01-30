import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  resolveApplicationDocuments,
  resolveApplicationCurrentPhaseName,
  resolveApplicationStatus,
  resolveApplicationType,
  resolveApplicationPhases,
  resolveApplicationClearanceLevel,
  resolveApplicationTags,
} from "./applicationResolvers";
import { PrismaApplication } from ".";
import { ApplicationStatus, ApplicationType, PhaseName, Tag } from "../../types";
import { ApplicationTagAssignment as PrismaApplicationTagAssignment } from "@prisma/client";

// Mock imports
import { prisma } from "../../prismaClient.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../applicationPhase", () => ({
  getFinishedApplicationPhaseIds: vi.fn(),
}));

describe("applicationResolvers", () => {
  const regularMocks = {
    document: {
      findMany: vi.fn(),
    },
    applicationPhase: {
      findMany: vi.fn(),
    },
    applicationTagAssignment: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    document: {
      findMany: regularMocks.document.findMany,
    },
    applicationPhase: {
      findMany: regularMocks.applicationPhase.findMany,
    },
    applicationTagAssignment: {
      findMany: regularMocks.applicationTagAssignment.findMany,
    },
  };
  const testApplicationId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testDemonstrationApplicationTypeId: ApplicationType = "Demonstration";
  const testPhaseId: PhaseName = "Application Intake";
  const testApplicationStatusId: ApplicationStatus = "Approved";
  const testApplicationClearanceLevelId = "COMMs";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
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

  describe("resolveApplicationType", () => {
    it("should resolve the application type", async () => {
      const input: Partial<PrismaApplication> = {
        applicationTypeId: testDemonstrationApplicationTypeId,
      };
      const result = resolveApplicationType(input as PrismaApplication);
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

  describe("resolveApplicationTags", () => {
    it("should resolve the tags on an application", async () => {
      // This is present just to test the map in the function
      const resolvedValue: Pick<PrismaApplicationTagAssignment, "tagId">[] = [
        {
          tagId: "Test Tag Value A",
        },
        {
          tagId: "Test Tag Value B",
        },
      ];
      regularMocks.applicationTagAssignment.findMany.mockResolvedValueOnce(resolvedValue);

      const expectedCall = {
        where: {
          applicationId: testApplicationId,
        },
        select: {
          tagId: true,
        },
      };
      const expectedResult: Tag[] = ["Test Tag Value A", "Test Tag Value B"];
      const input: Partial<PrismaApplication> = {
        id: testApplicationId,
      };

      const result = await resolveApplicationTags(input as PrismaApplication);
      expect(regularMocks.applicationTagAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
        expectedCall
      );
      expect(result).toStrictEqual(expectedResult);
    });
  });
});
