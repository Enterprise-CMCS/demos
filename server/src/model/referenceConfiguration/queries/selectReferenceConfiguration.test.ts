// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types

// Functions under test
import { selectReferenceConfiguration } from "./selectReferenceConfiguration";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));
import { prisma } from "../../../prismaClient";

describe("selectReferenceConfiguration", () => {
  const regularMocks = {
    referenceConfiguration: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    referenceConfiguration: {
      findAtMostOne: regularMocks.referenceConfiguration.findAtMostOne,
    },
  };
  const transactionMocks = {
    referenceConfiguration: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    referenceConfiguration: {
      findAtMostOne: transactionMocks.referenceConfiguration.findAtMostOne,
    },
  } as any;

  const testReferenceConfigurationId = "reference-configuration-1";
  const where = {
    id: testReferenceConfigurationId,
  };
  const expectedCall = {
    where: { id: testReferenceConfigurationId },
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

  it("should get reference configuration from the database directly if no transaction is given", async () => {
    await selectReferenceConfiguration(where);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.referenceConfiguration.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.referenceConfiguration.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get reference configuration via a transaction if one is given", async () => {
    await selectReferenceConfiguration(where, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.referenceConfiguration.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.referenceConfiguration.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});
