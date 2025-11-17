import { DateType, ExpectedTimestamp, ParsedApplicationDateInput } from "../../types.js";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
  __checkInputDateGreaterThan,
  __checkInputDateGreaterThanOrEqual,
  __checkInputDateMeetsOffset,
  DateOffset,
} from "./checkInputDateFunctions.js";

type ValidationChecks = {
  expectedTimestamp: ExpectedTimestamp;
  greaterThanChecks: { dateTypeToCheck: DateType }[];
  greaterThanOrEqualChecks: { dateTypeToCheck: DateType }[];
  offsetChecks: { dateTypeToCheck: DateType; dateOffset: DateOffset }[];
};

type DateTypeValidationChecksRecord = Record<DateType, ValidationChecks>;

export function __makeEmptyValidations(): DateTypeValidationChecksRecord {
  const result = {} as DateTypeValidationChecksRecord;
  let dateType: DateType;
  for (dateType in DATE_TYPES_WITH_EXPECTED_TIMESTAMPS) {
    result[dateType] = {
      expectedTimestamp: DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[dateType]["expectedTimestamp"],
      greaterThanChecks: [],
      greaterThanOrEqualChecks: [],
      offsetChecks: [],
    };
  }
  return result;
}

export type ApplicationDateMap = Map<DateType, Date>;

export function makeApplicationDateMapFromList(
  inputDates: ParsedApplicationDateInput[]
): ApplicationDateMap {
  return new Map(inputDates.map((inputDate) => [inputDate.dateType, inputDate.dateValue]));
}

const VALIDATION_CHECKS = __makeEmptyValidations();
VALIDATION_CHECKS["Concept Completion Date"]["greaterThanOrEqualChecks"] = [
  { dateTypeToCheck: "Concept Start Date" },
];
VALIDATION_CHECKS["Concept Skipped Date"]["greaterThanOrEqualChecks"] = [
  { dateTypeToCheck: "Concept Start Date" },
];
VALIDATION_CHECKS["Completeness Review Due Date"]["offsetChecks"] = [
  {
    dateTypeToCheck: "State Application Submitted Date",
    dateOffset: {
      days: 15,
      hours: 23,
      minutes: 59,
      seconds: 59,
      milliseconds: 999,
    },
  },
];
VALIDATION_CHECKS["Application Intake Completion Date"]["greaterThanOrEqualChecks"] = [
  { dateTypeToCheck: "Application Intake Start Date" },
  { dateTypeToCheck: "Concept Completion Date" },
];
VALIDATION_CHECKS["State Application Deemed Complete"]["greaterThanOrEqualChecks"] = [
  { dateTypeToCheck: "State Application Submitted Date" },
];
VALIDATION_CHECKS["Federal Comment Period Start Date"]["offsetChecks"] = [
  {
    dateTypeToCheck: "State Application Deemed Complete",
    dateOffset: {
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    },
  },
];
VALIDATION_CHECKS["Federal Comment Period End Date"]["offsetChecks"] = [
  {
    dateTypeToCheck: "Federal Comment Period Start Date",
    dateOffset: {
      days: 30,
      hours: 23,
      minutes: 59,
      seconds: 59,
      milliseconds: 999,
    },
  },
];
VALIDATION_CHECKS["Completeness Completion Date"]["greaterThanOrEqualChecks"] = [
  { dateTypeToCheck: "Completeness Start Date" },
  { dateTypeToCheck: "Application Intake Completion Date" },
];

export function validateInputDates(datesToValidate: ParsedApplicationDateInput[]): void {
  const datesToValidateMap = makeApplicationDateMapFromList(datesToValidate);
  for (const [dateType, dateValue] of datesToValidateMap.entries()) {
    const checks = VALIDATION_CHECKS[dateType];
    if (checks.expectedTimestamp === "Start of Day") {
      checkInputDateIsStartOfDay(dateType, dateValue);
    }
    if (checks.expectedTimestamp === "End of Day") {
      checkInputDateIsEndOfDay(dateType, dateValue);
    }
    if (checks.greaterThanChecks.length !== 0) {
      for (const check of checks.greaterThanChecks) {
        __checkInputDateGreaterThan(datesToValidateMap, dateType, check.dateTypeToCheck);
      }
    }
    if (checks.greaterThanOrEqualChecks.length !== 0) {
      for (const check of checks.greaterThanOrEqualChecks) {
        __checkInputDateGreaterThanOrEqual(datesToValidateMap, dateType, check.dateTypeToCheck);
      }
    }
    if (checks.offsetChecks.length !== 0) {
      for (const check of checks.offsetChecks) {
        __checkInputDateMeetsOffset(
          datesToValidateMap,
          dateType,
          check.dateTypeToCheck,
          check.dateOffset
        );
      }
    }
  }
}
