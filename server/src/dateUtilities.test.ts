import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalDate } from "./types.js";
import {
  parseJSDateToEasternTZDate,
  parseDateTimeOrLocalDateToEasternTZDate,
  __getTodayStartOfDayEastern,
  __getTodayEndOfDayEastern,
  getEasternNow,
  EasternTZDate,
  getDateTimeParts,
} from "./dateUtilities.js";
import { TZDate } from "@date-fns/tz";

const DATE_PAIRS = [
  "sameDayUTCEastern",
  "differentDayInEST",
  "differentDayInEDT",
  "startOfDayInEST",
  "startOfDayInEDT",
  "endOfDayInEST",
  "endOfDayInEDT",
  "localDateStartOfDayInEST",
  "localDateStartOfDayInEDT",
  "localDateEndOfDayInEST",
  "localDateEndOfDayInEDT",
] as const;
type DatePair = (typeof DATE_PAIRS)[number];
type DateValues = {
  localDate?: LocalDate;
  utcDate?: Date;
  easternDate: EasternTZDate;
};
type TestDatesRecord = Record<DatePair, DateValues>;

const TEST_DATES: TestDatesRecord = {
  sameDayUTCEastern: {
    utcDate: new Date(2025, 0, 19, 15, 32, 14, 877),
    easternDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 0, 19, 10, 32, 14, 877, "America/New_York"),
    },
  },
  differentDayInEST: {
    utcDate: new Date(2025, 0, 16, 4, 14, 32, 111),
    easternDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 0, 15, 23, 14, 32, 111, "America/New_York"),
    },
  },
  differentDayInEDT: {
    utcDate: new Date(2025, 6, 16, 3, 39, 18, 585),
    easternDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 15, 23, 39, 18, 585, "America/New_York"),
    },
  },
  startOfDayInEST: {
    utcDate: new Date(2025, 0, 15, 5, 0, 0, 0),
    easternDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 0, 15, 0, 0, 0, 0, "America/New_York"),
    },
  },
  startOfDayInEDT: {
    utcDate: new Date(2025, 6, 15, 4, 0, 0, 0),
    easternDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 15, 0, 0, 0, 0, "America/New_York"),
    },
  },
  endOfDayInEST: {
    utcDate: new Date(2025, 1, 3, 4, 59, 59, 999),
    easternDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 1, 2, 23, 59, 59, 999, "America/New_York"),
    },
  },
  endOfDayInEDT: {
    utcDate: new Date(2025, 8, 3, 3, 59, 59, 999),
    easternDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 8, 2, 23, 59, 59, 999, "America/New_York"),
    },
  },
  localDateStartOfDayInEST: {
    localDate: "2025-01-15" as LocalDate,
    easternDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 0, 15, 0, 0, 0, 0, "America/New_York"),
    },
  },
  localDateStartOfDayInEDT: {
    localDate: "2025-07-15" as LocalDate,
    easternDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 15, 0, 0, 0, 0, "America/New_York"),
    },
  },
  localDateEndOfDayInEST: {
    localDate: "2025-02-02" as LocalDate,
    easternDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 1, 2, 23, 59, 59, 999, "America/New_York"),
    },
  },
  localDateEndOfDayInEDT: {
    localDate: "2025-09-02" as LocalDate,
    easternDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 8, 2, 23, 59, 59, 999, "America/New_York"),
    },
  },
};

describe("dateUtilities", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  describe("getDateTimeParts", () => {
    const testDatePartsUTC = getDateTimeParts(TEST_DATES.sameDayUTCEastern.utcDate!);
    const testDatePartsEST = getDateTimeParts(
      TEST_DATES.differentDayInEST.easternDate.easternTZDate
    );
    const testDatePartsEDT = getDateTimeParts(
      TEST_DATES.differentDayInEDT.easternDate.easternTZDate
    );

    it("should return the correct hours for UTC dates", () => {
      expect(testDatePartsUTC.hours).toBe(15);
    });

    it("should return the correct hours for EST dates", () => {
      expect(testDatePartsEST.hours).toBe(23);
    });

    it("should return the correct hours for EDT dates", () => {
      expect(testDatePartsEDT.hours).toBe(23);
    });

    it("should return the correct minutes, seconds, and milliseconds for dates", () => {
      expect(testDatePartsUTC.minutes).toBe(32);
      expect(testDatePartsUTC.seconds).toBe(14);
      expect(testDatePartsUTC.milliseconds).toBe(877);

      expect(testDatePartsEST.minutes).toBe(14);
      expect(testDatePartsEST.seconds).toBe(32);
      expect(testDatePartsEST.milliseconds).toBe(111);

      expect(testDatePartsEDT.minutes).toBe(39);
      expect(testDatePartsEDT.seconds).toBe(18);
      expect(testDatePartsEDT.milliseconds).toBe(585);
    });
  });

  describe("parseJSDateToEasternDZDate", () => {
    it("should turn an input Date into an EasternTZDate", () => {
      for (const datePair of DATE_PAIRS) {
        if (TEST_DATES[datePair].utcDate) {
          const result = parseJSDateToEasternTZDate(TEST_DATES[datePair].utcDate);
          expect(result).toEqual(TEST_DATES[datePair].easternDate);
        }
      }
    });
  });

  describe("parseDateTimeOrLocalDateToEasternTZDate", () => {
    it("should do nothing if the input is already a DateTime", () => {
      for (const datePair of DATE_PAIRS) {
        if (TEST_DATES[datePair].utcDate) {
          const result = parseDateTimeOrLocalDateToEasternTZDate(
            TEST_DATES[datePair].utcDate,
            "Start of Day"
          );
          expect(result).toEqual(TEST_DATES[datePair].easternDate);
        }
      }
    });

    it("should transform an EST LocalDate to a Date with the Start of Day timestamp", () => {
      const result = parseDateTimeOrLocalDateToEasternTZDate(
        TEST_DATES.localDateStartOfDayInEST.localDate!,
        "Start of Day"
      );
      expect(result).toEqual(TEST_DATES.localDateStartOfDayInEST.easternDate);
    });

    it("should transform an EDT LocalDate to a Date with the Start of Day timestamp", () => {
      const result = parseDateTimeOrLocalDateToEasternTZDate(
        TEST_DATES.localDateStartOfDayInEDT.localDate!,
        "Start of Day"
      );
      expect(result).toEqual(TEST_DATES.localDateStartOfDayInEDT.easternDate);
    });

    it("should transform an EST LocalDate to a Date with the End of Day timestamp", () => {
      const result = parseDateTimeOrLocalDateToEasternTZDate(
        TEST_DATES.localDateEndOfDayInEST.localDate!,
        "End of Day"
      );
      expect(result).toEqual(TEST_DATES.localDateEndOfDayInEST.easternDate);
    });

    it("should transform an EDT LocalDate to a Date with the End of Day timestamp", () => {
      const result = parseDateTimeOrLocalDateToEasternTZDate(
        TEST_DATES.localDateEndOfDayInEDT.localDate!,
        "End of Day"
      );
      expect(result).toEqual(TEST_DATES.localDateEndOfDayInEDT.easternDate);
    });

    describe("__getTodayStartOfDayEastern()", () => {
      it("should return start of day in Eastern time", () => {
        vi.useFakeTimers();
        vi.setSystemTime(TEST_DATES.sameDayUTCEastern.utcDate!);

        const result = __getTodayStartOfDayEastern().easternTZDate;
        expect(result.getTimezoneOffset()).toBe(300);
        expect(result.getDate()).toBe(19);
        expect(result.getMonth()).toBe(0);
        expect(result.getFullYear()).toBe(2025);
        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
        expect(result.getMilliseconds()).toBe(0);
      });

      it("should handle when the UTC date is different in EST", () => {
        vi.useFakeTimers();
        vi.setSystemTime(TEST_DATES.differentDayInEST.utcDate!);

        const result = __getTodayStartOfDayEastern().easternTZDate;
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
        vi.setSystemTime(TEST_DATES.differentDayInEDT.utcDate!);

        const result = __getTodayStartOfDayEastern().easternTZDate;
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
        vi.setSystemTime(TEST_DATES.sameDayUTCEastern.utcDate!);

        const result = __getTodayEndOfDayEastern().easternTZDate;
        expect(result.getTimezoneOffset()).toBe(300);
        expect(result.getDate()).toBe(19);
        expect(result.getMonth()).toBe(0);
        expect(result.getFullYear()).toBe(2025);
        expect(result.getHours()).toBe(23);
        expect(result.getMinutes()).toBe(59);
        expect(result.getSeconds()).toBe(59);
        expect(result.getMilliseconds()).toBe(999);
      });

      it("should handle when the UTC date is different in EST", () => {
        vi.useFakeTimers();
        vi.setSystemTime(TEST_DATES.differentDayInEST.utcDate!);

        const result = __getTodayEndOfDayEastern().easternTZDate;
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
        vi.setSystemTime(TEST_DATES.differentDayInEDT.utcDate!);

        const result = __getTodayEndOfDayEastern().easternTZDate;
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
  });

  describe("getEasternNow()", () => {
    it("should return start and end of day values in in Eastern time", () => {
      vi.useFakeTimers();
      vi.setSystemTime(TEST_DATES.sameDayUTCEastern.utcDate!);

      const result = getEasternNow();
      const resultStartOfDay = result["Start of Day"].easternTZDate;
      const resultEndOfDay = result["End of Day"].easternTZDate;

      expect(resultStartOfDay.getTimezoneOffset()).toBe(300);
      expect(resultStartOfDay.getDate()).toBe(19);
      expect(resultStartOfDay.getMonth()).toBe(0);
      expect(resultStartOfDay.getFullYear()).toBe(2025);
      expect(resultStartOfDay.getHours()).toBe(0);
      expect(resultStartOfDay.getMinutes()).toBe(0);
      expect(resultStartOfDay.getSeconds()).toBe(0);
      expect(resultStartOfDay.getMilliseconds()).toBe(0);

      expect(resultEndOfDay.getTimezoneOffset()).toBe(300);
      expect(resultEndOfDay.getDate()).toBe(19);
      expect(resultEndOfDay.getMonth()).toBe(0);
      expect(resultEndOfDay.getFullYear()).toBe(2025);
      expect(resultEndOfDay.getHours()).toBe(23);
      expect(resultEndOfDay.getMinutes()).toBe(59);
      expect(resultEndOfDay.getSeconds()).toBe(59);
      expect(resultEndOfDay.getMilliseconds()).toBe(999);
    });
  });
});
