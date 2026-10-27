import { describe, it, expect } from "vitest";
import { DateType } from "../../types";
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
  getDateValueFromApplicationDateMap,
} from "./checkInputDateFunctions";
import { DateOffset, ApplicationDateMap } from ".";
import { EasternTZDate } from "../../dateUtilities";
import { TZDate } from "@date-fns/tz";

const OFFSET_TEST_CASES = [
  "bothDatesESTStartToStart",
  "bothDatesESTStartToEnd",
  "bothDatesESTEndToEnd",
  "bothDatesESTEndToStart",
  "negativeBothDatesESTStartToStart",
  "negativeBothDatesESTStartToEnd",
  "negativeBothDatesESTEndToEnd",
  "negativeBothDatesESTEndToStart",
  "bothDatesEDTStartToStart",
  "bothDatesEDTStartToEnd",
  "bothDatesEDTEndToEnd",
  "bothDatesEDTEndToStart",
  "EDTtoESTStartToStart",
  "EDTtoESTStartToEnd",
  "EDTtoESTEndToEnd",
  "EDTtoESTEndToStart",
  "ESTtoEDTStartToStart",
  "ESTtoEDTStartToEnd",
  "ESTtoEDTEndToEnd",
  "ESTtoEDTEndToStart",
] as const;
type OffsetTestCase = (typeof OFFSET_TEST_CASES)[number];
type TestOffsetValues = {
  offset: DateOffset;
  before: EasternTZDate;
  after: EasternTZDate;
};
type OffsetTestCaseRecord = Record<OffsetTestCase, TestOffsetValues>;

const OFFEST_TEST_CASE_VALUES: OffsetTestCaseRecord = {
  bothDatesESTStartToStart: {
    offset: {
      days: 4,
      expectedTimestamp: "Start of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 1, 0, 0, 0, 0, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 5, 0, 0, 0, 0, "America/New_York"),
    },
  },
  bothDatesESTStartToEnd: {
    offset: {
      days: 4,
      expectedTimestamp: "End of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 1, 0, 0, 0, 0, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 5, 23, 59, 59, 999, "America/New_York"),
    },
  },
  bothDatesESTEndToEnd: {
    offset: {
      days: 4,
      expectedTimestamp: "End of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 1, 23, 59, 59, 999, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 5, 23, 59, 59, 999, "America/New_York"),
    },
  },
  bothDatesESTEndToStart: {
    offset: {
      days: 4,
      expectedTimestamp: "Start of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 1, 23, 59, 59, 999, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 5, 0, 0, 0, 0, "America/New_York"),
    },
  },
  negativeBothDatesESTStartToStart: {
    offset: {
      days: -4,
      expectedTimestamp: "Start of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 5, 0, 0, 0, 0, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 1, 0, 0, 0, 0, "America/New_York"),
    },
  },
  negativeBothDatesESTStartToEnd: {
    offset: {
      days: -4,
      expectedTimestamp: "End of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 5, 0, 0, 0, 0, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 1, 23, 59, 59, 999, "America/New_York"),
    },
  },
  negativeBothDatesESTEndToEnd: {
    offset: {
      days: -4,
      expectedTimestamp: "End of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 5, 23, 59, 59, 999, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 1, 23, 59, 59, 999, "America/New_York"),
    },
  },
  negativeBothDatesESTEndToStart: {
    offset: {
      days: -4,
      expectedTimestamp: "Start of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 5, 23, 59, 59, 999, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 6, 1, 0, 0, 0, 0, "America/New_York"),
    },
  },
  bothDatesEDTStartToStart: {
    offset: {
      days: 4,
      expectedTimestamp: "Start of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 11, 1, 0, 0, 0, 0, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 11, 5, 0, 0, 0, 0, "America/New_York"),
    },
  },
  bothDatesEDTStartToEnd: {
    offset: {
      days: 4,
      expectedTimestamp: "End of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 11, 1, 0, 0, 0, 0, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 11, 5, 23, 59, 59, 999, "America/New_York"),
    },
  },
  bothDatesEDTEndToEnd: {
    offset: {
      days: 4,
      expectedTimestamp: "End of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 11, 1, 23, 59, 59, 999, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 11, 5, 23, 59, 59, 999, "America/New_York"),
    },
  },
  bothDatesEDTEndToStart: {
    offset: {
      days: 4,
      expectedTimestamp: "Start of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 11, 1, 23, 59, 59, 999, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 11, 5, 0, 0, 0, 0, "America/New_York"),
    },
  },
  EDTtoESTStartToStart: {
    offset: {
      days: 4,
      expectedTimestamp: "Start of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 9, 31, 0, 0, 0, 0, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 10, 4, 0, 0, 0, 0, "America/New_York"),
    },
  },
  EDTtoESTStartToEnd: {
    offset: {
      days: 4,
      expectedTimestamp: "End of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 9, 31, 0, 0, 0, 0, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 10, 4, 23, 59, 59, 999, "America/New_York"),
    },
  },
  EDTtoESTEndToEnd: {
    offset: {
      days: 4,
      expectedTimestamp: "End of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 9, 31, 23, 59, 59, 999, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 10, 4, 23, 59, 59, 999, "America/New_York"),
    },
  },
  EDTtoESTEndToStart: {
    offset: {
      days: 4,
      expectedTimestamp: "Start of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 9, 31, 23, 59, 59, 999, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 10, 4, 0, 0, 0, 0, "America/New_York"),
    },
  },
  ESTtoEDTStartToStart: {
    offset: {
      days: 4,
      expectedTimestamp: "Start of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 2, 6, 0, 0, 0, 0, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 2, 10, 0, 0, 0, 0, "America/New_York"),
    },
  },
  ESTtoEDTStartToEnd: {
    offset: {
      days: 4,
      expectedTimestamp: "End of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 2, 6, 0, 0, 0, 0, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 2, 10, 23, 59, 59, 999, "America/New_York"),
    },
  },
  ESTtoEDTEndToEnd: {
    offset: {
      days: 4,
      expectedTimestamp: "End of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 2, 6, 23, 59, 59, 999, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 2, 10, 23, 59, 59, 999, "America/New_York"),
    },
  },
  ESTtoEDTEndToStart: {
    offset: {
      days: 4,
      expectedTimestamp: "Start of Day",
    },
    before: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 2, 6, 23, 59, 59, 999, "America/New_York"),
    },
    after: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 2, 10, 0, 0, 0, 0, "America/New_York"),
    },
  },
};

function makeOffsetTest(testName: string, input: TestOffsetValues) {
  it(`should not throw when the input matches the target plus the offset (${testName})`, () => {
    const testApplicationDateMap: ApplicationDateMap = new Map([
      ["Concept Completion Date", input.after],
      ["Concept Start Date", input.before],
    ]);
    expect(() =>
      checkInputDateMeetsOffset(
        testApplicationDateMap,
        "Concept Completion Date",
        "Concept Start Date",
        input.offset
      )
    ).not.toThrow();
  });
}

describe("checkInputDateFunctions", () => {
  const testInputDateType: DateType = "Concept Completion Date";
  const testTargetDateType: DateType = "Concept Start Date";
  const testDateValue: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate(2025, 1, 7, 11, 14, 25, 313, "America/New_York"),
  };
  const testAfterDateValue: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate(2025, 1, 15, 8, 11, 19, 483, "America/New_York"),
  };
  const testBeforeDateValue: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate(2025, 0, 11, 17, 54, 33, 4, "America/New_York"),
  };

  describe("checkInputDateIsStartOfDay", () => {
    it("should not throw when given a valid start of day date in EST", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 1, 1, 0, 0, 0, 0, "America/New_York"),
      };
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).not.toThrow();
    });

    it("should throw when given a invalid start of day hour value in EST", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 1, 1, 4, 0, 0, 0, "America/New_York"),
      };
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day minute value in EST", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 1, 1, 0, 1, 0, 0, "America/New_York"),
      };
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day second value in EST", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 1, 1, 0, 0, 1, 0, "America/New_York"),
      };
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day millisecond value in EST", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 1, 1, 0, 0, 0, 1, "America/New_York"),
      };
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should not throw when given a valid start of day date in EDT", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 7, 1, 0, 0, 0, 0, "America/New_York"),
      };
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).not.toThrow();
    });

    it("should throw when given a invalid start of day hour value in EDT", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 7, 1, 1, 0, 0, 0, "America/New_York"),
      };
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day minute value in EDT", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 1, 7, 0, 1, 0, 0, "America/New_York"),
      };
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day second value in EDT", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 7, 1, 0, 0, 1, 0, "America/New_York"),
      };
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid start of day millisecond value in EDT", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 7, 1, 0, 0, 0, 1, "America/New_York"),
      };
      expect(() => checkInputDateIsStartOfDay(testInputDateType, testInputDateValue)).toThrow();
    });
  });

  describe("checkInputDateIsEndOfDay", () => {
    it("should not throw when given a valid end of day date in EST", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 1, 1, 23, 59, 59, 999, "America/New_York"),
      };
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).not.toThrow();
    });

    it("should throw when given a invalid end of day hour value in EST", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 1, 1, 22, 59, 59, 999, "America/New_York"),
      };
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day minute value in EST", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 1, 1, 23, 58, 59, 999, "America/New_York"),
      };
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day second value in EST", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 1, 1, 23, 59, 58, 999, "America/New_York"),
      };
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day millisecond value in EST", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 1, 1, 23, 59, 59, 998, "America/New_York"),
      };
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should not throw when given a valid end of day date in EDT", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 8, 1, 23, 59, 59, 999, "America/New_York"),
      };
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).not.toThrow();
    });

    it("should throw when given a invalid end of day hour value in EDT", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 8, 1, 22, 59, 59, 999, "America/New_York"),
      };
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day minute value in EDT", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 8, 1, 23, 58, 59, 999, "America/New_York"),
      };
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day second value in EDT", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 8, 1, 23, 59, 58, 999, "America/New_York"),
      };
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });

    it("should throw when given a invalid end of day millisecond value in EDT", () => {
      const testInputDateValue: EasternTZDate = {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2025, 8, 1, 23, 59, 59, 998, "America/New_York"),
      };
      expect(() => checkInputDateIsEndOfDay(testInputDateType, testInputDateValue)).toThrow();
    });
  });

  describe("getDateValueFromApplicationDateMap", () => {
    it("should extract a date from a date map", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testDateValue],
      ]);
      const result = getDateValueFromApplicationDateMap(testInputDateType, testApplicationDateMap);
      expect(result).toBe(testDateValue);
    });

    it("should throw if the date isn't found", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testDateValue],
      ]);
      expect(() =>
        getDateValueFromApplicationDateMap(testTargetDateType, testApplicationDateMap)
      ).toThrow(
        `The date ${testTargetDateType} was requested as part of a validation, but is undefined. ` +
          `It must either be in the database, or part of the set of dates being changed.`
      );
    });
  });

  describe("checkInputDateGreaterThan", () => {
    it("should not throw when the date is greater than the target", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testAfterDateValue],
        [testTargetDateType, testDateValue],
      ]);
      expect(() =>
        checkInputDateGreaterThan(testApplicationDateMap, testInputDateType, testTargetDateType)
      ).not.toThrow();
    });

    it("should throw when the date is less than the target", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testBeforeDateValue],
        [testTargetDateType, testDateValue],
      ]);
      const expectedError =
        `The input ${testInputDateType} has value ${testBeforeDateValue.easternTZDate.toISOString()}, ` +
        `but it must be greater than ${testTargetDateType}, ` +
        `which has value ${testDateValue.easternTZDate.toISOString()}.`;
      expect(() =>
        checkInputDateGreaterThan(testApplicationDateMap, testInputDateType, testTargetDateType)
      ).toThrow(expectedError);
    });

    it("should throw when the date is equal to the target", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testDateValue],
        [testTargetDateType, testDateValue],
      ]);
      const expectedError =
        `The input ${testInputDateType} has value ${testDateValue.easternTZDate.toISOString()}, ` +
        `but it must be greater than ${testTargetDateType}, ` +
        `which has value ${testDateValue.easternTZDate.toISOString()}.`;
      expect(() =>
        checkInputDateGreaterThan(testApplicationDateMap, testInputDateType, testTargetDateType)
      ).toThrow(expectedError);
    });
  });

  describe("checkInputDateGreaterThanOrEqual", () => {
    it("should not throw when the date is greater than the target", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testAfterDateValue],
        [testTargetDateType, testDateValue],
      ]);
      expect(() =>
        checkInputDateGreaterThanOrEqual(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType
        )
      ).not.toThrow();
    });

    it("should throw when the date is less than the target", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testBeforeDateValue],
        [testTargetDateType, testDateValue],
      ]);
      const expectedError =
        `The input ${testInputDateType} has value ${testBeforeDateValue.easternTZDate.toISOString()}, ` +
        `but it must be greater than or equal to ${testTargetDateType}, ` +
        `which has value ${testDateValue.easternTZDate.toISOString()}.`;
      expect(() =>
        checkInputDateGreaterThanOrEqual(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType
        )
      ).toThrow(expectedError);
    });

    it("should not throw when the date is equal to the target", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testDateValue],
        [testTargetDateType, testDateValue],
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
    for (const offset of OFFSET_TEST_CASES) {
      makeOffsetTest(offset, OFFEST_TEST_CASE_VALUES[offset]);
    }

    it("should throw when the input does not numerically match the target plus the offset", () => {
      const testValues: TestOffsetValues = {
        offset: {
          days: 5,
          expectedTimestamp: "Start of Day",
        },
        before: OFFEST_TEST_CASE_VALUES.bothDatesESTStartToStart.before,
        after: OFFEST_TEST_CASE_VALUES.bothDatesESTStartToStart.after,
      };
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testValues.after],
        [testTargetDateType, testValues.before],
      ]);
      const expectedError =
        `The input ${testInputDateType} must be equal to ${testTargetDateType} +${testValues.offset.days} days ` +
        "and should have a timestamp that is start of day. " +
        `The value provided was ${testValues.after.easternTZDate.toISOString()}.`;

      expect(() =>
        checkInputDateMeetsOffset(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType,
          testValues.offset
        )
      ).toThrow(expectedError);
    });

    it("should throw when the input does not numerically match the target minus the offset", () => {
      const testValues: TestOffsetValues = {
        offset: {
          days: -5,
          expectedTimestamp: "Start of Day",
        },
        before: OFFEST_TEST_CASE_VALUES.negativeBothDatesESTStartToStart.before,
        after: OFFEST_TEST_CASE_VALUES.negativeBothDatesESTStartToStart.after,
      };
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testValues.after],
        [testTargetDateType, testValues.before],
      ]);
      const expectedError =
        `The input ${testInputDateType} must be equal to ${testTargetDateType} ${testValues.offset.days} days ` +
        "and should have a timestamp that is start of day. " +
        `The value provided was ${testValues.after.easternTZDate.toISOString()}.`;

      expect(() =>
        checkInputDateMeetsOffset(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType,
          testValues.offset
        )
      ).toThrow(expectedError);
    });

    it("should throw when the input does not have the right expected timestamp", () => {
      const testValues: TestOffsetValues = {
        offset: {
          days: 4,
          expectedTimestamp: "End of Day",
        },
        before: OFFEST_TEST_CASE_VALUES.bothDatesEDTStartToStart.before,
        after: OFFEST_TEST_CASE_VALUES.bothDatesEDTStartToStart.after,
      };
      const testInputDateType = "Federal Comment Period End Date";
      const testTargetDateType = "Federal Comment Period Start Date";
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testValues.after],
        [testTargetDateType, testValues.before],
      ]);
      const expectedError =
        `The input ${testInputDateType} must be an end of day date (23:59:59.999 in Eastern time), but it is ` +
        `${testValues.after.easternTZDate.toISOString()}.`;

      expect(() =>
        checkInputDateMeetsOffset(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType,
          testValues.offset
        )
      ).toThrow(expectedError);
    });
  });

  describe("checkInputDateNotWeekend", () => {
    it("should not throw if the day is not a weekend day", () => {
      const testDate: EasternTZDate = {
        easternTZDate: new TZDate("2026-10-22T00:00:00.000-04:00", "America/New_York"),
        isEasternTZDate: true,
      };
      const testApplicationDateMap: ApplicationDateMap = new Map([
        ["Application Demonstration Types Marked Complete Date", testDate],
      ]);

      expect(() =>
        checkInputDateNotWeekend(
          testApplicationDateMap,
          "Application Demonstration Types Marked Complete Date"
        )
      ).not.toThrow();
    });

    it("should throw if the day is a weekend day", () => {
      const testDate: EasternTZDate = {
        easternTZDate: new TZDate("2026-10-24T23:59:59.999-04:00", "America/New_York"),
        isEasternTZDate: true,
      };
      const testApplicationDateMap: ApplicationDateMap = new Map([
        ["Application Demonstration Types Marked Complete Date", testDate],
      ]);
      const expectedError =
        "The input Application Demonstration Types Marked Complete Date must not be a Saturday or Sunday. " +
        `The value provided was ${testDate.easternTZDate.toISOString()}.`;

      expect(() =>
        checkInputDateNotWeekend(
          testApplicationDateMap,
          "Application Demonstration Types Marked Complete Date"
        )
      ).toThrow(expectedError);
    });
  });

  describe("checkInputDateNotHoliday", () => {
    it("should not throw if the day is not a holiday", () => {
      const testDate: EasternTZDate = {
        easternTZDate: new TZDate("2026-09-08T00:00:00.000-04:00", "America/New_York"),
        isEasternTZDate: true,
      };
      const testApplicationDateMap: ApplicationDateMap = new Map([
        ["Application Demonstration Types Marked Complete Date", testDate],
      ]);

      expect(() =>
        checkInputDateNotHoliday(
          testApplicationDateMap,
          "Application Demonstration Types Marked Complete Date"
        )
      ).not.toThrow();
    });

    it("should throw if the day is a holiday", () => {
      const testDate: EasternTZDate = {
        easternTZDate: new TZDate("2026-09-07T23:59:59.999-04:00", "America/New_York"),
        isEasternTZDate: true,
      };
      const testApplicationDateMap: ApplicationDateMap = new Map([
        ["Application Demonstration Types Marked Complete Date", testDate],
      ]);
      const expectedError =
        "The input Application Demonstration Types Marked Complete Date must not be a federal holiday. " +
        `The value provided was ${testDate.easternTZDate.toISOString()}.`;

      expect(() =>
        checkInputDateNotHoliday(
          testApplicationDateMap,
          "Application Demonstration Types Marked Complete Date"
        )
      ).toThrow(expectedError);
    });
  });

  describe("checkInputDateLessThan", () => {
    it("should not throw when the date is less than the target", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testBeforeDateValue],
        [testTargetDateType, testDateValue],
      ]);
      expect(() =>
        checkInputDateLessThan(testApplicationDateMap, testInputDateType, testTargetDateType)
      ).not.toThrow();
    });

    it("should throw when the date is greater than the target", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testAfterDateValue],
        [testTargetDateType, testDateValue],
      ]);
      const expectedError =
        `The input ${testInputDateType} has value ${testAfterDateValue.easternTZDate.toISOString()}, ` +
        `but it must be less than ${testTargetDateType}, ` +
        `which has value ${testDateValue.easternTZDate.toISOString()}.`;
      expect(() =>
        checkInputDateLessThan(testApplicationDateMap, testInputDateType, testTargetDateType)
      ).toThrow(expectedError);
    });

    it("should throw when the date is equal to the target", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testDateValue],
        [testTargetDateType, testDateValue],
      ]);
      const expectedError =
        `The input ${testInputDateType} has value ${testDateValue.easternTZDate.toISOString()}, ` +
        `but it must be less than ${testTargetDateType}, ` +
        `which has value ${testDateValue.easternTZDate.toISOString()}.`;
      expect(() =>
        checkInputDateLessThan(testApplicationDateMap, testInputDateType, testTargetDateType)
      ).toThrow(expectedError);
    });
  });

  describe("checkInputDateMeetsFlexibleOffset", () => {
    const passingCases: {
      name: string;
      offsetDays: number;
      after: string;
    }[] = [
      {
        name: "should not throw when the offset is adjusted for holidays or weekends",
        offsetDays: 2, // Falls on Jan 1, 2027, a federal holiday
        after: "2026-12-31T23:59:59.999-05:00",
      },
      {
        name: "should adjust the offset for multiple days if needed",
        offsetDays: 4, // Falls on Jan 3, 2027, a Sunday
        after: "2026-12-31T23:59:59.999-05:00",
      },
      {
        name: "should not throw if given a range that does not need adjusting",
        offsetDays: 6, // Falls on Jan 5, 2027, a Tuesday
        after: "2027-01-05T23:59:59.999-05:00",
      },
    ];

    it.each(passingCases)("$name", ({ offsetDays, after }) => {
      const testValues: TestOffsetValues = {
        offset: {
          days: offsetDays,
          expectedTimestamp: "End of Day",
        },
        before: {
          easternTZDate: new TZDate("2026-12-30T00:00:00.000-05:00", "America/New_York"),
          isEasternTZDate: true,
        },
        after: {
          easternTZDate: new TZDate(after, "America/New_York"),
          isEasternTZDate: true,
        },
      };
      const testInputDateType: DateType = "Completeness Review Due Date";
      const testTargetDateType: DateType = "State Application Submitted Date";
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testValues.after],
        [testTargetDateType, testValues.before],
      ]);

      expect(() =>
        checkInputDateMeetsFlexibleOffset(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType,
          testValues.offset
        )
      ).not.toThrow();
    });

    it("should throw if the provided dates don't match the offset, accounting for holidays and weekends", () => {
      const testValues: TestOffsetValues = {
        offset: {
          days: 5,
          expectedTimestamp: "End of Day",
        },
        before: {
          easternTZDate: new TZDate("2026-12-30T00:00:00.000-05:00", "America/New_York"),
          isEasternTZDate: true,
        },
        after: {
          easternTZDate: new TZDate("2026-12-31T23:59:59.999-05:00", "America/New_York"),
          isEasternTZDate: true,
        },
      };
      const testInputDateType: DateType = "Completeness Review Due Date";
      const testTargetDateType: DateType = "State Application Submitted Date";
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testValues.after],
        [testTargetDateType, testValues.before],
      ]);
      const expectedError =
        `The input ${testInputDateType} must be equal to ${testTargetDateType} +${testValues.offset.days} days, ` +
        "accounting for weekends and holidays, and it should have a timestamp that is end of day. " +
        `The value provided was ${testValues.after.easternTZDate.toISOString()}.`;

      expect(() =>
        checkInputDateMeetsFlexibleOffset(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType,
          testValues.offset
        )
      ).toThrow(expectedError);
    });

    it("should correctly handle when the walkback yields a different result than the payload", () => {
      const testValues: TestOffsetValues = {
        offset: {
          days: 5, // Jan 3, 2027, a Sunday
          expectedTimestamp: "End of Day",
        },
        before: {
          easternTZDate: new TZDate("2026-12-29T00:00:00.000-05:00", "America/New_York"),
          isEasternTZDate: true,
        },
        after: {
          easternTZDate: new TZDate("2026-12-30T23:59:59.999-05:00", "America/New_York"),
          isEasternTZDate: true,
        },
      };
      const testInputDateType: DateType = "Completeness Review Due Date";
      const testTargetDateType: DateType = "State Application Submitted Date";
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testValues.after],
        [testTargetDateType, testValues.before],
      ]);
      const expectedError =
        `The input ${testInputDateType} must be equal to ${testTargetDateType} +${testValues.offset.days} days, ` +
        "accounting for weekends and holidays, and it should have a timestamp that is end of day. " +
        `The value provided was ${testValues.after.easternTZDate.toISOString()}.`;

      expect(() =>
        checkInputDateMeetsFlexibleOffset(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType,
          testValues.offset
        )
      ).toThrow(expectedError);
    });

    it("should throw if the provided input is already a weekend or holiday", () => {
      const testValues: TestOffsetValues = {
        offset: {
          days: 2,
          expectedTimestamp: "End of Day",
        },
        before: {
          easternTZDate: new TZDate("2026-12-30T00:00:00.000-05:00", "America/New_York"),
          isEasternTZDate: true,
        },
        after: {
          easternTZDate: new TZDate("2027-01-01T23:59:59.999-05:00", "America/New_York"),
          isEasternTZDate: true,
        },
      };
      const testInputDateType: DateType = "Completeness Review Due Date";
      const testTargetDateType: DateType = "State Application Submitted Date";
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testValues.after],
        [testTargetDateType, testValues.before],
      ]);
      const expectedError =
        `A flexible offset check was attempted between input ${testInputDateType} ` +
        `and ${testTargetDateType}, but the provided input date ` +
        `of ${testValues.after.easternTZDate.toISOString()} ` +
        "falls on a holiday or weekend.";

      expect(() =>
        checkInputDateMeetsFlexibleOffset(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType,
          testValues.offset
        )
      ).toThrow(expectedError);
    });

    it("should throw if attempting an offset of 0 or less", () => {
      const testValues: TestOffsetValues = {
        offset: {
          days: -1,
          expectedTimestamp: "End of Day",
        },
        before: {
          easternTZDate: new TZDate("2026-12-30T00:00:00.000-05:00", "America/New_York"),
          isEasternTZDate: true,
        },
        after: {
          easternTZDate: new TZDate("2026-12-31T23:59:59.999-05:00", "America/New_York"),
          isEasternTZDate: true,
        },
      };
      const testInputDateType: DateType = "Completeness Review Due Date";
      const testTargetDateType: DateType = "State Application Submitted Date";
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testValues.after],
        [testTargetDateType, testValues.before],
      ]);
      const expectedError =
        `A flexible offset check was attempted between input ${testInputDateType} ` +
        `and ${testTargetDateType}, but the provided offset value of -1 ` +
        "was less than one.";

      expect(() =>
        checkInputDateMeetsFlexibleOffset(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType,
          testValues.offset
        )
      ).toThrow(expectedError);
    });

    it("should throw if the expected timestamp does not match", () => {
      const testValues: TestOffsetValues = {
        offset: {
          days: 2,
          expectedTimestamp: "Start of Day",
        },
        before: {
          easternTZDate: new TZDate("2026-12-30T00:00:00.000-05:00", "America/New_York"),
          isEasternTZDate: true,
        },
        after: {
          easternTZDate: new TZDate("2026-12-31T23:59:59.999-05:00", "America/New_York"),
          isEasternTZDate: true,
        },
      };
      const testInputDateType: DateType = "Completeness Review Due Date";
      const testTargetDateType: DateType = "State Application Submitted Date";
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testInputDateType, testValues.after],
        [testTargetDateType, testValues.before],
      ]);
      const expectedError =
        `The input ${testInputDateType} must be a start of day date (midnight in Eastern time), but it is ` +
        `${testValues.after.easternTZDate.toISOString()}.`;

      expect(() =>
        checkInputDateMeetsFlexibleOffset(
          testApplicationDateMap,
          testInputDateType,
          testTargetDateType,
          testValues.offset
        )
      ).toThrow(expectedError);
    });
  });
});
