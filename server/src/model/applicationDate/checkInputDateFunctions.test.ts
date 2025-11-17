import { describe, it, expect, vi } from "vitest";
import { DateType } from "../../types.js";
import {
  getTZDateTimeParts,
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateMeetsOffset,
  getDateValueFromApplicationDateMap,
} from "./checkInputDateFunctions.js";
import { DateOffset, ApplicationDateMap } from ".";

describe("checkInputDateFunctions", () => {
  const testInputDateType: DateType = "Concept Completion Date";
  const testTargetDateType: DateType = "Concept Start Date";
  const testBeforeDateValue = new Date("2024-11-30T00:00:00Z");
  const testBaseDateValue = new Date("2025-01-01T00:00:00Z");
  const testAddDateValue = new Date("2025-01-14T11:12:13.145Z");
  const testAfterDateValue = new Date("2025-01-31T00:00:00Z");

  describe("getTZDateTimeParts", () => {
    const datePartsUTCToEST = getTZDateTimeParts(new Date("2025-03-01T11:23:13.128Z"));
    const datePartsEST = getTZDateTimeParts(new Date("2025-03-07T04:19:19.008-05:00"));
    const datePartsUTCToEDT = getTZDateTimeParts(new Date("2025-08-01T17:19:32.989Z"));
    const datePartsEDT = getTZDateTimeParts(new Date("2025-09-11T10:07:13.082-04:00"));

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
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).not.toThrow();
    });

    it("should throw when given a invalid start of day hour value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 1, 4, 0, 0, 0);
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day minute value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 1, 5, 1, 0, 0);
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day second value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 1, 5, 0, 1, 0);
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day millisecond value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 1, 5, 0, 0, 1);
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should not throw when given a valid start of day date in EDT", () => {
      const testInputDateValue = new Date(2025, 7, 1, 4, 0, 0, 0);
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).not.toThrow();
    });

    it("should throw when given a invalid start of day hour value in EDT", () => {
      const testInputDateValue = new Date(2025, 7, 1, 3, 0, 0, 0);
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day minute value in EDT", () => {
      const testInputDateValue = new Date(2025, 7, 1, 4, 1, 0, 0);
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day second value in EDT", () => {
      const testInputDateValue = new Date(2025, 7, 1, 4, 0, 1, 0);
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day millisecond value in EDT", () => {
      const testInputDateValue = new Date(2025, 7, 1, 4, 0, 0, 100);
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });
  });

  describe("checkInputDateIsEndOfDay", () => {
    it("should not throw when given a valid end of day date in EST", () => {
      const testInputDateValue = new Date(2025, 1, 3, 4, 59, 59, 999);
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).not.toThrow();
    });

    it("should throw when given a invalid end of day hour value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 3, 3, 59, 59, 999);
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day minute value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 3, 4, 58, 59, 999);
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day second value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 3, 4, 59, 58, 999);
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day millisecond value in EST", () => {
      const testInputDateValue = new Date(2025, 1, 3, 4, 59, 59, 998);
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should not throw when given a valid end of day date in EDT", () => {
      const testInputDateValue = new Date(2025, 8, 1, 3, 59, 59, 999);
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).not.toThrow();
    });

    it("should throw when given a invalid end of day hour value in EDT", () => {
      const testInputDateValue = new Date(2025, 8, 1, 2, 59, 59, 999);
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day minute value in EDT", () => {
      const testInputDateValue = new Date(2025, 8, 1, 3, 58, 59, 999);
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day second value in EDT", () => {
      const testInputDateValue = new Date(2025, 8, 1, 3, 59, 58, 999);
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day millisecond value in EDT", () => {
      const testInputDateValue = new Date(2025, 1, 8, 3, 59, 59, 998);
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });
  });

  describe("getDateValueFromApplicationDateMap", () => {
    it("should extract a date from a date map", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testBaseDateValue],
      ]);
      const result = getDateValueFromApplicationDateMap(testInputDateType, testApplicationDateMap);
      expect(result).toBe(testBaseDateValue);
    });

    it("should throw if the date isn't found", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testBaseDateValue],
      ]);
      expect(() =>
        getDateValueFromApplicationDateMap(testTargetDateType, testApplicationDateMap)
      ).toThrowError(
        `The date ${testTargetDateType} was requested as part of a validation, but is undefined. ` +
          `It must either be in the database, or part of your payload.`
      );
    });
  });

  describe("checkInputDateGreaterThan", () => {
    it("should not throw when the date is greater than the target", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testAfterDateValue],
        [testTargetDateType, testBaseDateValue],
      ]);
      expect(() =>
        checkInputDateGreaterThan(testApplicationDateMap, testInputDateType, testTargetDateType)
      ).not.toThrow();
    });

    it("should throw when the date is less than the target", async () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testBeforeDateValue],
        [testTargetDateType, testBaseDateValue],
      ]);
      const expectedError =
        `The input ${testInputDateType} has value ${testBeforeDateValue.toISOString()}, ` +
        `but it must be greater than ${testTargetDateType}, ` +
        `which has value ${testBaseDateValue.toISOString()}.`;
      expect(() =>
        checkInputDateGreaterThan(testApplicationDateMap, testInputDateType, testTargetDateType)
      ).toThrowError(expectedError);
    });

    it("should throw when the date is equal to the target", async () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testBaseDateValue],
        [testTargetDateType, testBaseDateValue],
      ]);
      const expectedError =
        `The input ${testInputDateType} has value ${testBaseDateValue.toISOString()}, ` +
        `but it must be greater than ${testTargetDateType}, ` +
        `which has value ${testBaseDateValue.toISOString()}.`;
      expect(() =>
        checkInputDateGreaterThan(testApplicationDateMap, testInputDateType, testTargetDateType)
      ).toThrowError(expectedError);
    });
  });

  describe("checkInputDateGreaterThanOrEqual", () => {
    it("should not throw when the date is greater than the target", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testAfterDateValue],
        [testTargetDateType, testBaseDateValue],
      ]);
      expect(() =>
        checkInputDateGreaterThanOrEqual(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType
        )
      ).not.toThrow();
    });

    it("should throw when the date is less than the target", async () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testBeforeDateValue],
        [testTargetDateType, testBaseDateValue],
      ]);
      const expectedError =
        `The input ${testInputDateType} has value ${testBeforeDateValue.toISOString()}, ` +
        `but it must be greater than or equal to ${testTargetDateType}, ` +
        `which has value ${testBaseDateValue.toISOString()}.`;
      expect(() =>
        checkInputDateGreaterThanOrEqual(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType
        )
      ).toThrowError(expectedError);
    });

    it("should not throw when the date is equal to the target", async () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testBaseDateValue],
        [testTargetDateType, testBaseDateValue],
      ]);
      expect(() =>
        checkInputDateGreaterThanOrEqual(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType
        )
      ).not.toThrow();
    });
  });

  describe("checkInputDateMeetsOffset", () => {
    const testOffset: DateOffset = {
      days: 13,
      hours: 11,
      minutes: 12,
      seconds: 13,
      milliseconds: 145,
    };

    it("should not throw when the input matches the target plus the offset", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testAddDateValue],
        [testTargetDateType, testBaseDateValue],
      ]);
      expect(() =>
        checkInputDateMeetsOffset(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType,
          testOffset
        )
      ).not.toThrow();
    });

    it("should throw when the input does not match the target plus the offset", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testAfterDateValue],
        [testTargetDateType, testBaseDateValue],
      ]);
      const expectedError =
        `The input ${testInputDateType} must be equal to ${testTargetDateType} + ${testOffset.days} days, ` +
        `${testOffset.hours} hours, ` +
        `${testOffset.minutes} minutes, ` +
        `${testOffset.seconds} seconds, ` +
        `and ${testOffset.milliseconds} milliseconds, ` +
        `which is ${testAddDateValue.toISOString()}. ` +
        `The value provided was ${testAfterDateValue.toISOString()}.`;
      expect(() =>
        checkInputDateMeetsOffset(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType,
          testOffset
        )
      ).toThrowError(expectedError);
    });
  });
});
