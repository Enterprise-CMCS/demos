import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteApplicationDates } from "./deleteApplicationDates.js";
import { ParsedSetApplicationDatesInput } from "..";
import { EasternTZDate } from "../../../dateUtilities.js";
import { TZDate } from "@date-fns/tz";

describe("deleteApplicationDates", () => {
  const transactionMocks = {
    applicationDate: {
      delete: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationDate: {
      delete: transactionMocks.applicationDate.delete,
    },
  } as any;
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delete removed dates", async () => {
    const testInput: ParsedSetApplicationDatesInput = {
      applicationId: testApplicationId,
      applicationDatesToUpsert: [],
      applicationDatesToDelete: ["Concept Completion Date", "Concept Start Date"],
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
        },
      ],
    ];

    await deleteApplicationDates(testInput, mockTransaction);
    expect(transactionMocks.applicationDate.delete.mock.calls).toEqual(expectedCalls);
  });
});
