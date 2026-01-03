import { describe, it, expect } from "vitest";
import { filterChangingDateTypes } from "./filterChangingDateTypes";
import { ApplicationDateInput } from "./applicationDateSchema";
import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { DateTimeOrLocalDate, DateType } from "../../types";

describe("filterChangingDateTypes", () => {
  const testDateType1: DateType = "BN PMT Approval to Send to OMB";
  const testDateType2: DateType = "DDME Approval Received";
  const testDateType3: DateType = "Concept Start Date";

  describe("new dates (no existing date)", () => {
    it("should return date type for new date", () => {
      const inputApplicationDates: ApplicationDateInput[] = [
        { dateType: testDateType1, dateValue: "2025-12-22" as DateTimeOrLocalDate },
      ];
      const existingApplicationDates: Pick<PrismaApplicationDate, "dateTypeId" | "dateValue">[] =
        [];

      const result = filterChangingDateTypes(inputApplicationDates, existingApplicationDates);

      expect(result).toEqual([testDateType1]);
    });
  });

  describe("input date is null (deletion)", () => {
    it("should return date type when input is null with existing date", () => {
      const existingDate = new Date("2025-12-22T05:00:00.000Z");
      const inputApplicationDates: ApplicationDateInput[] = [
        { dateType: testDateType1, dateValue: null },
      ];
      const existingApplicationDates: Pick<PrismaApplicationDate, "dateTypeId" | "dateValue">[] = [
        {
          dateTypeId: testDateType1,
          dateValue: existingDate,
        },
      ];

      const result = filterChangingDateTypes(inputApplicationDates, existingApplicationDates);

      expect(result).toEqual([testDateType1]);
    });
  });

  describe("date comparison with values", () => {
    it("should NOT return date type when dates have same timestamp", () => {
      const timestamp = "2025-12-22T05:00:00.000Z";
      const existingDate = new Date(timestamp);

      const inputApplicationDates: ApplicationDateInput[] = [
        { dateType: testDateType1, dateValue: timestamp as DateTimeOrLocalDate },
      ];
      const existingApplicationDates: Pick<PrismaApplicationDate, "dateTypeId" | "dateValue">[] = [
        {
          dateTypeId: testDateType1,
          dateValue: existingDate,
        },
      ];

      const result = filterChangingDateTypes(inputApplicationDates, existingApplicationDates);

      expect(result).toEqual([]);
    });

    it("should return date type when dates have different timestamps", () => {
      const existingDate = new Date("2025-12-22T05:00:00.000Z");

      const inputApplicationDates: ApplicationDateInput[] = [
        { dateType: testDateType1, dateValue: "2025-12-23T05:00:00.000Z" as DateTimeOrLocalDate },
      ];
      const existingApplicationDates: Pick<PrismaApplicationDate, "dateTypeId" | "dateValue">[] = [
        {
          dateTypeId: testDateType1,
          dateValue: existingDate,
        },
      ];

      const result = filterChangingDateTypes(inputApplicationDates, existingApplicationDates);

      expect(result).toEqual([testDateType1]);
    });

    it("should convert local date to date for comparison", () => {
      const existingDate = new Date("2025-12-22T05:00:00.000Z"); // Eastern Time: 2025-12-22 00:00:00

      const inputApplicationDates: ApplicationDateInput[] = [
        { dateType: testDateType1, dateValue: "2025-12-22" as DateTimeOrLocalDate }, // Local date
      ];
      const existingApplicationDates: Pick<PrismaApplicationDate, "dateTypeId" | "dateValue">[] = [
        {
          dateTypeId: testDateType1,
          dateValue: existingDate,
        },
      ];

      const result = filterChangingDateTypes(inputApplicationDates, existingApplicationDates);

      expect(result).toEqual([]);
    });
  });

  describe("multiple dates", () => {
    it("should only return date types that changed", () => {
      const unchangedDate = new Date("2025-12-22T05:00:00.000Z");
      const changedOldDate = new Date("2025-12-23T05:00:00.000Z");

      const inputApplicationDates: ApplicationDateInput[] = [
        { dateType: testDateType1, dateValue: "2025-12-22T05:00:00.000Z" as DateTimeOrLocalDate }, // Unchanged
        { dateType: testDateType2, dateValue: "2025-12-24T05:00:00.000Z" as DateTimeOrLocalDate }, // Changed
        { dateType: testDateType3, dateValue: "2025-12-25T05:00:00.000Z" as DateTimeOrLocalDate }, // New
      ];
      const existingApplicationDates: Pick<PrismaApplicationDate, "dateTypeId" | "dateValue">[] = [
        {
          dateTypeId: testDateType1,
          dateValue: unchangedDate,
        },
        {
          dateTypeId: testDateType2,
          dateValue: changedOldDate,
        },
      ];

      const result = filterChangingDateTypes(inputApplicationDates, existingApplicationDates);

      expect(result).toEqual([testDateType2, testDateType3]);
    });

    it("should return all null input dates as changes", () => {
      const existingDate = new Date("2025-12-22T05:00:00.000Z");

      const inputApplicationDates: ApplicationDateInput[] = [
        { dateType: testDateType1, dateValue: null }, // Null with existing
        { dateType: testDateType2, dateValue: null }, // Null without existing
      ];
      const existingApplicationDates: Pick<PrismaApplicationDate, "dateTypeId" | "dateValue">[] = [
        {
          dateTypeId: testDateType1,
          dateValue: existingDate,
        },
      ];

      const result = filterChangingDateTypes(inputApplicationDates, existingApplicationDates);

      expect(result).toEqual([testDateType1, testDateType2]);
    });
  });
});
