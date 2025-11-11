import { describe, it, expect } from "vitest";
import { parseDateTimeOrLocalDateToJSDate } from "./dateUtilities.js";

describe("dateUtilities", () => {
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
});
