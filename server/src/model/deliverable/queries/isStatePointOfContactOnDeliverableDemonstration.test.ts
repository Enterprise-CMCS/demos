// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { Role } from "../../../types";
import { IsStatePointOfContactOnDeliverableDemonstrationResult } from "./isStatePointOfContactOnDeliverableDemonstration";

// Functions under test
import { isStatePointOfContactOnDeliverableDemonstration } from "./isStatePointOfContactOnDeliverableDemonstration";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("isStatePointOfContactOnDeliverableDemonstration", () => {
  const testDeliverableId = "4e1e2c92-ebdb-481d-b99a-9e15e7b852bc";
  const testDemonstrationId = "7a91a5a6-a88b-4990-8434-093778a08521";
  const testPersonId = "2ec04327-18c8-42da-ae5c-e9260bacc441";
  const expectedCall = {
    where: { id: testDeliverableId },
    select: {
      id: true,
      demonstration: {
        select: {
          id: true,
          demonstrationRoleAssignments: {
            where: {
              roleId: "State Point of Contact" satisfies Role,
              personId: testPersonId,
            },
            select: {
              personId: true,
            },
          },
        },
      },
    },
  };

  // Mock results and client
  const regularMocks = {
    deliverable: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverable: {
      findUniqueOrThrow: regularMocks.deliverable.findUniqueOrThrow,
    },
  };

  const transactionMocks = {
    deliverable: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverable: {
      findUniqueOrThrow: transactionMocks.deliverable.findUniqueOrThrow,
    },
  } as any;

  const mockQueryResultsWithAssignmentRecord: IsStatePointOfContactOnDeliverableDemonstrationResult =
    {
      id: testDeliverableId,
      demonstration: {
        id: testDemonstrationId,
        demonstrationRoleAssignments: [
          {
            personId: testPersonId,
          },
        ],
      },
    };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(regularMocks.deliverable.findUniqueOrThrow).mockResolvedValue(
      mockQueryResultsWithAssignmentRecord
    );
    vi.mocked(transactionMocks.deliverable.findUniqueOrThrow).mockResolvedValue(
      mockQueryResultsWithAssignmentRecord
    );
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should run the query using new client if no transaction is given", async () => {
    const result = await isStatePointOfContactOnDeliverableDemonstration(
      testDeliverableId,
      testPersonId
    );
    expect(result).toBe(true);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.deliverable.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverable.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("should run the query using a transaction if one is given", async () => {
    const result = await isStatePointOfContactOnDeliverableDemonstration(
      testDeliverableId,
      testPersonId,
      mockTransaction
    );
    expect(result).toBe(true);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.deliverable.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transactionMocks.deliverable.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("should return false if no assignments are found", async () => {
    const mockQueryResultsWithoutAssignmentRecord: IsStatePointOfContactOnDeliverableDemonstrationResult =
      {
        id: testDeliverableId,
        demonstration: {
          id: testDemonstrationId,
          demonstrationRoleAssignments: [],
        },
      };
    vi.mocked(transactionMocks.deliverable.findUniqueOrThrow).mockResolvedValue(
      mockQueryResultsWithoutAssignmentRecord
    );

    const result = await isStatePointOfContactOnDeliverableDemonstration(
      testDeliverableId,
      testPersonId,
      mockTransaction
    );
    expect(result).toBe(false);
  });
});
