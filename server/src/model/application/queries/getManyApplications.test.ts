import { describe, it, expect, vi, beforeEach } from "vitest";
import { getManyApplications } from "./getManyApplications";
import { ApplicationType } from "../../../types";

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
  const transactionMocks = {
    application: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    application: {
      findMany: transactionMocks.application.findMany,
    },
  } as any;
  const mockPrismaClient = {
    application: {
      findMany: regularMocks.application.findMany,
    },
  };
  const testDemonstrationApplicationTypeId: ApplicationType = "Demonstration";
  const testAmendmentApplicationTypeId: ApplicationType = "Amendment";
  const testExtensionApplicationTypeId: ApplicationType = "Extension";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should find the requested application type if no transaction is passed", async () => {
    mockPrismaClient.application.findMany.mockResolvedValue([
      { applicationId: "abc", demonstration: { id: "abc", value: "Just some test" } },
    ]);
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

  it("should find the requested application type if a transaction is passed", async () => {
    mockTransaction.application.findMany.mockResolvedValue([
      { applicationId: "abc", demonstration: { id: "abc", value: "Just some test" } },
    ]);
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
    const result = await getManyApplications(testDemonstrationApplicationTypeId, mockTransaction);

    expect(transactionMocks.application.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should return demonstration if it is populated", async () => {
    mockPrismaClient.application.findMany.mockResolvedValue([
      { applicationId: "abc", demonstration: { id: "abc", value: "Just some test" } },
    ]);
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
    expect(result).toEqual([{ id: "abc", value: "Just some test" }]);
  });

  it("should return amendment if it is populated", async () => {
    mockPrismaClient.application.findMany.mockResolvedValue([
      { applicationId: "abc", amendment: { id: "abc", value: "Just some test" } },
    ]);
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
    expect(result).toEqual([{ id: "abc", value: "Just some test" }]);
  });

  it("should return extension if it is populated", async () => {
    mockPrismaClient.application.findMany.mockResolvedValue([
      { applicationId: "abc", extension: { id: "abc", value: "Just some test" } },
    ]);
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
    expect(result).toEqual([{ id: "abc", value: "Just some test" }]);
  });

  it("should return [] if nothing is returned", async () => {
    mockPrismaClient.application.findMany.mockResolvedValue([]);
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
