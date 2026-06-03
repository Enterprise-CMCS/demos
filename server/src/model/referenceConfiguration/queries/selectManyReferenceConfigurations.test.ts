// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types

// Functions under test
import { selectManyReferenceConfigurations } from "./selectManyReferenceConfigurations";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));
import { prisma } from "../../../prismaClient";

describe("selectManyReferenceConfigurations", () => {
  const regularMocks = {
    referenceConfiguration: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    referenceConfiguration: {
      findMany: regularMocks.referenceConfiguration.findMany,
    },
  };
  const transactionMocks = {
    referenceConfiguration: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    referenceConfiguration: {
      findMany: transactionMocks.referenceConfiguration.findMany,
    },
  } as any;

  const testReferenceConfigurationId = "reference-configuration-1";
  const testWhere = {
    id: testReferenceConfigurationId,
  };
  const expectedCall = {
    where: testWhere,
    select: {
      id: true,
      statusId: true,
      reference: {
        select: {
          id: true,
          name: true,
          description: true,
          referenceTagAssignments: {
            select: {
              tag: {
                select: {
                  tagNameId: true,
                  statusId: true,
                },
              },
            },
          },
          referenceDemonstrationTypes: {
            select: {
              tag: {
                select: {
                  tagNameId: true,
                  statusId: true,
                },
              },
            },
          },
          s3Path: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      referenceAgreement: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should get reference configurations from the database directly if no transaction is given", async () => {
    await selectManyReferenceConfigurations(testWhere);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.referenceConfiguration.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.referenceConfiguration.findMany).not.toHaveBeenCalled();
  });

  it("should get reference configurations via a transaction if one is given", async () => {
    await selectManyReferenceConfigurations(testWhere, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.referenceConfiguration.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.referenceConfiguration.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});
