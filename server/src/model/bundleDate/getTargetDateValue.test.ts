import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTargetDateValue } from "./getTargetDateValue.js";
import { DateType } from "../../types.js";
import { prisma } from "../../prismaClient.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("getTargetDateValue", () => {
  const mockFindUnique = vi.fn();
  const mockPrismaClient = {
    bundleDate: {
      findUnique: mockFindUnique,
    },
  };
  const testDateType: DateType = "Concept Start Date";
  const testDateValue: Date = new Date("2025-01-01T00:00:00Z");
  const testBundleId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should request the target date value from the database", async () => {
    vi.mocked(mockFindUnique).mockReturnValue({ dateValue: testDateValue });
    const expectedCall = {
      select: {
        dateValue: true,
      },
      where: {
        bundleId_dateTypeId: {
          bundleId: testBundleId,
          dateTypeId: testDateType,
        },
      },
    };
    await getTargetDateValue(testBundleId, testDateType);
    expect(mockFindUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should throw an error if the date is not returned", async () => {
    vi.mocked(mockFindUnique).mockReturnValue(null);
    await expect(getTargetDateValue(testBundleId, testDateType)).rejects.toThrow();
  });
});
