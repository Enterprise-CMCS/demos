import { describe, it, expect, vi, beforeEach } from "vitest";
import { getManyApplications } from "./getManyApplications";
import { ApplicationStatus, ApplicationType, PhaseName } from "../../../types";

// Mock imports
import { prisma } from "../../../prismaClient.js";

vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("getManyApplications", () => {
  const regularMocks = {
    application: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    application: {
      findMany: regularMocks.application.findMany,
    },
  };
  const testDemonstrationApplicationTypeId: ApplicationType = "Demonstration";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

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
    mockPrismaClient.application.findMany.mockResolvedValue(null);
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
