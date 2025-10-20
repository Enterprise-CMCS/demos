import { describe, it, expect, vi, beforeEach } from "vitest";
import { DateType } from "../../types.js";
import {
  getTZDateParts,
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateMeetsOffset,
} from "./checkInputDateFunctions.js";
import { getTargetDateValue } from "./getTargetDateValue.js";

vi.mock("./getTargetDateValue", () => ({
  getTargetDateValue: vi.fn(),
}));

describe("getTargetDateValue", () => {
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testInputDateType: DateType = "Concept Completion Date";
  const testTargetDateType: DateType = "Concept Start Date";
  const testTargetDate = {
    applicationId: testApplicationId,
    dateType: testTargetDateType,
  };
  const testBeforeDateValue: Date = new Date("2024-11-30T00:00:00Z");
  const testBaseDateValue: Date = new Date("2025-01-01T00:00:00Z");
  const testAddDateValue: Date = new Date("2025-01-14T11:12:13.145Z");
  const testAfterDateValue: Date = new Date("2025-01-31T00:00:00Z");

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getTargetDateValue).mockResolvedValue(testBaseDateValue);
  });

  describe("getTZDateParts", () => {
    const datePartsUTCToEST = getTZDateParts(new Date("2025-03-01T11:23:13.128Z"));
    const datePartsEST = getTZDateParts(new Date("2025-03-07T04:19:19.008-05:00"));
    const datePartsUTCToEDT = getTZDateParts(new Date("2025-08-01T17:19:32.989Z"));
    const datePartsEDT = getTZDateParts(new Date("2025-09-11T10:07:13.082-04:00"));

    it("should return the correct hours in EST for a GMT date", () => {
      expect(datePartsUTCToEST.hours).toBe(6);
    });

    it("should return the correct hours in EST for an EST date", () => {
      expect(datePartsEST.hours).toBe(4);
    });

    it("should return the correct hours in EDT for a GMT date", () => {
      expect(datePartsUTCToEDT.hours).toBe(13);
    });

    it("should return the correct hours in EDT for an EDT date", () => {
      expect(datePartsEDT.hours).toBe(10);
    });

    it("should return the correct minutes, seconds, and milliseconds for GMT dates", () => {
      expect(datePartsUTCToEST.minutes).toBe(23);
      expect(datePartsUTCToEST.seconds).toBe(13);
      expect(datePartsUTCToEST.milliseconds).toBe(128);
      expect(datePartsUTCToEDT.minutes).toBe(19);
      expect(datePartsUTCToEDT.seconds).toBe(32);
      expect(datePartsUTCToEDT.milliseconds).toBe(989);
    });

    it("should return the correct minutes, seconds, and milliseconds for Eastern dates", () => {
      expect(datePartsEST.minutes).toBe(19);
      expect(datePartsEST.seconds).toBe(19);
      expect(datePartsEST.milliseconds).toBe(8);
      expect(datePartsEDT.minutes).toBe(7);
      expect(datePartsEDT.seconds).toBe(13);
      expect(datePartsEDT.milliseconds).toBe(82);
    });
  });

  describe("checkInputDateIsStartOfDay", () => {
    it("should not throw when given a valid start of day date in EST", () => {
      const testInputDateValue = new Date(2025, 1, 1, 5, 0, 0, 0);
      expect(() =>
        checkInputDateIsStartOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).not.toThrow();
    });

    it("should throw when given a invalid start of day hour value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 1, 4, 0, 0, 0);
      expect(() =>
        checkInputDateIsStartOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid start of day minute value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 1, 5, 1, 0, 0);
      expect(() =>
        checkInputDateIsStartOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid start of day second value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 1, 5, 0, 1, 0);
      expect(() =>
        checkInputDateIsStartOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid start of day millisecond value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 1, 5, 0, 0, 1);
      expect(() =>
        checkInputDateIsStartOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should not throw when given a valid start of day date in EDT", () => {
      const testInputDateValue = new Date(2025, 7, 1, 4, 0, 0, 0);
      expect(() =>
        checkInputDateIsStartOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).not.toThrow();
    });

    it("should throw when given a invalid start of day hour value in EDT", () => {
      const testInputDateValue = new Date(2025, 7, 1, 3, 0, 0, 0);
      expect(() =>
        checkInputDateIsStartOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid start of day minute value in EDT", () => {
      const testInputDateValue = new Date(2025, 7, 1, 4, 1, 0, 0);
      expect(() =>
        checkInputDateIsStartOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid start of day second value in EDT", () => {
      const testInputDateValue = new Date(2025, 7, 1, 4, 0, 1, 0);
      expect(() =>
        checkInputDateIsStartOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid start of day millisecond value in EDT", () => {
      const testInputDateValue = new Date(2025, 7, 1, 4, 0, 0, 100);
      expect(() =>
        checkInputDateIsStartOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });
  });

  describe("checkInputDateIsEndOfDay", () => {
    it("should not throw when given a valid end of day date in EST", () => {
      const testInputDateValue = new Date(2025, 1, 3, 4, 59, 59, 999);
      expect(() =>
        checkInputDateIsEndOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).not.toThrow();
    });

    it("should throw when given a invalid end of day hour value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 3, 3, 59, 59, 999);
      expect(() =>
        checkInputDateIsEndOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid end of day minute value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 3, 4, 58, 59, 999);
      expect(() =>
        checkInputDateIsEndOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid end of day second value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 3, 4, 59, 58, 999);
      expect(() =>
        checkInputDateIsEndOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid end of day millisecond value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 3, 4, 59, 59, 998);
      expect(() =>
        checkInputDateIsEndOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should not throw when given a valid end of day date in EDT", () => {
      const testInputDateValue = new Date(2025, 8, 1, 3, 59, 59, 999);
      expect(() =>
        checkInputDateIsEndOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).not.toThrow();
    });

    it("should throw when given a invalid end of day hour value in EDT", () => {
      const testInputDateValue = new Date(2025, 8, 1, 2, 59, 59, 999);
      expect(() =>
        checkInputDateIsEndOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid end of day minute value in EDT", () => {
      const testInputDateValue = new Date(2025, 8, 1, 3, 58, 59, 999);
      expect(() =>
        checkInputDateIsEndOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid end of day second value in EDT", () => {
      const testInputDateValue = new Date(2025, 8, 1, 3, 59, 58, 999);
      expect(() =>
        checkInputDateIsEndOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });

    it("should throw when given a invalid end of day millisecond value in EDT", () => {
      const testInputDateValue = new Date(2025, 1, 8, 3, 59, 59, 998);
      expect(() =>
        checkInputDateIsEndOfDay({ dateType: testInputDateType, dateValue: testInputDateValue })
      ).toThrow();
    });
  });

  describe("checkInputDateGreaterThan", async () => {
    it("should not throw when the date is greater than the target", async () => {
      const testInputDate = {
        dateType: testInputDateType,
        dateValue: testAfterDateValue,
      };
      await expect(checkInputDateGreaterThan(testInputDate, testTargetDate)).resolves.not.toThrow();
      expect(getTargetDateValue).toHaveBeenCalledExactlyOnceWith(
        testTargetDate.applicationId,
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
        testTargetDate.applicationId,
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
        testTargetDate.applicationId,
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
        testTargetDate.applicationId,
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
        testTargetDate.applicationId,
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
        testTargetDate.applicationId,
        testTargetDate.dateType
      );
    });
  });

  describe("checkInputDateMeetsOffset", async () => {
    const testTargetDate = {
      applicationId: testApplicationId,
      dateType: testTargetDateType,
      offset: {
        days: 13,
        hours: 11,
        minutes: 12,
        seconds: 13,
        milliseconds: 145,
      },
    };

    it("should not throw when the input matches the target plus the offset", async () => {
      const testInputDate = {
        dateType: testInputDateType,
        dateValue: testAddDateValue,
      };
      await expect(checkInputDateMeetsOffset(testInputDate, testTargetDate)).resolves.not.toThrow();
      expect(getTargetDateValue).toHaveBeenCalledExactlyOnceWith(
        testTargetDate.applicationId,
        testTargetDate.dateType
      );
    });

    it("should throw when the input does not match the target plus the offset", async () => {
      const testInputDate = {
        dateType: testInputDateType,
        dateValue: testAfterDateValue,
      };
      await expect(checkInputDateMeetsOffset(testInputDate, testTargetDate)).rejects.toThrow();
      expect(getTargetDateValue).toHaveBeenCalledExactlyOnceWith(
        testTargetDate.applicationId,
        testTargetDate.dateType
      );
    });
  });
});
