import { DateType, ParsedApplicationDateInput } from "../../types.js";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateMeetsOffset,
  ApplicationDateMap,
  DateTypeValidationChecksRecord,
} from ".";

export function makeEmptyValidations(): DateTypeValidationChecksRecord {
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

export function makeApplicationDateMapFromList(
  inputDates: ParsedApplicationDateInput[]
): ApplicationDateMap {
  return new Map(inputDates.map((inputDate) => [inputDate.dateType, inputDate.dateValue]));
}

const VALIDATION_CHECKS = makeEmptyValidations();
// Phase completion dates must follow start dates
VALIDATION_CHECKS["Concept Completion Date"]["greaterThanOrEqualChecks"].push({
  dateTypeToCheck: "Concept Start Date",
});
VALIDATION_CHECKS["Concept Skipped Date"]["greaterThanOrEqualChecks"].push({
  dateTypeToCheck: "Concept Start Date",
});
VALIDATION_CHECKS["Application Intake Completion Date"]["greaterThanOrEqualChecks"].push({
  dateTypeToCheck: "Application Intake Start Date",
});
VALIDATION_CHECKS["Completeness Completion Date"]["greaterThanOrEqualChecks"].push({
  dateTypeToCheck: "Completeness Start Date",
});
VALIDATION_CHECKS["SDG Preparation Completion Date"]["greaterThanOrEqualChecks"].push({
  dateTypeToCheck: "SDG Preparation Start Date",
});
VALIDATION_CHECKS["Approval Package Completion Date"]["greaterThanOrEqualChecks"].push({
  dateTypeToCheck: "Approval Package Start Date",
});

// State application must be deemed complete after it is submitted
VALIDATION_CHECKS["State Application Deemed Complete"]["greaterThanOrEqualChecks"].push({
  dateTypeToCheck: "State Application Submitted Date",
});

// Completeness review is 15 days after state application submission
VALIDATION_CHECKS["Completeness Review Due Date"]["offsetChecks"].push({
  dateTypeToCheck: "State Application Submitted Date",
  dateOffset: {
    days: 15,
    hours: 23,
    minutes: 59,
    seconds: 59,
    milliseconds: 999,
  },
});

// Federal comment period starts 1 day after application deemed complete
VALIDATION_CHECKS["Federal Comment Period Start Date"]["offsetChecks"].push({
  dateTypeToCheck: "State Application Deemed Complete",
  dateOffset: {
    days: 1,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  },
});

// Federal comment period is 30 days long
VALIDATION_CHECKS["Federal Comment Period End Date"]["offsetChecks"].push({
  dateTypeToCheck: "Federal Comment Period Start Date",
  dateOffset: {
    days: 30,
    hours: 23,
    minutes: 59,
    seconds: 59,
    milliseconds: 999,
  },
});

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
        checkInputDateGreaterThan(datesToValidateMap, dateType, check.dateTypeToCheck);
      }
    }
    if (checks.greaterThanOrEqualChecks.length !== 0) {
      for (const check of checks.greaterThanOrEqualChecks) {
        checkInputDateGreaterThanOrEqual(datesToValidateMap, dateType, check.dateTypeToCheck);
      }
    }
    if (checks.offsetChecks.length !== 0) {
      for (const check of checks.offsetChecks) {
        checkInputDateMeetsOffset(
          datesToValidateMap,
          dateType,
          check.dateTypeToCheck,
          check.dateOffset
        );
      }
    }
  }
}
