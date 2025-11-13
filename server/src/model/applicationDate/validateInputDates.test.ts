import { describe, it, expect, vi, beforeEach } from "vitest";
import { __makeEmptyValidations, validateInputDates } from "./validateInputDates.js";
import { DateType, ParsedApplicationDateInput } from "../../types.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
  __checkInputDateGreaterThan,
  __checkInputDateGreaterThanOrEqual,
  __checkInputDateMeetsOffset,
  DateOffset,
  ApplicationDateMap,
} from "./checkInputDateFunctions.js";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";

vi.mock("./checkInputDateFunctions.js", () => ({
  checkInputDateIsStartOfDay: vi.fn(),
  checkInputDateIsEndOfDay: vi.fn(),
  __checkInputDateGreaterThan: vi.fn(),
  __checkInputDateGreaterThanOrEqual: vi.fn(),
  __checkInputDateMeetsOffset: vi.fn(),
}));

describe("validateInputDates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("__makeEmptyValidations", () => {
    it("should create the VALIDATION_CHECKS object correctly", () => {
      const result = __makeEmptyValidations();
      let isExpectedTimestampCorrect = true;
      let isGreaterThanChecksCorrect = true;
      let isGreaterThanOrEqualChecksCorrect = true;
      let isOffsetChecksCorrect = true;
      for (const [_, validationChecks] of Object.entries(result)) {
        if (!["Start of Day", "End of Day"].includes(validationChecks.expectedTimestamp)) {
          isExpectedTimestampCorrect = false;
        }
        if (validationChecks.greaterThanChecks.length !== 0) {
          isGreaterThanChecksCorrect = false;
        }
        if (validationChecks.greaterThanOrEqualChecks.length !== 0) {
          isGreaterThanOrEqualChecksCorrect = false;
        }
        if (validationChecks.offsetChecks.length !== 0) {
          isOffsetChecksCorrect = false;
        }
      }
      expect(Object.keys(result)).toEqual(Object.keys(DATE_TYPES_WITH_EXPECTED_TIMESTAMPS));
      expect(isExpectedTimestampCorrect).toBe(true);
      expect(isGreaterThanChecksCorrect).toBe(true);
      expect(isGreaterThanOrEqualChecksCorrect).toBe(true);
      expect(isOffsetChecksCorrect).toBe(true);
    });
  });

  describe("validateInputDates", () => {
    const testDateValue = new Date("2025-01-01T05:00:00Z");

    it("should run checkInputDateIsStartOfDay on start of day dates", () => {
      const startOfDayDateTypes: DateType[] = [
        "Concept Start Date",
        "Pre-Submission Submitted Date",
        "Concept Completion Date",
        "Application Intake Start Date",
        "State Application Submitted Date",
        "Application Intake Completion Date",
        "Completeness Start Date",
        "State Application Deemed Complete",
        "Federal Comment Period Start Date",
        "Completeness Completion Date",
        "SDG Preparation Start Date",
        "Expected Approval Date",
        "SME Review Date",
        "FRT Initial Meeting Date",
        "BNPMT Initial Meeting Date",
        "SDG Preparation Completion Date",
        "OGC & OMB Review Start Date",
        "OGC Review Complete",
        "OMB Review Complete",
        "PO & OGD Sign-Off",
        "OGC & OMB Review Completion Date",
        "Approval Package Start Date",
        "Approval Package Completion Date",
      ];
      const testInput: ParsedApplicationDateInput[] = [];
      const expectedCalls = [];
      for (const dateType of startOfDayDateTypes) {
        testInput.push({ dateType: dateType, dateValue: testDateValue });
        expectedCalls.push([dateType, testDateValue]);
      }

      validateInputDates(testInput);
      expect(checkInputDateIsStartOfDay).toBeCalledTimes(startOfDayDateTypes.length);
      expect(vi.mocked(checkInputDateIsStartOfDay).mock.calls).toEqual(expectedCalls);
      expect(checkInputDateIsEndOfDay).toBeCalledTimes(0);
    });

    it("should run checkInputDateIsEndOfDay on end of day dates", () => {
      const endOfDayDateTypes: DateType[] = [
        "Federal Comment Period End Date",
        "Completeness Review Due Date",
      ];
      const testInput: ParsedApplicationDateInput[] = [];
      const expectedCalls = [];
      for (const dateType of endOfDayDateTypes) {
        testInput.push({ dateType: dateType, dateValue: testDateValue });
        expectedCalls.push([dateType, testDateValue]);
      }

      validateInputDates(testInput);
      expect(checkInputDateIsEndOfDay).toBeCalledTimes(endOfDayDateTypes.length);
      expect(vi.mocked(checkInputDateIsEndOfDay).mock.calls).toEqual(expectedCalls);
      expect(checkInputDateIsStartOfDay).toBeCalledTimes(0);
    });

    it("should run __checkInputDateGreaterThan on dates with that check", () => {
      const greaterThanCheckTypes: [DateType, DateType][] = [];
      const testInput: ParsedApplicationDateInput[] = [];
      const testApplicationDateMap: ApplicationDateMap = new Map();
      const expectedCalls = [];
      for (const dateType of greaterThanCheckTypes) {
        testInput.push({ dateType: dateType[0], dateValue: testDateValue });
        testInput.push({ dateType: dateType[1], dateValue: testDateValue });
        testApplicationDateMap.set(dateType[0], testDateValue);
        testApplicationDateMap.set(dateType[1], testDateValue);
      }
      for (const dateType of greaterThanCheckTypes) {
        expectedCalls.push([testApplicationDateMap, dateType[0], dateType[1]]);
      }

      validateInputDates(testInput);
      expect(__checkInputDateGreaterThan).toBeCalledTimes(greaterThanCheckTypes.length);
      expect(vi.mocked(__checkInputDateGreaterThan).mock.calls).toEqual(expectedCalls);
    });

    it("should run __checkInputDateGreaterThanOrEqual on dates with that check", () => {
      const greaterThanOrEqualCheckTypes: [DateType, DateType][] = [
        ["Concept Completion Date", "Concept Start Date"],
        ["Application Intake Completion Date", "Application Intake Start Date"],
        ["Application Intake Completion Date", "Concept Completion Date"],
        ["State Application Deemed Complete", "State Application Submitted Date"],
        ["Completeness Completion Date", "Completeness Start Date"],
        ["Completeness Completion Date", "Application Intake Completion Date"],
      ];
      const testInput: ParsedApplicationDateInput[] = [];
      const testApplicationDateMap: ApplicationDateMap = new Map();
      const expectedCalls = [];
      for (const dateType of greaterThanOrEqualCheckTypes) {
        testInput.push({ dateType: dateType[0], dateValue: testDateValue });
        testInput.push({ dateType: dateType[1], dateValue: testDateValue });
        testApplicationDateMap.set(dateType[0], testDateValue);
        testApplicationDateMap.set(dateType[1], testDateValue);
      }
      for (const dateType of greaterThanOrEqualCheckTypes) {
        expectedCalls.push([testApplicationDateMap, dateType[0], dateType[1]]);
      }

      validateInputDates(testInput);
      expect(__checkInputDateGreaterThanOrEqual).toBeCalledTimes(
        greaterThanOrEqualCheckTypes.length
      );
      expect(vi.mocked(__checkInputDateGreaterThanOrEqual).mock.calls).toEqual(expectedCalls);
    });

    it("should run __checkInputDateMeetsOffset on dates with that check", () => {
      const offsetCheckTypes: [DateType, DateType, DateOffset][] = [
        [
          "Completeness Review Due Date",
          "State Application Submitted Date",
          {
            days: 15,
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          },
        ],
        [
          "Federal Comment Period Start Date",
          "State Application Deemed Complete",
          {
            days: 1,
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          },
        ],
      ];
      const testInput: ParsedApplicationDateInput[] = [];
      const testApplicationDateMap: ApplicationDateMap = new Map();
      const expectedCalls = [];
      for (const dateType of offsetCheckTypes) {
        testInput.push({ dateType: dateType[0], dateValue: testDateValue });
        testInput.push({ dateType: dateType[1], dateValue: testDateValue });
        testApplicationDateMap.set(dateType[0], testDateValue);
        testApplicationDateMap.set(dateType[1], testDateValue);
      }
      for (const dateType of offsetCheckTypes) {
        expectedCalls.push([testApplicationDateMap, dateType[0], dateType[1], dateType[2]]);
      }

      validateInputDates(testInput);
      expect(__checkInputDateMeetsOffset).toBeCalledTimes(offsetCheckTypes.length);
      expect(vi.mocked(__checkInputDateMeetsOffset).mock.calls).toEqual(expectedCalls);
    });
  });
});
