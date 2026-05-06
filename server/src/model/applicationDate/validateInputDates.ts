import { DateType } from "../../types.js";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import {
  ParsedApplicationDateInput,
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateMeetsOffset,
  ApplicationDateMap,
  DateTypeValidationChecksRecord,
} from ".";
import { EasternTZDate } from "../../dateUtilities";

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
VALIDATION_CHECKS["Review Completion Date"]["greaterThanOrEqualChecks"].push({
  dateTypeToCheck: "Review Start Date",
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
    expectedTimestamp: "End of Day",
  },
});

VALIDATION_CHECKS["State Application Submitted Date"]["offsetChecks"].push({
  dateTypeToCheck: "Completeness Review Due Date",
  dateOffset: {
    days: -15,
    expectedTimestamp: "Start of Day",
  },
});

// Federal comment period starts 1 day after application deemed complete
VALIDATION_CHECKS["Federal Comment Period Start Date"]["offsetChecks"].push({
  dateTypeToCheck: "State Application Deemed Complete",
  dateOffset: {
    days: 1,
    expectedTimestamp: "Start of Day",
  },
});

VALIDATION_CHECKS["State Application Deemed Complete"]["offsetChecks"].push({
  dateTypeToCheck: "Federal Comment Period Start Date",
  dateOffset: {
    days: -1,
    expectedTimestamp: "Start of Day",
  },
});

// Federal comment period is 30 days long
VALIDATION_CHECKS["Federal Comment Period End Date"]["offsetChecks"].push({
  dateTypeToCheck: "Federal Comment Period Start Date",
  dateOffset: {
    days: 30,
    expectedTimestamp: "End of Day",
  },
});

VALIDATION_CHECKS["Federal Comment Period Start Date"]["offsetChecks"].push({
  dateTypeToCheck: "Federal Comment Period End Date",
  dateOffset: {
    days: -30,
    expectedTimestamp: "Start of Day",
  },
});

function runExpectedTimestampCheck(
  dateType: DateType,
  dateValue: EasternTZDate,
  check: DateTypeValidationChecksRecord[DateType]["expectedTimestamp"]
): void {
  if (check === "Start of Day") {
    checkInputDateIsStartOfDay(dateType, dateValue);
  }
  if (check === "End of Day") {
    checkInputDateIsEndOfDay(dateType, dateValue);
  }
}

function runGreaterThanChecks(
  datesToValidateMap: ApplicationDateMap,
  dateType: DateType,
  checks: DateTypeValidationChecksRecord[DateType]["greaterThanChecks"]
): void {
  for (const check of checks) {
    checkInputDateGreaterThan(datesToValidateMap, dateType, check.dateTypeToCheck);
  }
}

function runGreaterThanOrEqualChecks(
  datesToValidateMap: ApplicationDateMap,
  dateType: DateType,
  checks: DateTypeValidationChecksRecord[DateType]["greaterThanOrEqualChecks"]
): void {
  for (const check of checks) {
    checkInputDateGreaterThanOrEqual(datesToValidateMap, dateType, check.dateTypeToCheck);
  }
}

function runOffsetChecks(
  datesToValidateMap: ApplicationDateMap,
  dateType: DateType,
  checks: DateTypeValidationChecksRecord[DateType]["offsetChecks"]
): void {
  for (const check of checks) {
    checkInputDateMeetsOffset(
      datesToValidateMap,
      dateType,
      check.dateTypeToCheck,
      check.dateOffset
    );
  }
}

export function validateInputDates(datesToValidate: ParsedApplicationDateInput[]): void {
  const datesToValidateMap = makeApplicationDateMapFromList(datesToValidate);
  for (const [dateType, dateValue] of datesToValidateMap.entries()) {
    const checks = VALIDATION_CHECKS[dateType];
    runExpectedTimestampCheck(dateType, dateValue, checks.expectedTimestamp);
    runGreaterThanChecks(datesToValidateMap, dateType, checks.greaterThanChecks);
    runGreaterThanOrEqualChecks(datesToValidateMap, dateType, checks.greaterThanOrEqualChecks);
    runOffsetChecks(datesToValidateMap, dateType, checks.offsetChecks);
  }
}
