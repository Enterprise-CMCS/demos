import { describe, it, expect, vi, beforeEach } from "vitest";
import { DateType, SetBundleDateInput } from "../../types.js";
import {
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateMeetsOffset,
} from "./checkInputDateFunctions.js";
import { getTargetDateValue } from "./getTargetDateValue.js";
import { _ } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";

vi.mock("./getTargetDateValue", () => ({
  getTargetDateValue: vi.fn(),
}));

describe("getTargetDateValue", () => {
  const testBundleId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testInputDateType: DateType = "Concept Completion Date";
  const testTargetDateType: DateType = "Concept Start Date";
  const testTargetDate = {
    bundleId: testBundleId,
    dateType: testTargetDateType,
  };
  const testBeforeDateValue: Date = new Date("2024-11-30T00:00:00Z");
  const testBaseDateValue: Date = new Date("2025-01-01T00:00:00Z");
  const testAfterDateValue: Date = new Date("2025-01-31T00:00:00Z");

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getTargetDateValue).mockResolvedValue(testBaseDateValue);
  });

  describe("checkInputDateGreaterThan", async () => {
    it("should not throw when the date is greater than the target", async () => {
      const testInputDate = {
        dateType: testInputDateType,
        dateValue: testAfterDateValue,
      };
      await expect(checkInputDateGreaterThan(testInputDate, testTargetDate)).resolves.not.toThrow();
      expect(getTargetDateValue).toHaveBeenCalledExactlyOnceWith(
        testTargetDate.bundleId,
        testTargetDate.dateType
      );
    });

    it("should throw when the date is less than the target", async () => {
      const testInputDate = {
        dateType: testInputDateType,
        dateValue: testBeforeDateValue,
      };
      await expect(checkInputDateGreaterThan(testInputDate, testTargetDate)).rejects.toThrow();
      expect(getTargetDateValue).toHaveBeenCalledExactlyOnceWith(
        testTargetDate.bundleId,
        testTargetDate.dateType
      );
    });

    it("should throw when the date is equal to the target", async () => {
      const testInputDate = {
        dateType: testInputDateType,
        dateValue: testBaseDateValue,
      };
      await expect(checkInputDateGreaterThan(testInputDate, testTargetDate)).rejects.toThrow();
      expect(getTargetDateValue).toHaveBeenCalledExactlyOnceWith(
        testTargetDate.bundleId,
        testTargetDate.dateType
      );
    });
  });

  describe("checkInputDateGreaterThanOrEqual", async () => {
    it("should not throw when the date is greater than the target", async () => {
      const testInputDate = {
        dateType: testInputDateType,
        dateValue: testAfterDateValue,
      };
      await expect(
        checkInputDateGreaterThanOrEqual(testInputDate, testTargetDate)
      ).resolves.not.toThrow();
      expect(getTargetDateValue).toHaveBeenCalledExactlyOnceWith(
        testTargetDate.bundleId,
        testTargetDate.dateType
      );
    });

    it("should throw when the date is less than the target", async () => {
      const testInputDate = {
        dateType: testInputDateType,
        dateValue: testBeforeDateValue,
      };
      await expect(
        checkInputDateGreaterThanOrEqual(testInputDate, testTargetDate)
      ).rejects.toThrow();
      expect(getTargetDateValue).toHaveBeenCalledExactlyOnceWith(
        testTargetDate.bundleId,
        testTargetDate.dateType
      );
    });

    it("should not throw when the date is equal to the target", async () => {
      const testInputDate = {
        dateType: testInputDateType,
        dateValue: testBaseDateValue,
      };
      await expect(
        checkInputDateGreaterThanOrEqual(testInputDate, testTargetDate)
      ).resolves.not.toThrow();
      expect(getTargetDateValue).toHaveBeenCalledExactlyOnceWith(
        testTargetDate.bundleId,
        testTargetDate.dateType
      );
    });
  });

  describe("checkInputDateMeetsOffset", async () => {
    const testTargetDate = {
      bundleId: testBundleId,
      dateType: testTargetDateType,
      offsetDays: 0,
    };

    it("should not throw when the input matches the target plus the offset", async () => {
      const testInputDate = {
        dateType: testInputDateType,
        dateValue: testAfterDateValue,
      };
      testTargetDate.offsetDays = 30;
      await expect(checkInputDateMeetsOffset(testInputDate, testTargetDate)).resolves.not.toThrow();
      expect(getTargetDateValue).toHaveBeenCalledExactlyOnceWith(
        testTargetDate.bundleId,
        testTargetDate.dateType
      );
    });

    it("should throw when the input does not match the target plus the offset", async () => {
      const testInputDate = {
        dateType: testInputDateType,
        dateValue: testAfterDateValue,
      };
      testTargetDate.offsetDays = 20;
      await expect(checkInputDateMeetsOffset(testInputDate, testTargetDate)).rejects.toThrow();
      expect(getTargetDateValue).toHaveBeenCalledExactlyOnceWith(
        testTargetDate.bundleId,
        testTargetDate.dateType
      );
    });
  });
});
