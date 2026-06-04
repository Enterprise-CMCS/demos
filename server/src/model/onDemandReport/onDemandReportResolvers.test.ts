// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { ZodError } from "zod";
import { GraphQLError } from "graphql";

// Functions under test
import { onDemandReportResolvers } from "./onDemandReportResolvers";

// Mock imports
vi.mock("../../onDemandReports", () => ({
  runOnDemandReport: vi.fn(),
}));

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { runOnDemandReport } from "../../onDemandReports";
import { prisma } from "../../prismaClient";

describe("onDemandReportResolvers", () => {
  const mockPrismaClient = {} as any;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient);
  });

  describe("Mutation.generateOnDemandReport", () => {
    it("calls runOnDemandReport with the correct report type and prisma client", async () => {
      await onDemandReportResolvers.Mutation.generateOnDemandReport(undefined, {
        reportType: "Basic Test Report",
      });

      expect(runOnDemandReport).toHaveBeenCalledExactlyOnceWith(
        "Basic Test Report",
        mockPrismaClient
      );
    });

    it("throws an expected GraphQLError when runOnDemandReport throws a ZodError", async () => {
      const zodError = new ZodError([]);
      vi.mocked(runOnDemandReport).mockRejectedValue(zodError);

      try {
        await onDemandReportResolvers.Mutation.generateOnDemandReport(undefined, {
          reportType: "Basic Test Report",
        });
        throw new Error("Expected generateOnDemandReport to throw, but it did not.");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        if (error instanceof GraphQLError) {
          expect(error.message).toContain("Basic Test Report");
          expect(error.extensions.code).toBe("ON_DEMAND_REPORT_ZOD_ERROR");
        }
      }
    });

    it("re-throws non-ZodErrors without wrapping them", async () => {
      const originalError = new Error("unexpected database failure");
      vi.mocked(runOnDemandReport).mockRejectedValue(originalError);

      await expect(
        onDemandReportResolvers.Mutation.generateOnDemandReport(undefined, {
          reportType: "Basic Test Report",
        })
      ).rejects.toThrow("unexpected database failure");
    });
  });
});
