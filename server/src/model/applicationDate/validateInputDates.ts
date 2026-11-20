import { DateType } from "../../types";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants";
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
import type {
  ApplicationDateMap,
  DateTypeValidationChecksRecord,
  ParsedApplicationDateInput,
} from ".";
import { EasternTZDate } from "../../dateUtilities";
import { getFeatureFlags } from "../../flags";
import type { SemVer } from "semver";

export function makeEmptyValidations(): DateTypeValidationChecksRecord {
  const result = {} as DateTypeValidationChecksRecord;
  let dateType: DateType;
  for (dateType in DATE_TYPES_WITH_EXPECTED_TIMESTAMPS) {
    result[dateType] = {
      expectedTimestamp: DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[dateType]["expectedTimestamp"],
      allowedToBeWeekend: true,
      allowedToBeHoliday: true,
      greaterThanChecks: [],
      greaterThanOrEqualChecks: [],
      lessThanChecks: [],
      offsetChecks: [],
      flexibleOffsetChecks: [],
    };
  }
  return result;
}

export function makeValidations(currentVersion: SemVer): DateTypeValidationChecksRecord {
  const validationChecks = makeEmptyValidations();

  // Phase completion dates must follow start dates
  validationChecks["Concept Completion Date"]["greaterThanOrEqualChecks"].push({
    dateTypeToCheck: "Concept Start Date",
  });
  validationChecks["Concept Skipped Date"]["greaterThanOrEqualChecks"].push({
    dateTypeToCheck: "Concept Start Date",
  });
  validationChecks["Application Intake Completion Date"]["greaterThanOrEqualChecks"].push({
    dateTypeToCheck: "Application Intake Start Date",
  });
  validationChecks["Completeness Completion Date"]["greaterThanOrEqualChecks"].push({
    dateTypeToCheck: "Completeness Start Date",
  });
  validationChecks["SDG Preparation Completion Date"]["greaterThanOrEqualChecks"].push({
    dateTypeToCheck: "SDG Preparation Start Date",
  });
  validationChecks["Approval Package Completion Date"]["greaterThanOrEqualChecks"].push({
    dateTypeToCheck: "Approval Package Start Date",
  });
  validationChecks["Review Completion Date"]["greaterThanOrEqualChecks"].push({
    dateTypeToCheck: "Review Start Date",
  });

  // State application must be deemed complete after it is submitted
  validationChecks["State Application Deemed Complete"]["greaterThanOrEqualChecks"].push({
    dateTypeToCheck: "State Application Submitted Date",
  });

  // Completeness review is 15 days after state application submission
  // Old version just uses exactly 15 days
  if (!getFeatureFlags(currentVersion).handleHolidaysWeekendsForDates) {
    validationChecks["Completeness Review Due Date"]["offsetChecks"].push({
      dateTypeToCheck: "State Application Submitted Date",
      dateOffset: {
        days: 15,
        expectedTimestamp: "End of Day",
      },
    });

    validationChecks["State Application Submitted Date"]["offsetChecks"].push({
      dateTypeToCheck: "Completeness Review Due Date",
      dateOffset: {
        days: -15,
        expectedTimestamp: "Start of Day",
      },
    });
  }

  // New version takes into account weekends and holidays
  if (getFeatureFlags(currentVersion).handleHolidaysWeekendsForDates) {
    // The Completeness Review Due Date must not be a holiday or a weekend
    validationChecks["Completeness Review Due Date"]["allowedToBeWeekend"] = false;
    validationChecks["Completeness Review Due Date"]["allowedToBeHoliday"] = false;

    // It must be 15 days, flexibly, after the State Application Submitted Date
    validationChecks["Completeness Review Due Date"]["flexibleOffsetChecks"].push({
      dateTypeToCheck: "State Application Submitted Date",
      dateOffset: {
        days: 15,
        expectedTimestamp: "End of Day",
      },
    });

    // This less-than check ensures that if State Application Submitted Date is present
    // We will check something on Completeness Review Due Date, meaning it must be present
    validationChecks["State Application Submitted Date"]["lessThanChecks"].push({
      dateTypeToCheck: "Completeness Review Due Date",
    });
  }

  // Previously enforced that comment period starts 1 day after application deemed complete
  // and lasts for 30 days. This is now flexible from 1.3.0 onward.
  if (!getFeatureFlags(currentVersion).makeFederalCommentPeriodMoreFlexible) {
    validationChecks["Federal Comment Period Start Date"]["offsetChecks"].push({
      dateTypeToCheck: "State Application Deemed Complete",
      dateOffset: {
        days: 1,
        expectedTimestamp: "Start of Day",
      },
    });

    validationChecks["State Application Deemed Complete"]["offsetChecks"].push({
      dateTypeToCheck: "Federal Comment Period Start Date",
      dateOffset: {
        days: -1,
        expectedTimestamp: "Start of Day",
      },
    });

    validationChecks["Federal Comment Period End Date"]["offsetChecks"].push({
      dateTypeToCheck: "Federal Comment Period Start Date",
      dateOffset: {
        days: 30,
        expectedTimestamp: "End of Day",
      },
    });

    validationChecks["Federal Comment Period Start Date"]["offsetChecks"].push({
      dateTypeToCheck: "Federal Comment Period End Date",
      dateOffset: {
        days: -30,
        expectedTimestamp: "Start of Day",
      },
    });
  }

  // From 1.3.0 we just enforce simple ordering checks
  if (getFeatureFlags(currentVersion).makeFederalCommentPeriodMoreFlexible) {
    validationChecks["Federal Comment Period Start Date"]["greaterThanChecks"].push({
      dateTypeToCheck: "State Application Deemed Complete",
    });
    validationChecks["Federal Comment Period Start Date"]["lessThanChecks"].push({
      dateTypeToCheck: "Federal Comment Period End Date",
    });
    validationChecks["Federal Comment Period End Date"]["greaterThanChecks"].push({
      dateTypeToCheck: "Federal Comment Period Start Date",
    });
  }

  return validationChecks;
}

export function makeApplicationDateMapFromList(
  inputDates: ParsedApplicationDateInput[]
): ApplicationDateMap {
  return new Map(inputDates.map((inputDate) => [inputDate.dateType, inputDate.dateValue]));
}

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

function runWeekendChecks(
  datesToValidateMap: ApplicationDateMap,
  dateType: DateType,
  allowedToBeWeekend: DateTypeValidationChecksRecord[DateType]["allowedToBeWeekend"]
): void {
  if (!allowedToBeWeekend) {
    checkInputDateNotWeekend(datesToValidateMap, dateType);
  }
}

function runHolidayChecks(
  datesToValidateMap: ApplicationDateMap,
  dateType: DateType,
  allowedToBeHoliday: DateTypeValidationChecksRecord[DateType]["allowedToBeHoliday"]
): void {
  if (!allowedToBeHoliday) {
    checkInputDateNotHoliday(datesToValidateMap, dateType);
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

function runLessThanChecks(
  datesToValidateMap: ApplicationDateMap,
  dateType: DateType,
  checks: DateTypeValidationChecksRecord[DateType]["lessThanChecks"]
): void {
  for (const check of checks) {
    checkInputDateLessThan(datesToValidateMap, dateType, check.dateTypeToCheck);
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

function runFlexibleOffsetChecks(
  datesToValidateMap: ApplicationDateMap,
  dateType: DateType,
  checks: DateTypeValidationChecksRecord[DateType]["flexibleOffsetChecks"]
): void {
  for (const check of checks) {
    checkInputDateMeetsFlexibleOffset(
      datesToValidateMap,
      dateType,
      check.dateTypeToCheck,
      check.dateOffset
    );
  }
}

export function validateInputDates(
  datesToValidate: ParsedApplicationDateInput[],
  currentVersion: SemVer
): void {
  const datesToValidateMap = makeApplicationDateMapFromList(datesToValidate);
  const validationChecks = makeValidations(currentVersion);
  for (const [dateType, dateValue] of datesToValidateMap.entries()) {
    const checks = validationChecks[dateType];
    runExpectedTimestampCheck(dateType, dateValue, checks.expectedTimestamp);
    runWeekendChecks(datesToValidateMap, dateType, checks.allowedToBeWeekend);
    runHolidayChecks(datesToValidateMap, dateType, checks.allowedToBeHoliday);
    runGreaterThanChecks(datesToValidateMap, dateType, checks.greaterThanChecks);
    runGreaterThanOrEqualChecks(datesToValidateMap, dateType, checks.greaterThanOrEqualChecks);
    runLessThanChecks(datesToValidateMap, dateType, checks.lessThanChecks);
    runOffsetChecks(datesToValidateMap, dateType, checks.offsetChecks);
    runFlexibleOffsetChecks(datesToValidateMap, dateType, checks.flexibleOffsetChecks);
  }
}
