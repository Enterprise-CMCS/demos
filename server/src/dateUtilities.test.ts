import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  parseDateTimeOrLocalDateToJSDate,
  __getTodayStartOfDayEastern,
  __getTodayEndOfDayEastern,
  getEasternNow,
} from "./dateUtilities.js";

describe("dateUtilities", () => {
  const tempSystemTimeSameDay = new Date("2025-01-15T14:30:00Z");
  const tempSystemTimeLastDayEST = new Date("2025-01-16T04:50:00Z");
  const tempSystemTimeLastDayEDT = new Date("2025-07-16T03:50:00Z");

  beforeEach(() => {
    vi.useRealTimers();
  });

  describe("parseDateTimeOrLocalDateToJSDate", () => {
    const testStartOfDayDateTimeEST = new Date("2025-01-15T00:00:00.000-05:00");
    const testEndOfDayDateTimeEST = new Date("2025-01-15T23:59:59.999-05:00");
    const testStartOfDayDateTimeEDT = new Date("2025-07-15T00:00:00.000-04:00");
    const testEndOfDayDateTimeEDT = new Date("2025-07-15T23:59:59.999-04:00");
    const testLocalDateEST = "2025-01-15";
    const testLocalDateEDT = "2025-07-15";

    describe("Input DateTime objects", () => {
      it("should do nothing if the input is already a DateTime", () => {
        const result = parseDateTimeOrLocalDateToJSDate(testStartOfDayDateTimeEST, "Start of Day");
        expect(result).toEqual(testStartOfDayDateTimeEST);
      });

      it("should ignore the expectedTimestamp if the input is already a DateTime", () => {
        const result = parseDateTimeOrLocalDateToJSDate(testStartOfDayDateTimeEST, "End of Day");
        expect(result).toEqual(testStartOfDayDateTimeEST);
      });
    });

    describe("Input Eastern Standard Time LocalDates", () => {
      it("should transform a LocalDate to a Date with the Start of Day timestamp", () => {
        const result = parseDateTimeOrLocalDateToJSDate(testLocalDateEST, "Start of Day");
        expect(result).toEqual(testStartOfDayDateTimeEST);
      });

      it("should transform a LocalDate to a Date with the End of Day timestamp", () => {
        const result = parseDateTimeOrLocalDateToJSDate(testLocalDateEST, "End of Day");
        expect(result).toEqual(testEndOfDayDateTimeEST);
      });
    });

    describe("Input Eastern Daylight Time LocalDates", () => {
      it("should transform a LocalDate to a Date with the Start of Day timestamp", () => {
        const result = parseDateTimeOrLocalDateToJSDate(testLocalDateEDT, "Start of Day");
        expect(result).toEqual(testStartOfDayDateTimeEDT);
      });

      it("should transform a LocalDate to a Date with the End of Day timestamp", () => {
        const result = parseDateTimeOrLocalDateToJSDate(testLocalDateEDT, "End of Day");
        expect(result).toEqual(testEndOfDayDateTimeEDT);
      });
    });
  });

  describe("__getTodayStartOfDayEastern()", () => {
    it("should return start of day in Eastern time", () => {
      vi.useFakeTimers();
      vi.setSystemTime(tempSystemTimeSameDay);

      const result = __getTodayStartOfDayEastern();
      expect(result.getTimezoneOffset()).toBe(300);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it("should handle when the UTC date is different in EST", () => {
      vi.useFakeTimers();
      vi.setSystemTime(tempSystemTimeLastDayEST);

      const result = __getTodayStartOfDayEastern();
      expect(result.getTimezoneOffset()).toBe(300);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it("should handle when the UTC date is different in EDT", () => {
      vi.useFakeTimers();
      vi.setSystemTime(tempSystemTimeLastDayEDT);

      const result = __getTodayStartOfDayEastern();
      expect(result.getTimezoneOffset()).toBe(240);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(6);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe("__getTodayEndOfDayEastern()", () => {
    it("should return end of day in Eastern time", () => {
      vi.useFakeTimers();
      vi.setSystemTime(tempSystemTimeSameDay);

      const result = __getTodayEndOfDayEastern();
      expect(result.getTimezoneOffset()).toBe(300);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it("should handle when the UTC date is different in EST", () => {
      vi.useFakeTimers();
      vi.setSystemTime(tempSystemTimeLastDayEST);

      const result = __getTodayEndOfDayEastern();
      expect(result.getTimezoneOffset()).toBe(300);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it("should handle when the UTC date is different in EDT", () => {
      vi.useFakeTimers();
      vi.setSystemTime(tempSystemTimeLastDayEDT);

      const result = __getTodayEndOfDayEastern();
      expect(result.getTimezoneOffset()).toBe(240);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(6);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe("getEasternNow()", () => {
    it("should return start and end of day values in in Eastern time", () => {
      vi.useFakeTimers();
      vi.setSystemTime(tempSystemTimeSameDay);

      const result = getEasternNow();
      const resultStartOfDay = result["Start of Day"];
      const resultEndOfDay = result["End of Day"];

      expect(resultStartOfDay.getTimezoneOffset()).toBe(300);
      expect(resultStartOfDay.getDate()).toBe(15);
      expect(resultStartOfDay.getMonth()).toBe(0);
      expect(resultStartOfDay.getFullYear()).toBe(2025);
      expect(resultStartOfDay.getHours()).toBe(0);
      expect(resultStartOfDay.getMinutes()).toBe(0);
      expect(resultStartOfDay.getSeconds()).toBe(0);
      expect(resultStartOfDay.getMilliseconds()).toBe(0);

      expect(resultEndOfDay.getTimezoneOffset()).toBe(300);
      expect(resultEndOfDay.getDate()).toBe(15);
      expect(resultEndOfDay.getMonth()).toBe(0);
      expect(resultEndOfDay.getFullYear()).toBe(2025);
      expect(resultEndOfDay.getHours()).toBe(23);
      expect(resultEndOfDay.getMinutes()).toBe(59);
      expect(resultEndOfDay.getSeconds()).toBe(59);
      expect(resultEndOfDay.getMilliseconds()).toBe(999);
    });
  });
});
