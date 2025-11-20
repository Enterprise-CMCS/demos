import { describe, it, expect, vi, beforeEach } from "vitest";
import { getApplicationDates } from "./getApplicationDates.js";

describe("getApplicationDates", () => {
  const transactionMocks = {
    applicationDate: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationDate: {
      findMany: transactionMocks.applicationDate.findMany,
    },
  } as any;
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testOldDateValue: Date = new Date("2025-01-01T00:00:00Z");

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request dates for the application from the database", async () => {
    // The mock return value is to support the map statement at the end
    vi.mocked(transactionMocks.applicationDate.findMany).mockResolvedValue([
      {
        dateTypeId: "Concept Start Date",
        dateValue: testOldDateValue,
      },
      {
        dateTypeId: "Federal Comment Period Start Date",
        dateValue: testOldDateValue,
      },
    ]);
    const expectedCall = {
      select: {
        dateTypeId: true,
        dateValue: true,
      },
      where: {
        applicationId: testApplicationId,
      },
    };

    await getApplicationDates(testApplicationId, mockTransaction);
    expect(transactionMocks.applicationDate.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
