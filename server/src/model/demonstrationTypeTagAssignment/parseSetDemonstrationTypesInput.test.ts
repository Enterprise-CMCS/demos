import { describe, it, expect, vi, beforeEach } from "vitest";
import { SetDemonstrationTypesInput } from "../../types";
import { TZDate } from "@date-fns/tz";
import { parseSetDemonstrationTypesInput } from "./parseSetDemonstrationTypesInput";

// Mock imports
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";

vi.mock("../applicationDate", () => ({
  parseAndValidateEffectiveAndExpirationDates: vi.fn(),
}));

describe("parseSetDemonstrationTypesInput", () => {
  const mockEffectiveDates = [new Date(2024, 0, 1, 0, 0, 0, 0), new Date(2025, 0, 1, 0, 0, 0, 0)];
  const mockExpirationDates = [
    new Date(2024, 11, 31, 23, 59, 59, 999),
    new Date(2025, 11, 31, 23, 59, 59, 999),
  ];
  const mockParsedEffectiveDates = [
    new TZDate(2026, 0, 1, 0, 0, 0, 0, "America/New_York"),
    new TZDate(2027, 0, 1, 0, 0, 0, 0, "America/New_York"),
  ];
  const mockParsedExpirationDates = [
    new TZDate(2026, 11, 31, 23, 59, 59, 999, "America/New_York"),
    new TZDate(2027, 11, 31, 23, 59, 59, 999, "America/New_York"),
  ];
  const testInput: SetDemonstrationTypesInput = {
    demonstrationId: "5bc4edae-ea3f-49f2-b549-9d49f2e9bdd8",
    demonstrationTypes: [
      {
        demonstrationTypeName: "Type One",
        demonstrationTypeDates: {
          effectiveDate: mockEffectiveDates[0],
          expirationDate: mockExpirationDates[0],
        },
      },
      {
        demonstrationTypeName: "Type Two",
        demonstrationTypeDates: {
          effectiveDate: mockEffectiveDates[1],
          expirationDate: mockExpirationDates[1],
        },
      },
      {
        demonstrationTypeName: "Type Three",
        demonstrationTypeDates: null,
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(parseAndValidateEffectiveAndExpirationDates)
      .mockReturnValueOnce({
        effectiveDate: mockParsedEffectiveDates[0],
        expirationDate: mockParsedExpirationDates[0],
      })
      .mockReturnValueOnce({
        effectiveDate: mockParsedEffectiveDates[1],
        expirationDate: mockParsedExpirationDates[1],
      });
  });

  it("should identify nulls as needing to be deleted", () => {
    const result = parseSetDemonstrationTypesInput(testInput);

    expect(result.demonstrationTypesToDelete).toEqual(["Type Three"]);
  });

  it("should parse the non-null dates and output them to the upsert key", () => {
    const result = parseSetDemonstrationTypesInput(testInput);

    expect(vi.mocked(parseAndValidateEffectiveAndExpirationDates).mock.calls).toEqual([
      [{ effectiveDate: mockEffectiveDates[0], expirationDate: mockExpirationDates[0] }],
      [{ effectiveDate: mockEffectiveDates[1], expirationDate: mockExpirationDates[1] }],
    ]);

    expect(result.demonstrationTypesToUpsert).toEqual([
      {
        demonstrationTypeName: "Type One",
        demonstrationTypeDates: {
          effectiveDate: mockParsedEffectiveDates[0],
          expirationDate: mockParsedExpirationDates[0],
        },
      },
      {
        demonstrationTypeName: "Type Two",
        demonstrationTypeDates: {
          effectiveDate: mockParsedEffectiveDates[1],
          expirationDate: mockParsedExpirationDates[1],
        },
      },
    ]);
  });
});
