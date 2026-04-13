// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types

// Functions under test
import { getDemonstrationTypeAssignments } from "./getDemonstrationTypeAssignments";

// Mock imports
vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient.js";

describe("getDemonstrationTypeAssignments", () => {
  const testWhereStatement = { demonstrationId: "abc123" };
  const expectedCall = {
    where: testWhereStatement,
  };

  const regularMocks = {
    demonstrationTypeTagAssignment: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    demonstrationTypeTagAssignment: {
      findMany: regularMocks.demonstrationTypeTagAssignment.findMany,
    },
  };
  const transactionMocks = {
    demonstrationTypeTagAssignment: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    demonstrationTypeTagAssignment: {
      findMany: transactionMocks.demonstrationTypeTagAssignment.findMany,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should not filter if nothing is passed to the function", async () => {
    await getDemonstrationTypeAssignments();
    expect(regularMocks.demonstrationTypeTagAssignment.findMany).toHaveBeenCalledExactlyOnceWith({
      where: {},
    });
    expect(transactionMocks.demonstrationTypeTagAssignment.findMany).not.toHaveBeenCalled();
  });

  it("should use a transaction if it is passed, even if not filtering", async () => {
    await getDemonstrationTypeAssignments({}, mockTransaction);
    expect(regularMocks.demonstrationTypeTagAssignment.findMany).not.toHaveBeenCalled();
    expect(
      transactionMocks.demonstrationTypeTagAssignment.findMany
    ).toHaveBeenCalledExactlyOnceWith({ where: {} });
  });

  it("should get the deliverables directly from the database directly if no transaction is given", async () => {
    await getDemonstrationTypeAssignments(testWhereStatement);
    expect(regularMocks.demonstrationTypeTagAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.demonstrationTypeTagAssignment.findMany).not.toHaveBeenCalled();
  });

  it("should get the deliverables via a transaction if one is given", async () => {
    await getDemonstrationTypeAssignments(testWhereStatement, mockTransaction);
    expect(regularMocks.demonstrationTypeTagAssignment.findMany).not.toHaveBeenCalled();
    expect(
      transactionMocks.demonstrationTypeTagAssignment.findMany
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
