// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
// None

// Functions under test
import { callFederalCommentPhaseUpdateProcedure } from "./callFederalCommentPhaseUpdateProcedure";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../prismaClient";

describe("callFederalCommentPhaseUpdateProcedure", () => {
  const mockPrismaClient = {
    $executeRaw: vi.fn(),
  } as any;
  const testTransaction = {
    $executeRaw: vi.fn(),
  } as any;
  const testApplicationId = "test-id-1";
  const expectedCall = [
    ["CALL demos_app.update_federal_comment_phase_status(", "::UUID);"],
    testApplicationId,
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient);
  });

  it("should run the query directly against the database if no client is provided", async () => {
    await callFederalCommentPhaseUpdateProcedure(testApplicationId);

    expect(prisma).toHaveBeenCalled();
    expect(mockPrismaClient.$executeRaw).toHaveBeenCalledExactlyOnceWith(...expectedCall);
    expect(testTransaction.$executeRaw).not.toHaveBeenCalled();
  });

  it("should use a client if one is provided", async () => {
    await callFederalCommentPhaseUpdateProcedure(testApplicationId, testTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockPrismaClient.$executeRaw).not.toHaveBeenCalled();
    expect(testTransaction.$executeRaw).toHaveBeenCalledExactlyOnceWith(...expectedCall);
  });
});
