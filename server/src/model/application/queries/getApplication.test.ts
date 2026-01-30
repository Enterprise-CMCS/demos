import { describe, it, expect, vi, beforeEach } from "vitest";
import { getApplication } from "./getApplication";
import { ApplicationStatus, ApplicationType, PhaseName } from "../../../types.js";

// Mock imports
import { prisma } from "../../../prismaClient.js";

vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("getApplication", () => {
  const regularMocks = {
    application: {
      findUnique: vi.fn(),
    },
  };
  const mockPrismaClient = {
    application: {
      findUnique: regularMocks.application.findUnique,
    },
  };
  const testApplicationId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testDemonstrationApplicationTypeId: ApplicationType = "Demonstration";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

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
