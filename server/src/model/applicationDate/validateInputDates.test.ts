import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  makeApplicationDateMapFromList,
  makeEmptyValidations,
  makeValidations,
  validateInputDates,
} from "./validateInputDates";
import { DateType } from "../../types";
import type { ParsedApplicationDateInput } from ".";
import { EasternTZDate } from "../../dateUtilities";
import { DATE_TYPES, DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants";
import { TZDate } from "@date-fns/tz";
import { SemVer } from "semver";
import type { DateOffset, ApplicationDateMap } from ".";

// Mock imports
vi.mock(".", () => ({
  checkInputDateGreaterThan: vi.fn(),
  checkInputDateGreaterThanOrEqual: vi.fn(),
  checkInputDateIsEndOfDay: vi.fn(),
  checkInputDateIsStartOfDay: vi.fn(),
  checkInputDateLessThan: vi.fn(),
  checkInputDateMeetsFlexibleOffset: vi.fn(),
  checkInputDateMeetsOffset: vi.fn(),
  checkInputDateNotHoliday: vi.fn(),
  checkInputDateNotWeekend: vi.fn(),
}));

import {
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateIsEndOfDay,
  checkInputDateIsStartOfDay,
  checkInputDateLessThan,
  checkInputDateMeetsFlexibleOffset,
  checkInputDateMeetsOffset,
  checkInputDateNotHoliday,
  checkInputDateNotWeekend,
} from ".";

describe("validateInputDates", () => {
  const testDateValue: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate("2025-01-01T00:00:00.000-05:00", "America/New_York"),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("makeEmptyValidations", () => {
    it("should create an empty validationChecks object correctly", () => {
      const result = makeEmptyValidations();
      let isExpectedTimestampCorrect = true;
      let isGreaterThanChecksCorrect = true;
      let isGreaterThanOrEqualChecksCorrect = true;
      let isOffsetChecksCorrect = true;
      for (const [, validationChecks] of Object.entries(result)) {
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

  describe("makeValidations", () => {
    describe("before 1.3.0", () => {
      const versionNumber = "1.2.0";
      it("should include the 15-day offset for Completeness Review Due Date in the validations", () => {
        const result = makeValidations(new SemVer(versionNumber));
        expect(result["Completeness Review Due Date"]["offsetChecks"].length).toBeGreaterThan(0);
        expect(result["State Application Submitted Date"]["offsetChecks"].length).toBeGreaterThan(
          0
        );
      });

      it("should include the 1 day and 30 day offsets for the federal comment period", () => {
        const result = makeValidations(new SemVer(versionNumber));
        expect(result["State Application Deemed Complete"]["offsetChecks"]).toHaveLength(1);
        expect(result["Federal Comment Period Start Date"]["offsetChecks"]).toHaveLength(2);
        expect(result["Federal Comment Period End Date"]["offsetChecks"]).toHaveLength(1);
      });

      it("should not include flexible offset checks, weekend and holiday checks, or less than checks", () => {
        const result = makeValidations(new SemVer(versionNumber));
        for (const [dateType, checks] of Object.entries(result)) {
          expect(checks, dateType).toMatchObject({
            allowedToBeWeekend: true,
            allowedToBeHoliday: true,
            flexibleOffsetChecks: [],
            lessThanChecks: [],
          });
        }
      });
    });

    describe("from 1.3.0", () => {
      const versionNumber = "1.3.0";
      it("should not include the 15-day offset for Completeness Review Due Date in the validations", () => {
        const result = makeValidations(new SemVer(versionNumber));
        expect(result["Completeness Review Due Date"]["offsetChecks"]).toHaveLength(0);
        expect(result["State Application Submitted Date"]["offsetChecks"]).toHaveLength(0);
      });
      it("should not include the 1 day and 30 day offsets for the federal comment period", () => {
        const result = makeValidations(new SemVer(versionNumber));
        expect(result["State Application Deemed Complete"]["offsetChecks"]).toHaveLength(0);
        expect(result["Federal Comment Period Start Date"]["offsetChecks"]).toHaveLength(0);
        expect(result["Federal Comment Period End Date"]["offsetChecks"]).toHaveLength(0);
      });
      it("should include flexible offset checks, weekend and holiday checks, and less than checks", () => {
        const result = makeValidations(new SemVer(versionNumber));
        expect(result["Completeness Review Due Date"]["allowedToBeWeekend"]).toBe(false);
        expect(result["Completeness Review Due Date"]["allowedToBeHoliday"]).toBe(false);
        expect(result["Completeness Review Due Date"]["flexibleOffsetChecks"]).toHaveLength(1);
        expect(result["State Application Submitted Date"]["lessThanChecks"]).toHaveLength(1);
      });
      it("should include ordering checks for federal comment period", () => {
        const result = makeValidations(new SemVer(versionNumber));
        expect(result["State Application Deemed Complete"]["lessThanChecks"]).toHaveLength(1);
        expect(result["Federal Comment Period Start Date"]["lessThanChecks"]).toHaveLength(1);
        expect(result["Federal Comment Period Start Date"]["greaterThanChecks"]).toHaveLength(1);
        expect(result["Federal Comment Period End Date"]["greaterThanChecks"]).toHaveLength(1);
      });
    });
  });

  describe("makeApplicationDateMapFromList", () => {
    it("should create an ApplicationDateMap from a list", () => {
      const testInput: ParsedApplicationDateInput[] = [
        { dateType: "Concept Completion Date", dateValue: testDateValue },
        { dateType: "BNPMT Initial Meeting Date", dateValue: testDateValue },
      ];
      const expectedResult: ApplicationDateMap = new Map([
        ["Concept Completion Date", testDateValue],
        ["BNPMT Initial Meeting Date", testDateValue],
      ]);
      const result = makeApplicationDateMapFromList(testInput);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("validateInputDates", () => {
    const testInput: ParsedApplicationDateInput[] = DATE_TYPES.map((dateType) => ({
      dateType: dateType,
      dateValue: testDateValue,
    }));
    const testApplicationDateMap = makeApplicationDateMapFromList(testInput);

    it("should run checkInputDateIsStartOfDay on start of day dates", () => {
      const startOfDayDateTypes: DateType[] = [
        "Concept Start Date",
        "Concept Paper Submitted Date",
        "Concept Completion Date",
        "Concept Skipped Date",
        "Application Intake Start Date",
        "State Application Submitted Date",
        "Application Intake Completion Date",
        "Completeness Start Date",
        "State Application Deemed Complete",
        "Federal Comment Period Start Date",
        "Completeness Completion Date",
        "SDG Preparation Start Date",
        "State Requested Approval Date",
        "Internal Expected Approval Date",
        "SME Initial Review Date",
        "FRT Initial Meeting Date",
        "BNPMT Initial Meeting Date",
        "SDG Preparation Completion Date",
        "Review Start Date",
        "Review Completion Date",
        "OGD Approval to Share with SMEs",
        "Draft Approval Package to Prep",
        "DDME Approval Received",
        "State Concurrence",
        "BN PMT Approval to Send to OMB",
        "Draft Approval Package Shared",
        "Receive OMB Concurrence",
        "Receive OGC Legal Clearance",
        "Approval Package Start Date",
        "Approval Package Completion Date",
        "Package Sent for COMMs Clearance",
        "COMMs Clearance Received",
        "Submit Approval Package to OSORA",
        "Application Details Marked Complete Date",
        "Application Demonstration Types Marked Complete Date",
        "Approval Summary Start Date",
        "Approval Summary Completion Date",
        "Application Approval Date",
        "OACT Certification Date",
      ];
      const expectedCalls = startOfDayDateTypes.map((dateType) => [dateType, testDateValue]);

      validateInputDates(testInput, new SemVer("0.0.1"));
      expect(checkInputDateIsStartOfDay).toHaveBeenCalledTimes(startOfDayDateTypes.length);
      expect(vi.mocked(checkInputDateIsStartOfDay).mock.calls.sort()).toEqual(expectedCalls.sort());
    });

    it("should run checkInputDateIsEndOfDay on end of day dates", () => {
      const endOfDayDateTypes: DateType[] = [
        "Federal Comment Period End Date",
        "Completeness Review Due Date",
        "OSORA R1 Comments Due",
        "OSORA R2 Comments Due",
        "CMS (OSORA) Clearance End",
      ];
      const expectedCalls = endOfDayDateTypes.map((dateType) => [dateType, testDateValue]);

      validateInputDates(testInput, new SemVer("0.0.1"));
      expect(checkInputDateIsEndOfDay).toHaveBeenCalledTimes(endOfDayDateTypes.length);
      expect(vi.mocked(checkInputDateIsEndOfDay).mock.calls.sort()).toEqual(expectedCalls.sort());
    });

    it("should run checkInputDateGreaterThan on dates with that check", () => {
      const greaterThanCheckTypes: [DateType, DateType][] = [];
      const expectedCalls = greaterThanCheckTypes.map((checkType) => [
        testApplicationDateMap,
        checkType[0],
        checkType[1],
      ]);

      validateInputDates(testInput, new SemVer("0.0.1"));
      expect(checkInputDateGreaterThan).toHaveBeenCalledTimes(greaterThanCheckTypes.length);
      expect(vi.mocked(checkInputDateGreaterThan).mock.calls.sort()).toEqual(expectedCalls.sort());
    });

    it("should run checkInputDateGreaterThanOrEqual on dates with that check", () => {
      const greaterThanOrEqualCheckTypes: [DateType, DateType][] = [
        ["Concept Completion Date", "Concept Start Date"],
        ["Concept Skipped Date", "Concept Start Date"],
        ["Application Intake Completion Date", "Application Intake Start Date"],
        ["Completeness Completion Date", "Completeness Start Date"],
        ["SDG Preparation Completion Date", "SDG Preparation Start Date"],
        ["Approval Package Completion Date", "Approval Package Start Date"],
        ["Review Completion Date", "Review Start Date"],
        ["State Application Deemed Complete", "State Application Submitted Date"],
      ];
      const expectedCalls = greaterThanOrEqualCheckTypes.map((checkType) => [
        testApplicationDateMap,
        checkType[0],
        checkType[1],
      ]);

      validateInputDates(testInput, new SemVer("0.0.1"));
      expect(checkInputDateGreaterThanOrEqual).toHaveBeenCalledTimes(
        greaterThanOrEqualCheckTypes.length
      );
      expect(vi.mocked(checkInputDateGreaterThanOrEqual).mock.calls.sort()).toEqual(
        expectedCalls.sort()
      );
    });

    describe("before 1.3.0", () => {
      const versionNumber = "1.2.0";

      it("should run checkInputDateMeetsOffset on dates with that check", () => {
        const offsetCheckTypes: [DateType, DateType, DateOffset][] = [
          [
            "Completeness Review Due Date",
            "State Application Submitted Date",
            {
              days: 15,
              expectedTimestamp: "End of Day",
            },
          ],
          [
            "State Application Submitted Date",
            "Completeness Review Due Date",
            {
              days: -15,
              expectedTimestamp: "Start of Day",
            },
          ],
          [
            "Federal Comment Period Start Date",
            "State Application Deemed Complete",
            {
              days: 1,
              expectedTimestamp: "Start of Day",
            },
          ],
          [
            "State Application Deemed Complete",
            "Federal Comment Period Start Date",
            {
              days: -1,
              expectedTimestamp: "Start of Day",
            },
          ],
          [
            "Federal Comment Period End Date",
            "Federal Comment Period Start Date",
            {
              days: 30,
              expectedTimestamp: "End of Day",
            },
          ],
          [
            "Federal Comment Period Start Date",
            "Federal Comment Period End Date",
            {
              days: -30,
              expectedTimestamp: "Start of Day",
            },
          ],
        ];
        const expectedCalls = offsetCheckTypes.map((dateType) => [
          testApplicationDateMap,
          dateType[0],
          dateType[1],
          dateType[2],
        ]);

        validateInputDates(testInput, new SemVer(versionNumber));
        expect(checkInputDateMeetsOffset).toHaveBeenCalledTimes(offsetCheckTypes.length);
        expect(vi.mocked(checkInputDateMeetsOffset).mock.calls.sort()).toEqual(
          expectedCalls.sort()
        );
      });

      it("should not run any checks for weekends or holidays", () => {
        validateInputDates(testInput, new SemVer(versionNumber));
        expect(checkInputDateNotWeekend).not.toHaveBeenCalled();
        expect(checkInputDateNotHoliday).not.toHaveBeenCalled();
      });

      it("should not run any less than checks", () => {
        validateInputDates(testInput, new SemVer(versionNumber));
        expect(checkInputDateLessThan).not.toHaveBeenCalled();
      });

      it("should not run the greater than checks added later", () => {
        const expectedNonCalls = [
          [
            testApplicationDateMap,
            "Federal Comment Period Start Date",
            "State Application Deemed Complete",
          ],
          [
            testApplicationDateMap,
            "Federal Comment Period End Date",
            "Federal Comment Period Start Date",
          ],
        ];

        validateInputDates(testInput, new SemVer(versionNumber));
        expect(checkInputDateGreaterThan).not.toHaveBeenCalledWith(...expectedNonCalls[0]);
        expect(checkInputDateGreaterThan).not.toHaveBeenCalledWith(...expectedNonCalls[1]);
      });

      it("should not run any flexible offset checks", () => {
        validateInputDates(testInput, new SemVer(versionNumber));
        expect(checkInputDateMeetsFlexibleOffset).not.toHaveBeenCalled();
      });
    });

    describe("from 1.3.0", () => {
      const versionNumber = "1.3.0";

      it("should run checkInputDateMeetsOffset on dates with that check (now none)", () => {
        validateInputDates(testInput, new SemVer(versionNumber));
        expect(checkInputDateMeetsOffset).not.toHaveBeenCalled();
      });

      it("should run checks for weekends and holidays on one date", () => {
        validateInputDates(testInput, new SemVer(versionNumber));
        expect(checkInputDateNotWeekend).toHaveBeenCalledExactlyOnceWith(
          testApplicationDateMap,
          "Completeness Review Due Date"
        );
        expect(checkInputDateNotHoliday).toHaveBeenCalledExactlyOnceWith(
          testApplicationDateMap,
          "Completeness Review Due Date"
        );
      });

      it("should run less than checks added", () => {
        const expectedCalls = [
          [
            testApplicationDateMap,
            "State Application Submitted Date",
            "Completeness Review Due Date",
          ],
          [
            testApplicationDateMap,
            "State Application Deemed Complete",
            "Federal Comment Period Start Date",
          ],
          [
            testApplicationDateMap,
            "Federal Comment Period Start Date",
            "Federal Comment Period End Date",
          ],
        ];

        validateInputDates(testInput, new SemVer(versionNumber));
        expect(vi.mocked(checkInputDateLessThan).mock.calls.sort()).toEqual(expectedCalls.sort());
      });

      it("should run greater than checks added", () => {
        const expectedCalls = [
          [
            testApplicationDateMap,
            "Federal Comment Period Start Date",
            "State Application Deemed Complete",
          ],
          [
            testApplicationDateMap,
            "Federal Comment Period End Date",
            "Federal Comment Period Start Date",
          ],
        ];

        validateInputDates(testInput, new SemVer(versionNumber));
        expect(checkInputDateGreaterThan).toHaveBeenCalledWith(...expectedCalls[0]);
        expect(checkInputDateGreaterThan).toHaveBeenCalledWith(...expectedCalls[1]);
      });

      it("should run flexible offset checks", () => {
        validateInputDates(testInput, new SemVer(versionNumber));
        expect(checkInputDateMeetsFlexibleOffset).toHaveBeenCalledExactlyOnceWith(
          testApplicationDateMap,
          "Completeness Review Due Date",
          "State Application Submitted Date",
          {
            days: 15,
            expectedTimestamp: "End of Day",
          }
        );
      });
    });
  });
});
