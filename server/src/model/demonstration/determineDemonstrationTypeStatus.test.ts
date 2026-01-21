import { describe, it, beforeEach, vi, expect } from "vitest";
import { determineDemonstrationTypeStatus } from "./determineDemonstrationTypeStatus";
import { DemonstrationTypeStatus } from "../../types";

describe("determineDemonstrationTypeStatus", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  const currentDate = new Date(2025, 11, 15, 12, 0, 0, 0);
  const testDateValues = [
    {
      effectiveDate: new Date(2026, 0, 1, 0, 0, 0, 0),
      expirationDate: new Date(2026, 11, 31, 23, 59, 59, 999),
      expectedResult: "Pending",
    },
    {
      effectiveDate: new Date(2024, 0, 1, 0, 0, 0, 0),
      expirationDate: new Date(2024, 11, 31, 23, 59, 59, 999),
      expectedResult: "Expired",
    },
    {
      effectiveDate: new Date(2025, 0, 1, 0, 0, 0, 0),
      expirationDate: new Date(2025, 11, 31, 23, 59, 59, 999),
      expectedResult: "Active",
    },
  ];

  it("should return the expected result for the provided date values", () => {
    vi.useFakeTimers();
    vi.setSystemTime(currentDate);

    for (const testValue of testDateValues) {
      expect(
        determineDemonstrationTypeStatus(testValue.effectiveDate, testValue.expirationDate)
      ).toBe(testValue.expectedResult);
    }
  });
});
