import { describe, it, expect, vi } from "vitest";
import { upsertDemonstrationTypeAssignments } from "./upsertDemonstrationTypeAssignments.js";
import { ParsedDemonstrationTypeInput } from "..";
import { TZDate } from "@date-fns/tz";

describe("upsertDemonstrationTypeAssignments", () => {
  const transactionMocks = {
    demonstrationTypeTagAssignment: {
      upsert: vi.fn(),
    },
  };
  const mockTransaction = {
    demonstrationTypeTagAssignment: {
      upsert: transactionMocks.demonstrationTypeTagAssignment.upsert,
    },
  } as any;
  const testDemonstrationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testDate = new TZDate(2026, 0, 1, 0, 0, 0, 0, "America/New_York");

  it("should upsert requested demonstration types", async () => {
    const testAssignments: ParsedDemonstrationTypeInput[] = [
      {
        demonstrationTypeName: "Type One",
        demonstrationTypeDates: {
          effectiveDate: testDate,
          expirationDate: testDate,
        },
      },
      {
        demonstrationTypeName: "Type 3",
        demonstrationTypeDates: {
          effectiveDate: testDate,
          expirationDate: testDate,
        },
      },
    ];
    const expectedCalls = [
      [
        {
          where: {
            demonstrationId_tagId: {
              demonstrationId: testDemonstrationId,
              tagId: "Type One",
            },
          },
          update: {
            effectiveDate: testDate,
            expirationDate: testDate,
          },
          create: {
            demonstrationId: testDemonstrationId,
            tagId: "Type One",
            tagTypeId: "Demonstration Type",
            effectiveDate: testDate,
            expirationDate: testDate,
          },
        },
      ],
      [
        {
          where: {
            demonstrationId_tagId: {
              demonstrationId: testDemonstrationId,
              tagId: "Type 3",
            },
          },
          update: {
            effectiveDate: testDate,
            expirationDate: testDate,
          },
          create: {
            demonstrationId: testDemonstrationId,
            tagId: "Type 3",
            tagTypeId: "Demonstration Type",
            effectiveDate: testDate,
            expirationDate: testDate,
          },
        },
      ],
    ];

    await upsertDemonstrationTypeAssignments(testDemonstrationId, testAssignments, mockTransaction);
    expect(transactionMocks.demonstrationTypeTagAssignment.upsert.mock.calls).toEqual(
      expectedCalls
    );
  });
});
