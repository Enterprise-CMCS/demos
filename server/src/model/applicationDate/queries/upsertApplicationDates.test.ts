import { describe, it, expect, vi, beforeEach } from "vitest";
import { upsertApplicationDates } from "./upsertApplicationDates.js";
import { ParsedSetApplicationDatesInput } from "../../../types.js";

describe("upsertApplicationDates", () => {
  const transactionMocks = {
    applicationDate: {
      upsert: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationDate: {
      upsert: transactionMocks.applicationDate.upsert,
    },
  } as any;
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testDateValue1: Date = new Date("2025-01-01T00:00:00Z");
  const testDateValue2: Date = new Date("2025-01-30T00:00:00Z");

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should upsert changed dates", async () => {
    const testInput: ParsedSetApplicationDatesInput = {
      applicationId: testApplicationId,
      applicationDates: [
        {
          dateType: "Concept Completion Date",
          dateValue: testDateValue1,
        },
        {
          dateType: "Concept Start Date",
          dateValue: testDateValue2,
        },
      ],
    };
    const expectedCalls = [
      [
        {
          where: {
            applicationId_dateTypeId: {
              applicationId: testApplicationId,
              dateTypeId: "Concept Completion Date",
            },
          },
          update: {
            dateValue: testDateValue1,
          },
          create: {
            applicationId: testApplicationId,
            dateTypeId: "Concept Completion Date",
            dateValue: testDateValue1,
          },
        },
      ],
      [
        {
          where: {
            applicationId_dateTypeId: {
              applicationId: testApplicationId,
              dateTypeId: "Concept Start Date",
            },
          },
          update: {
            dateValue: testDateValue2,
          },
          create: {
            applicationId: testApplicationId,
            dateTypeId: "Concept Start Date",
            dateValue: testDateValue2,
          },
        },
      ],
    ];

    await upsertApplicationDates(testInput, mockTransaction);
    expect(transactionMocks.applicationDate.upsert.mock.calls).toEqual(expectedCalls);
  });
});
