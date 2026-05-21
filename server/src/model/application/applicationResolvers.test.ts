import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveApplicationType, PrismaApplication } from ".";
import { ApplicationType } from "../../types";

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
  const testDemonstrationApplicationTypeId: ApplicationType = "Demonstration";

  beforeEach(() => {
    vi.resetAllMocks();
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
});
