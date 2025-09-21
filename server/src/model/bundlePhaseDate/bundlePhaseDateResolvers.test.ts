import { describe, it, expect, vi, beforeEach } from "vitest";
import { BundlePhaseDate } from "@prisma/client";

// Mock dependencies
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(() => ({
    bundlePhaseDate: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  })),
}));

vi.mock("../bundle/bundleResolvers.js", () => ({
  getBundle: vi.fn(),
}));

vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(),
}));

import { prisma } from "../../prismaClient.js";
import { getBundle } from "../bundle/bundleResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { bundlePhaseDateResolvers } from "./bundlePhaseDateResolvers";
import { SetPhaseDateInput } from "../../types.js";

describe("bundlePhaseDateResolvers", () => {
  const mockPrisma = {
    bundlePhaseDate: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).mockReturnValue(mockPrisma);
  });

  describe("Mutation resolvers", () => {
    describe("setPhaseDate", () => {
      const mockInput: SetPhaseDateInput = {
        bundleId: "bundle-1",
        phase: "Concept",
        dateType: "Due Date",
        dateValue: new Date("2024-12-31"),
      };

      const mockBundle = {
        id: "bundle-1",
        name: "Test Bundle",
        bundleTypeId: "DEMONSTRATION",
        statusId: "Active",
        currentPhaseId: "Concept",
      };

      beforeEach(() => {
        (getBundle as any).mockResolvedValue(mockBundle);
      });

      it("should successfully set phase date and return bundle", async () => {
        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue({
          bundleId: "bundle-1",
          phaseId: "Concept",
          dateTypeId: "Due Date",
          dateValue: new Date("2024-12-31"),
        });

        const result = await bundlePhaseDateResolvers.Mutation.setPhaseDate(
          undefined,
          { input: mockInput },
        );

        expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenCalledWith({
          where: {
            bundleId_phaseId_dateTypeId: {
              bundleId: "bundle-1",
              phaseId: "Concept",
              dateTypeId: "Due Date",
            },
          },
          update: {
            dateValue: new Date("2024-12-31"),
          },
          create: {
            bundleId: "bundle-1",
            phaseId: "Concept",
            dateTypeId: "Due Date",
            dateValue: new Date("2024-12-31"),
          },
        });

        expect(getBundle).toHaveBeenCalledWith("bundle-1");
        expect(result).toEqual(mockBundle);
      });

      it("should handle upsert creating new record", async () => {
        const newRecord = {
          bundleId: "bundle-1",
          phaseId: "Concept",
          dateTypeId: "Due Date",
          dateValue: new Date("2024-12-31"),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue(newRecord);

        const result = await bundlePhaseDateResolvers.Mutation.setPhaseDate(
          undefined,
          { input: mockInput },
        );

        expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenCalledWith({
          where: {
            bundleId_phaseId_dateTypeId: {
              bundleId: "bundle-1",
              phaseId: "Concept",
              dateTypeId: "Due Date",
            },
          },
          update: {
            dateValue: new Date("2024-12-31"),
          },
          create: {
            bundleId: "bundle-1",
            phaseId: "Concept",
            dateTypeId: "Due Date",
            dateValue: new Date("2024-12-31"),
          },
        });

        expect(result).toEqual(mockBundle);
      });

      it("should handle upsert updating existing record", async () => {
        const updatedRecord = {
          bundleId: "bundle-1",
          phaseId: "Concept",
          dateTypeId: "Due Date",
          dateValue: new Date("2024-12-31"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date(),
        };

        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue(updatedRecord);

        const result = await bundlePhaseDateResolvers.Mutation.setPhaseDate(
          undefined,
          { input: mockInput },
        );

        expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenCalledWith({
          where: {
            bundleId_phaseId_dateTypeId: {
              bundleId: "bundle-1",
              phaseId: "Concept",
              dateTypeId: "Due Date",
            },
          },
          update: {
            dateValue: new Date("2024-12-31"),
          },
          create: {
            bundleId: "bundle-1",
            phaseId: "Concept",
            dateTypeId: "Due Date",
            dateValue: new Date("2024-12-31"),
          },
        });

        expect(result).toEqual(mockBundle);
      });

      it("should handle different phase types", async () => {
        const phases = [
          "Concept",
          "State Application",
          "CMS Review",
          "Implementation",
        ];
        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue({});

        for (const phase of phases) {
          const input = { ...mockInput, phase };

          await bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, {
            input,
          });

          expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenLastCalledWith({
            where: {
              bundleId_phaseId_dateTypeId: {
                bundleId: "bundle-1",
                phaseId: phase,
                dateTypeId: "Due Date",
              },
            },
            update: {
              dateValue: new Date("2024-12-31"),
            },
            create: {
              bundleId: "bundle-1",
              phaseId: phase,
              dateTypeId: "Due Date",
              dateValue: new Date("2024-12-31"),
            },
          });
        }
      });

      it("should handle different date types", async () => {
        const dateTypes = ["Due Date", "Start Date", "End Date", "Actual Date"];
        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue({});

        for (const dateType of dateTypes) {
          const input = { ...mockInput, dateType };

          await bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, {
            input,
          });

          expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenLastCalledWith({
            where: {
              bundleId_phaseId_dateTypeId: {
                bundleId: "bundle-1",
                phaseId: "Concept",
                dateTypeId: dateType,
              },
            },
            update: {
              dateValue: new Date("2024-12-31"),
            },
            create: {
              bundleId: "bundle-1",
              phaseId: "Concept",
              dateTypeId: dateType,
              dateValue: new Date("2024-12-31"),
            },
          });
        }
      });

      it("should handle different bundle IDs", async () => {
        const bundleIds = [
          "bundle-1",
          "bundle-2",
          "bundle-abc-123",
          "demo-bundle",
        ];
        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue({});

        for (const bundleId of bundleIds) {
          const input = { ...mockInput, bundleId };
          const expectedBundle = { ...mockBundle, id: bundleId };
          (getBundle as any).mockResolvedValue(expectedBundle);

          const result = await bundlePhaseDateResolvers.Mutation.setPhaseDate(
            undefined,
            { input },
          );

          expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenLastCalledWith({
            where: {
              bundleId_phaseId_dateTypeId: {
                bundleId,
                phaseId: "Concept",
                dateTypeId: "Due Date",
              },
            },
            update: {
              dateValue: new Date("2024-12-31"),
            },
            create: {
              bundleId,
              phaseId: "Concept",
              dateTypeId: "Due Date",
              dateValue: new Date("2024-12-31"),
            },
          });

          expect(getBundle).toHaveBeenLastCalledWith(bundleId);
          expect(result).toEqual(expectedBundle);
        }
      });

      it("should handle different date values", async () => {
        const dates = [
          new Date("2024-01-01"),
          new Date("2024-06-15"),
          new Date("2024-12-31"),
          new Date("2025-03-20"),
        ];

        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue({});

        for (const dateValue of dates) {
          const input = { ...mockInput, dateValue };

          await bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, {
            input,
          });

          expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenLastCalledWith({
            where: {
              bundleId_phaseId_dateTypeId: {
                bundleId: "bundle-1",
                phaseId: "Concept",
                dateTypeId: "Due Date",
              },
            },
            update: {
              dateValue,
            },
            create: {
              bundleId: "bundle-1",
              phaseId: "Concept",
              dateTypeId: "Due Date",
              dateValue,
            },
          });
        }
      });

      it("should handle null date value", async () => {
        const inputWithNullDate = {
          ...mockInput,
          dateValue: null,
        };

        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue({});

        await bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, {
          input: inputWithNullDate,
        });

        expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenCalledWith({
          where: {
            bundleId_phaseId_dateTypeId: {
              bundleId: "bundle-1",
              phaseId: "Concept",
              dateTypeId: "Due Date",
            },
          },
          update: {
            dateValue: null,
          },
          create: {
            bundleId: "bundle-1",
            phaseId: "Concept",
            dateTypeId: "Due Date",
            dateValue: null,
          },
        });
      });

      it("should handle Prisma errors and call error handler", async () => {
        const prismaError = new Error("Database constraint violation");
        prismaError.name = "PrismaClientKnownRequestError";
        mockPrisma.bundlePhaseDate.upsert.mockRejectedValue(prismaError);

        await bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, {
          input: mockInput,
        });

        expect(handlePrismaError).toHaveBeenCalledWith(prismaError);
        expect(getBundle).toHaveBeenCalledWith("bundle-1");
      });

      it("should handle foreign key constraint errors", async () => {
        const fkError = new Error("Foreign key constraint failed");
        fkError.name = "PrismaClientKnownRequestError";
        mockPrisma.bundlePhaseDate.upsert.mockRejectedValue(fkError);

        await bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, {
          input: mockInput,
        });

        expect(handlePrismaError).toHaveBeenCalledWith(fkError);
        expect(getBundle).toHaveBeenCalledWith("bundle-1");
      });

      it("should handle database connection errors", async () => {
        const connectionError = new Error("Database connection failed");
        connectionError.name = "PrismaClientInitializationError";
        mockPrisma.bundlePhaseDate.upsert.mockRejectedValue(connectionError);

        await bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, {
          input: mockInput,
        });

        expect(handlePrismaError).toHaveBeenCalledWith(connectionError);
        expect(getBundle).toHaveBeenCalledWith("bundle-1");
      });

      it("should handle getBundle errors", async () => {
        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue({});
        const getBundleError = new Error("Bundle not found");
        (getBundle as any).mockRejectedValue(getBundleError);

        await expect(
          bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, {
            input: mockInput,
          }),
        ).rejects.toThrow("Bundle not found");

        expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenCalled();
        expect(getBundle).toHaveBeenCalledWith("bundle-1");
      });

      it("should handle empty string values", async () => {
        const inputWithEmptyStrings = {
          bundleId: "",
          phase: "",
          dateType: "",
          dateValue: new Date("2024-12-31"),
        };

        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue({});
        (getBundle as any).mockResolvedValue(mockBundle);

        await bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, {
          input: inputWithEmptyStrings,
        });

        expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenCalledWith({
          where: {
            bundleId_phaseId_dateTypeId: {
              bundleId: "",
              phaseId: "",
              dateTypeId: "",
            },
          },
          update: {
            dateValue: new Date("2024-12-31"),
          },
          create: {
            bundleId: "",
            phaseId: "",
            dateTypeId: "",
            dateValue: new Date("2024-12-31"),
          },
        });

        expect(getBundle).toHaveBeenCalledWith("");
      });

      it("should handle special characters in IDs", async () => {
        const inputWithSpecialChars = {
          bundleId: "bundle-123_abc!@#",
          phase: "phase-with-dashes",
          dateType: "date_type_underscores",
          dateValue: new Date("2024-12-31"),
        };

        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue({});

        await bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, {
          input: inputWithSpecialChars,
        });

        expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenCalledWith({
          where: {
            bundleId_phaseId_dateTypeId: {
              bundleId: "bundle-123_abc!@#",
              phaseId: "phase-with-dashes",
              dateTypeId: "date_type_underscores",
            },
          },
          update: {
            dateValue: new Date("2024-12-31"),
          },
          create: {
            bundleId: "bundle-123_abc!@#",
            phaseId: "phase-with-dashes",
            dateTypeId: "date_type_underscores",
            dateValue: new Date("2024-12-31"),
          },
        });
      });

      it("should handle concurrent setPhaseDate calls", async () => {
        const inputs = [
          { ...mockInput, bundleId: "bundle-1" },
          { ...mockInput, bundleId: "bundle-2" },
          { ...mockInput, bundleId: "bundle-3" },
        ];

        mockPrisma.bundlePhaseDate.upsert.mockResolvedValue({});
        (getBundle as any).mockImplementation((id: string) =>
          Promise.resolve({ ...mockBundle, id }),
        );

        const promises = inputs.map((input) =>
          bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, { input }),
        );

        const results = await Promise.all(promises);

        expect(results).toHaveLength(3);
        expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenCalledTimes(3);
        expect(getBundle).toHaveBeenCalledTimes(3);

        results.forEach((result, index) => {
          expect(result.id).toBe(`bundle-${index + 1}`);
        });
      });
    });
  });

  describe("BundlePhaseDate field resolvers", () => {
    describe("dateType", () => {
      it("should return dateTypeId from parent", async () => {
        const mockBundlePhaseDate: BundlePhaseDate = {
          bundleId: "bundle-1",
          phaseId: "Concept",
          dateTypeId: "Due Date",
          dateValue: new Date("2024-12-31"),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result =
          await bundlePhaseDateResolvers.BundlePhaseDate.dateType(
            mockBundlePhaseDate,
          );

        expect(result).toBe("Due Date");
      });

      it("should handle different date type IDs", async () => {
        const dateTypes = [
          "Due Date",
          "Start Date",
          "End Date",
          "Actual Date",
          "Target Date",
        ];

        for (const dateTypeId of dateTypes) {
          const mockBundlePhaseDate: BundlePhaseDate = {
            bundleId: "bundle-1",
            phaseId: "Concept",
            dateTypeId,
            dateValue: new Date("2024-12-31"),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result =
            await bundlePhaseDateResolvers.BundlePhaseDate.dateType(
              mockBundlePhaseDate,
            );

          expect(result).toBe(dateTypeId);
        }
      });

      it("should handle null dateTypeId", async () => {
        const mockBundlePhaseDate: BundlePhaseDate = {
          bundleId: "bundle-1",
          phaseId: "Concept",
          dateTypeId: null as any,
          dateValue: new Date("2024-12-31"),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result =
          await bundlePhaseDateResolvers.BundlePhaseDate.dateType(
            mockBundlePhaseDate,
          );

        expect(result).toBeNull();
      });

      it("should handle undefined dateTypeId", async () => {
        const mockBundlePhaseDate: BundlePhaseDate = {
          bundleId: "bundle-1",
          phaseId: "Concept",
          dateTypeId: undefined as any,
          dateValue: new Date("2024-12-31"),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result =
          await bundlePhaseDateResolvers.BundlePhaseDate.dateType(
            mockBundlePhaseDate,
          );

        expect(result).toBeUndefined();
      });

      it("should handle empty string dateTypeId", async () => {
        const mockBundlePhaseDate: BundlePhaseDate = {
          bundleId: "bundle-1",
          phaseId: "Concept",
          dateTypeId: "",
          dateValue: new Date("2024-12-31"),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result =
          await bundlePhaseDateResolvers.BundlePhaseDate.dateType(
            mockBundlePhaseDate,
          );

        expect(result).toBe("");
      });

      it("should handle special characters in dateTypeId", async () => {
        const specialDateTypeId = "special-date_type!@#";
        const mockBundlePhaseDate: BundlePhaseDate = {
          bundleId: "bundle-1",
          phaseId: "Concept",
          dateTypeId: specialDateTypeId,
          dateValue: new Date("2024-12-31"),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result =
          await bundlePhaseDateResolvers.BundlePhaseDate.dateType(
            mockBundlePhaseDate,
          );

        expect(result).toBe(specialDateTypeId);
      });

      it("should handle unicode characters in dateTypeId", async () => {
        const unicodeDateTypeId = "日期类型";
        const mockBundlePhaseDate: BundlePhaseDate = {
          bundleId: "bundle-1",
          phaseId: "Concept",
          dateTypeId: unicodeDateTypeId,
          dateValue: new Date("2024-12-31"),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result =
          await bundlePhaseDateResolvers.BundlePhaseDate.dateType(
            mockBundlePhaseDate,
          );

        expect(result).toBe(unicodeDateTypeId);
      });
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle malformed input gracefully", async () => {
      const malformedInput = {
        bundleId: null,
        phase: undefined,
        dateType: {},
        dateValue: "not-a-date",
      } as any;

      mockPrisma.bundlePhaseDate.upsert.mockRejectedValue(
        new Error("Invalid input"),
      );

      await bundlePhaseDateResolvers.Mutation.setPhaseDate(undefined, {
        input: malformedInput,
      });

      expect(handlePrismaError).toHaveBeenCalledWith(
        new Error("Invalid input"),
      );
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete setPhaseDate workflow", async () => {
      const input: SetPhaseDateInput = {
        bundleId: "bundle-1",
        phase: "Concept",
        dateType: "Due Date",
        dateValue: new Date("2024-12-31"),
      };

      const createdRecord = {
        bundleId: "bundle-1",
        phaseId: "Concept",
        dateTypeId: "Due Date",
        dateValue: new Date("2024-12-31"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bundle = {
        id: "bundle-1",
        name: "Test Bundle",
        bundleTypeId: "DEMONSTRATION",
        statusId: "Active",
        currentPhaseId: "Concept",
      };

      mockPrisma.bundlePhaseDate.upsert.mockResolvedValue(createdRecord);
      (getBundle as any).mockResolvedValue(bundle);

      const result = await bundlePhaseDateResolvers.Mutation.setPhaseDate(
        undefined,
        { input },
      );

      // Verify the complete workflow
      expect(mockPrisma.bundlePhaseDate.upsert).toHaveBeenCalledWith({
        where: {
          bundleId_phaseId_dateTypeId: {
            bundleId: "bundle-1",
            phaseId: "Concept",
            dateTypeId: "Due Date",
          },
        },
        update: {
          dateValue: new Date("2024-12-31"),
        },
        create: {
          bundleId: "bundle-1",
          phaseId: "Concept",
          dateTypeId: "Due Date",
          dateValue: new Date("2024-12-31"),
        },
      });

      expect(getBundle).toHaveBeenCalledWith("bundle-1");
      expect(result).toEqual(bundle);
    });
  });
});
