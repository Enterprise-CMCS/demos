import { describe, it, expect, vi, beforeEach } from "vitest";
import { setPhaseState } from "./applicationPhaseResolvers.js";
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { PhaseName, PhaseStatus, SetPhaseStateInput } from "../../types.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

describe("applicationPhaseResolvers", () => {
  const mockUpsert = vi.fn();
  const mockPrismaClient = {
    applicationPhase: {
      upsert: mockUpsert,
    },
  };

  const testApplicationId = "2b5cfdff-7a4b-4560-a2f9-158181faaa74";
  const testPhaseName: PhaseName = "Completeness";
  const testPhaseStatus: PhaseStatus = "Completed";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  describe("setPhaseState", () => {
    const input: SetPhaseStateInput = {
      applicationId: testApplicationId,
      phaseName: testPhaseName,
      phaseStatus: testPhaseStatus,
    };

    it("should upsert the phase state and return the updated row", async () => {
      const expectedResult = {
        applicationId: testApplicationId,
        phaseId: testPhaseName,
        phaseStatusId: testPhaseStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUpsert.mockResolvedValueOnce(expectedResult);

      const result = await setPhaseState(undefined, { input });

      expect(mockUpsert).toHaveBeenCalledExactlyOnceWith({
        where: {
          applicationId_phaseId: {
            applicationId: testApplicationId,
            phaseId: testPhaseName,
          },
        },
        update: {
          phaseStatusId: testPhaseStatus,
        },
        create: {
          applicationId: testApplicationId,
          phaseId: testPhaseName,
          phaseStatusId: testPhaseStatus,
        },
      });

      expect(result).toBe(expectedResult);
    });

    it("should call handlePrismaError when the upsert fails", async () => {
      const databaseError = new Error("Database unavailable");
      mockUpsert.mockRejectedValueOnce(databaseError);

      await expect(setPhaseState(undefined, { input })).rejects.toThrowError(
        testHandlePrismaError
      );

      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(databaseError);
    });
  });
});
