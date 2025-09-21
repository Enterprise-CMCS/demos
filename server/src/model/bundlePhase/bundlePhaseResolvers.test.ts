import { describe, it, expect, vi, beforeEach } from "vitest";
import { BundlePhase } from "@prisma/client";

// Mock dependencies
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(() => ({
    bundlePhaseDate: {
      findMany: vi.fn(),
    },
  })),
}));

import { prisma } from "../../prismaClient.js";
import { bundlePhaseResolvers } from "./bundlePhaseResolvers";

describe("bundlePhaseResolvers", () => {
  const mockPrisma = {
    bundlePhaseDate: {
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).mockReturnValue(mockPrisma);
  });

  describe("BundlePhase field resolvers", () => {
    const mockBundlePhase: BundlePhase = {
      bundleId: "bundle-1",
      phaseId: "Concept",
      phaseStatusId: "Active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe("phase", () => {
      it("should return phaseId from parent", async () => {
        const result =
          await bundlePhaseResolvers.BundlePhase.phase(mockBundlePhase);

        expect(result).toBe("Concept");
      });

      it("should handle different phase IDs", async () => {
        const phaseIds = [
          "Concept",
          "State Application",
          "CMS Review",
          "Implementation",
          "Monitoring",
          "Extension",
        ];

        for (const phaseId of phaseIds) {
          const bundlePhase: BundlePhase = {
            ...mockBundlePhase,
            phaseId,
          };

          const result =
            await bundlePhaseResolvers.BundlePhase.phase(bundlePhase);

          expect(result).toBe(phaseId);
        }
      });

      it("should handle null phaseId", async () => {
        const bundlePhaseWithNullPhase: BundlePhase = {
          ...mockBundlePhase,
          phaseId: null as any,
        };

        const result = await bundlePhaseResolvers.BundlePhase.phase(
          bundlePhaseWithNullPhase,
        );

        expect(result).toBeNull();
      });

      it("should handle undefined phaseId", async () => {
        const bundlePhaseWithUndefinedPhase: BundlePhase = {
          ...mockBundlePhase,
          phaseId: undefined as any,
        };

        const result = await bundlePhaseResolvers.BundlePhase.phase(
          bundlePhaseWithUndefinedPhase,
        );

        expect(result).toBeUndefined();
      });

      it("should handle empty string phaseId", async () => {
        const bundlePhaseWithEmptyPhase: BundlePhase = {
          ...mockBundlePhase,
          phaseId: "",
        };

        const result = await bundlePhaseResolvers.BundlePhase.phase(
          bundlePhaseWithEmptyPhase,
        );

        expect(result).toBe("");
      });

      it("should handle special characters in phaseId", async () => {
        const specialPhaseId = "phase-with-special_chars!@#";
        const bundlePhase: BundlePhase = {
          ...mockBundlePhase,
          phaseId: specialPhaseId,
        };

        const result =
          await bundlePhaseResolvers.BundlePhase.phase(bundlePhase);

        expect(result).toBe(specialPhaseId);
      });

      it("should handle unicode characters in phaseId", async () => {
        const unicodePhaseId = "阶段-Phase-фаза";
        const bundlePhase: BundlePhase = {
          ...mockBundlePhase,
          phaseId: unicodePhaseId,
        };

        const result =
          await bundlePhaseResolvers.BundlePhase.phase(bundlePhase);

        expect(result).toBe(unicodePhaseId);
      });
    });

    describe("phaseStatus", () => {
      it("should return phaseStatusId from parent", async () => {
        const result =
          await bundlePhaseResolvers.BundlePhase.phaseStatus(mockBundlePhase);

        expect(result).toBe("Active");
      });

      it("should handle different phase status IDs", async () => {
        const phaseStatusIds = [
          "Active",
          "Inactive",
          "Pending",
          "Complete",
          "On Hold",
          "Cancelled",
        ];

        for (const phaseStatusId of phaseStatusIds) {
          const bundlePhase: BundlePhase = {
            ...mockBundlePhase,
            phaseStatusId,
          };

          const result =
            await bundlePhaseResolvers.BundlePhase.phaseStatus(bundlePhase);

          expect(result).toBe(phaseStatusId);
        }
      });

      it("should handle null phaseStatusId", async () => {
        const bundlePhaseWithNullStatus: BundlePhase = {
          ...mockBundlePhase,
          phaseStatusId: null as any,
        };

        const result = await bundlePhaseResolvers.BundlePhase.phaseStatus(
          bundlePhaseWithNullStatus,
        );

        expect(result).toBeNull();
      });

      it("should handle undefined phaseStatusId", async () => {
        const bundlePhaseWithUndefinedStatus: BundlePhase = {
          ...mockBundlePhase,
          phaseStatusId: undefined as any,
        };

        const result = await bundlePhaseResolvers.BundlePhase.phaseStatus(
          bundlePhaseWithUndefinedStatus,
        );

        expect(result).toBeUndefined();
      });

      it("should handle empty string phaseStatusId", async () => {
        const bundlePhaseWithEmptyStatus: BundlePhase = {
          ...mockBundlePhase,
          phaseStatusId: "",
        };

        const result = await bundlePhaseResolvers.BundlePhase.phaseStatus(
          bundlePhaseWithEmptyStatus,
        );

        expect(result).toBe("");
      });

      it("should handle special characters in phaseStatusId", async () => {
        const specialStatusId = "status-with-special_chars!@#";
        const bundlePhase: BundlePhase = {
          ...mockBundlePhase,
          phaseStatusId: specialStatusId,
        };

        const result =
          await bundlePhaseResolvers.BundlePhase.phaseStatus(bundlePhase);

        expect(result).toBe(specialStatusId);
      });

      it("should handle unicode characters in phaseStatusId", async () => {
        const unicodeStatusId = "状态-Status-статус";
        const bundlePhase: BundlePhase = {
          ...mockBundlePhase,
          phaseStatusId: unicodeStatusId,
        };

        const result =
          await bundlePhaseResolvers.BundlePhase.phaseStatus(bundlePhase);

        expect(result).toBe(unicodeStatusId);
      });
    });

    describe("phaseDates", () => {
      it("should return phase dates for bundle and phase", async () => {
        const mockPhaseDates = [
          {
            bundleId: "bundle-1",
            phaseId: "Concept",
            dateTypeId: "Due Date",
            dateValue: new Date("2024-12-31"),
          },
          {
            bundleId: "bundle-1",
            phaseId: "Concept",
            dateTypeId: "Start Date",
            dateValue: new Date("2024-01-01"),
          },
        ];

        mockPrisma.bundlePhaseDate.findMany.mockResolvedValue(mockPhaseDates);

        const result =
          await bundlePhaseResolvers.BundlePhase.phaseDates(mockBundlePhase);

        expect(mockPrisma.bundlePhaseDate.findMany).toHaveBeenCalledWith({
          where: {
            bundleId: "bundle-1",
            phaseId: "Concept",
          },
        });

        expect(result).toEqual(mockPhaseDates);
        expect(result).toHaveLength(2);
      });

      it("should return empty array when no phase dates exist", async () => {
        mockPrisma.bundlePhaseDate.findMany.mockResolvedValue([]);

        const result =
          await bundlePhaseResolvers.BundlePhase.phaseDates(mockBundlePhase);

        expect(mockPrisma.bundlePhaseDate.findMany).toHaveBeenCalledWith({
          where: {
            bundleId: "bundle-1",
            phaseId: "Concept",
          },
        });

        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("should handle database errors", async () => {
        const dbError = new Error("Database connection failed");
        mockPrisma.bundlePhaseDate.findMany.mockRejectedValue(dbError);

        await expect(
          bundlePhaseResolvers.BundlePhase.phaseDates(mockBundlePhase),
        ).rejects.toThrow("Database connection failed");

        expect(mockPrisma.bundlePhaseDate.findMany).toHaveBeenCalledWith({
          where: {
            bundleId: "bundle-1",
            phaseId: "Concept",
          },
        });
      });

      it("should handle different bundle and phase combinations", async () => {
        const testCases = [
          { bundleId: "bundle-1", phaseId: "Concept" },
          { bundleId: "bundle-2", phaseId: "State Application" },
          { bundleId: "bundle-abc-123", phaseId: "CMS Review" },
          { bundleId: "demo-bundle", phaseId: "Implementation" },
        ];

        mockPrisma.bundlePhaseDate.findMany.mockResolvedValue([]);

        for (const testCase of testCases) {
          const bundlePhase: BundlePhase = {
            ...mockBundlePhase,
            bundleId: testCase.bundleId,
            phaseId: testCase.phaseId,
          };

          await bundlePhaseResolvers.BundlePhase.phaseDates(bundlePhase);

          expect(mockPrisma.bundlePhaseDate.findMany).toHaveBeenLastCalledWith({
            where: {
              bundleId: testCase.bundleId,
              phaseId: testCase.phaseId,
            },
          });
        }
      });

      it("should handle null bundleId", async () => {
        const bundlePhaseWithNullBundle: BundlePhase = {
          ...mockBundlePhase,
          bundleId: null as any,
        };

        mockPrisma.bundlePhaseDate.findMany.mockResolvedValue([]);

        const result = await bundlePhaseResolvers.BundlePhase.phaseDates(
          bundlePhaseWithNullBundle,
        );

        expect(mockPrisma.bundlePhaseDate.findMany).toHaveBeenCalledWith({
          where: {
            bundleId: null,
            phaseId: "Concept",
          },
        });

        expect(result).toEqual([]);
      });

      it("should handle null phaseId", async () => {
        const bundlePhaseWithNullPhase: BundlePhase = {
          ...mockBundlePhase,
          phaseId: null as any,
        };

        mockPrisma.bundlePhaseDate.findMany.mockResolvedValue([]);

        const result = await bundlePhaseResolvers.BundlePhase.phaseDates(
          bundlePhaseWithNullPhase,
        );

        expect(mockPrisma.bundlePhaseDate.findMany).toHaveBeenCalledWith({
          where: {
            bundleId: "bundle-1",
            phaseId: null,
          },
        });

        expect(result).toEqual([]);
      });

      it("should handle empty string IDs", async () => {
        const bundlePhaseWithEmptyIds: BundlePhase = {
          ...mockBundlePhase,
          bundleId: "",
          phaseId: "",
        };

        mockPrisma.bundlePhaseDate.findMany.mockResolvedValue([]);

        const result = await bundlePhaseResolvers.BundlePhase.phaseDates(
          bundlePhaseWithEmptyIds,
        );

        expect(mockPrisma.bundlePhaseDate.findMany).toHaveBeenCalledWith({
          where: {
            bundleId: "",
            phaseId: "",
          },
        });

        expect(result).toEqual([]);
      });

      it("should handle special characters in IDs", async () => {
        const bundlePhaseWithSpecialChars: BundlePhase = {
          ...mockBundlePhase,
          bundleId: "bundle-123_abc!@#",
          phaseId: "phase-with-dashes_underscores",
        };

        const mockDates = [
          {
            bundleId: "bundle-123_abc!@#",
            phaseId: "phase-with-dashes_underscores",
            dateTypeId: "Due Date",
            dateValue: new Date(),
          },
        ];

        mockPrisma.bundlePhaseDate.findMany.mockResolvedValue(mockDates);

        const result = await bundlePhaseResolvers.BundlePhase.phaseDates(
          bundlePhaseWithSpecialChars,
        );

        expect(mockPrisma.bundlePhaseDate.findMany).toHaveBeenCalledWith({
          where: {
            bundleId: "bundle-123_abc!@#",
            phaseId: "phase-with-dashes_underscores",
          },
        });

        expect(result).toEqual(mockDates);
      });

      it("should handle large number of phase dates", async () => {
        const largePhaseDates = Array.from({ length: 100 }, (_, i) => ({
          bundleId: "bundle-1",
          phaseId: "Concept",
          dateTypeId: `DateType-${i}`,
          dateValue: new Date(
            `2024-${String((i % 12) + 1).padStart(2, "0")}-01`,
          ),
        }));

        mockPrisma.bundlePhaseDate.findMany.mockResolvedValue(largePhaseDates);

        const result =
          await bundlePhaseResolvers.BundlePhase.phaseDates(mockBundlePhase);

        expect(result).toHaveLength(100);
        expect(result[0].dateTypeId).toBe("DateType-0");
        expect(result[99].dateTypeId).toBe("DateType-99");
      });

      it("should handle phase dates with null values", async () => {
        const phaseDatesWithNulls = [
          {
            bundleId: "bundle-1",
            phaseId: "Concept",
            dateTypeId: "Due Date",
            dateValue: null,
          },
          {
            bundleId: "bundle-1",
            phaseId: "Concept",
            dateTypeId: null,
            dateValue: new Date(),
          },
        ];

        mockPrisma.bundlePhaseDate.findMany.mockResolvedValue(
          phaseDatesWithNulls,
        );

        const result =
          await bundlePhaseResolvers.BundlePhase.phaseDates(mockBundlePhase);

        expect(result).toEqual(phaseDatesWithNulls);
        expect(result[0].dateValue).toBeNull();
        expect(result[1].dateTypeId).toBeNull();
      });

      it("should handle network timeout errors", async () => {
        const timeoutError = new Error("Network timeout");
        timeoutError.name = "TimeoutError";
        mockPrisma.bundlePhaseDate.findMany.mockRejectedValue(timeoutError);

        await expect(
          bundlePhaseResolvers.BundlePhase.phaseDates(mockBundlePhase),
        ).rejects.toThrow("Network timeout");
      });

      it("should handle database constraint errors", async () => {
        const constraintError = new Error("Foreign key constraint violation");
        constraintError.name = "ConstraintError";
        mockPrisma.bundlePhaseDate.findMany.mockRejectedValue(constraintError);

        await expect(
          bundlePhaseResolvers.BundlePhase.phaseDates(mockBundlePhase),
        ).rejects.toThrow("Foreign key constraint violation");
      });
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle malformed BundlePhase objects", async () => {
      const malformedBundlePhases = [
        {} as BundlePhase,
        { bundleId: "test" } as BundlePhase,
        { phaseId: "test" } as BundlePhase,
        { bundleId: undefined, phaseId: undefined } as BundlePhase,
      ];

      mockPrisma.bundlePhaseDate.findMany.mockResolvedValue([]);

      for (const malformedBundlePhase of malformedBundlePhases) {
        // Test phase resolver
        const phaseResult =
          await bundlePhaseResolvers.BundlePhase.phase(malformedBundlePhase);
        expect(phaseResult).toBe(malformedBundlePhase.phaseId);

        // Test phaseStatus resolver
        const statusResult =
          await bundlePhaseResolvers.BundlePhase.phaseStatus(
            malformedBundlePhase,
          );
        expect(statusResult).toBe(malformedBundlePhase.phaseStatusId);

        // Test phaseDates resolver
        const datesResult =
          await bundlePhaseResolvers.BundlePhase.phaseDates(
            malformedBundlePhase,
          );
        expect(datesResult).toEqual([]);
      }
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete BundlePhase resolver workflow", async () => {
      const testBundlePhase: BundlePhase = {
        bundleId: "integration-bundle",
        phaseId: "Integration Phase",
        phaseStatusId: "Integration Status",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPhaseDates = [
        {
          bundleId: "integration-bundle",
          phaseId: "Integration Phase",
          dateTypeId: "Start Date",
          dateValue: new Date("2024-01-01"),
        },
        {
          bundleId: "integration-bundle",
          phaseId: "Integration Phase",
          dateTypeId: "End Date",
          dateValue: new Date("2024-12-31"),
        },
      ];

      mockPrisma.bundlePhaseDate.findMany.mockResolvedValue(mockPhaseDates);

      // Test all resolvers
      const phaseResult =
        await bundlePhaseResolvers.BundlePhase.phase(testBundlePhase);
      const statusResult =
        await bundlePhaseResolvers.BundlePhase.phaseStatus(testBundlePhase);
      const datesResult =
        await bundlePhaseResolvers.BundlePhase.phaseDates(testBundlePhase);

      expect(phaseResult).toBe("Integration Phase");
      expect(statusResult).toBe("Integration Status");
      expect(datesResult).toEqual(mockPhaseDates);

      expect(mockPrisma.bundlePhaseDate.findMany).toHaveBeenCalledWith({
        where: {
          bundleId: "integration-bundle",
          phaseId: "Integration Phase",
        },
      });
    });

    it("should handle mixed success and error scenarios", async () => {
      const testBundlePhase: BundlePhase = {
        bundleId: "mixed-test-bundle",
        phaseId: "Mixed Test Phase",
        phaseStatusId: "Mixed Test Status",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Phase and status resolvers should succeed
      const phaseResult =
        await bundlePhaseResolvers.BundlePhase.phase(testBundlePhase);
      const statusResult =
        await bundlePhaseResolvers.BundlePhase.phaseStatus(testBundlePhase);

      expect(phaseResult).toBe("Mixed Test Phase");
      expect(statusResult).toBe("Mixed Test Status");

      // Phase dates resolver should fail
      const dbError = new Error("Database error in mixed scenario");
      mockPrisma.bundlePhaseDate.findMany.mockRejectedValue(dbError);

      await expect(
        bundlePhaseResolvers.BundlePhase.phaseDates(testBundlePhase),
      ).rejects.toThrow("Database error in mixed scenario");
    });
  });
});
