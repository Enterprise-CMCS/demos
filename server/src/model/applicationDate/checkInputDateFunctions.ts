import type { DateType, ExpectedTimestamp } from "../../types";
import type { DateOffset, ApplicationDateMap } from ".";
import { addDays, format } from "date-fns";
import { GraphQLError } from "graphql";
import type { EasternTZDate } from "../../dateUtilities";
import { getDateTimeParts } from "../../dateUtilities";
import { FEDERAL_HOLIDAYS } from "../../constants";

export function isDateExpectedTimestamp(
  dateValue: EasternTZDate,
  expectedTimestamp: ExpectedTimestamp
): boolean {
  const dateParts = getDateTimeParts(dateValue.easternTZDate);
  switch (expectedTimestamp) {
    case "Start of Day":
      if (
        dateParts.hours === 0 &&
        dateParts.minutes === 0 &&
        dateParts.seconds === 0 &&
        dateParts.milliseconds === 0
      ) {
        return true;
      }
      break;
    case "End of Day":
      if (
        dateParts.hours === 23 &&
        dateParts.minutes === 59 &&
        dateParts.seconds === 59 &&
        dateParts.milliseconds === 999
      ) {
        return true;
      }
  }
  return false;
}

export function checkInputDateIsStartOfDay(
  dateType: DateType | "effectiveDate",
  dateValue: EasternTZDate
): void {
  const isStartOfDay = isDateExpectedTimestamp(dateValue, "Start of Day");
  if (!isStartOfDay) {
    throw new GraphQLError(
      `The input ${dateType} must be a start of day date ` +
        `(midnight in Eastern time), but it is ${dateValue.easternTZDate.toISOString()}.`,
      {
        extensions: {
          code: "INVALID_START_OF_DAY_INPUT_DATETIME",
        },
      }
    );
  }
}

export function checkInputDateIsEndOfDay(
  dateType: DateType | "expirationDate" | "dueDate",
  dateValue: EasternTZDate
): void {
  const isEndOfDay = isDateExpectedTimestamp(dateValue, "End of Day");
  if (!isEndOfDay) {
    throw new GraphQLError(
      `The input ${dateType} must be an end of day date ` +
        `(23:59:59.999 in Eastern time), but it is ${dateValue.easternTZDate.toISOString()}.`,
      {
        extensions: {
          code: "INVALID_END_OF_DAY_INPUT_DATETIME",
        },
      }
    );
  }
}

export function getDateValueFromApplicationDateMap(
  dateType: DateType,
  applicationDateMap: ApplicationDateMap
): EasternTZDate {
  const result = applicationDateMap.get(dateType);
  if (!result) {
    throw new Error(
      `The date ${dateType} was requested as part of a validation, but is undefined. ` +
        `It must either be in the database, or part of the set of dates being changed.`
    );
  }
  return result;
}

export function checkInputDateGreaterThan(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType,
  targetDateType: DateType
): void {
  const inputDateValue = getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  const targetDateValue = getDateValueFromApplicationDateMap(targetDateType, applicationDateMap);
  const inputIsGreaterThanTarget =
    inputDateValue.easternTZDate.valueOf() > targetDateValue.easternTZDate.valueOf();
  if (!inputIsGreaterThanTarget) {
    throw new Error(
      `The input ${inputDateType} has value ${inputDateValue.easternTZDate.toISOString()}, ` +
        `but it must be greater than ${targetDateType}, ` +
        `which has value ${targetDateValue.easternTZDate.toISOString()}.`
    );
  }
}

export function checkInputDateGreaterThanOrEqual(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType,
  targetDateType: DateType
): void {
  const inputDateValue = getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  const targetDateValue = getDateValueFromApplicationDateMap(targetDateType, applicationDateMap);
  const inputIsGreaterThanOrEqualToTarget =
    inputDateValue.easternTZDate.valueOf() >= targetDateValue.easternTZDate.valueOf();
  if (!inputIsGreaterThanOrEqualToTarget) {
    throw new Error(
      `The input ${inputDateType} has value ${inputDateValue.easternTZDate.toISOString()}, ` +
        `but it must be greater than or equal to ${targetDateType}, ` +
        `which has value ${targetDateValue.easternTZDate.toISOString()}.`
    );
  }
}

export function checkInputDateMeetsOffset(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType,
  targetDateTypeToOffset: DateType,
  targetDateOffset: DateOffset
): void {
  const inputDateValue = getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  const targetDateValueToOffset = getDateValueFromApplicationDateMap(
    targetDateTypeToOffset,
    applicationDateMap
  );
  const offsetDateValue: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: addDays(targetDateValueToOffset.easternTZDate, targetDateOffset.days),
  };

  const doDatesMatch =
    format(offsetDateValue.easternTZDate, "yyyy-MM-dd") ===
    format(inputDateValue.easternTZDate, "yyyy-MM-dd");

  if (targetDateOffset.expectedTimestamp === "Start of Day") {
    checkInputDateIsStartOfDay(inputDateType, inputDateValue);
  } else if (targetDateOffset.expectedTimestamp === "End of Day") {
    checkInputDateIsEndOfDay(inputDateType, inputDateValue);
  }

  let offsetString: string;
  if (targetDateOffset.days < 0) {
    offsetString = `${targetDateOffset.days}`;
  } else {
    offsetString = `+${targetDateOffset.days}`;
  }

  if (!doDatesMatch) {
    throw new Error(
      `The input ${inputDateType} must be equal to ${targetDateTypeToOffset} ${offsetString} days ` +
        `and should have a timestamp that is ${targetDateOffset.expectedTimestamp.toLowerCase()}. ` +
        `The value provided was ${inputDateValue.easternTZDate.toISOString()}.`
    );
  }
}

export function isWeekend(dateToCheck: EasternTZDate): boolean {
  return [0, 6].includes(dateToCheck.easternTZDate.getDay());
}

export function checkInputDateNotWeekend(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType
): void {
  const inputDateValue = getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  const inputDateIsWeekendDay = isWeekend(inputDateValue);

  if (inputDateIsWeekendDay) {
    throw new Error(
      `The input ${inputDateType} must not be a Saturday or Sunday. ` +
        `The value provided was ${inputDateValue.easternTZDate.toISOString()}.`
    );
  }
}

export function isHoliday(dateToCheck: EasternTZDate): boolean {
  const localDate = format(dateToCheck.easternTZDate, "yyyy-MM-dd");
  return FEDERAL_HOLIDAYS.includes(localDate);
}

export function checkInputDateNotHoliday(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType
): void {
  const inputDateValue = getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  const inputDateIsHoliday = isHoliday(inputDateValue);

  if (inputDateIsHoliday) {
    throw new Error(
      `The input ${inputDateType} must not be a federal holiday. ` +
        `The value provided was ${inputDateValue.easternTZDate.toISOString()}.`
    );
  }
}

export function checkInputDateLessThan(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType,
  targetDateType: DateType
): void {
  const inputDateValue = getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  const targetDateValue = getDateValueFromApplicationDateMap(targetDateType, applicationDateMap);
  const inputIsLessThanTarget =
    inputDateValue.easternTZDate.valueOf() < targetDateValue.easternTZDate.valueOf();
  if (!inputIsLessThanTarget) {
    throw new Error(
      `The input ${inputDateType} has value ${inputDateValue.easternTZDate.toISOString()}, ` +
        `but it must be less than ${targetDateType}, ` +
        `which has value ${targetDateValue.easternTZDate.toISOString()}.`
    );
  }
}

// A flexible offset means the date is moved back in cases where it falls on a weekend or holiday
// As a result, this only works on positive offsets, which is why there is a new error check here
export function checkInputDateMeetsFlexibleOffset(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType,
  targetDateTypeToOffset: DateType,
  targetDateOffset: DateOffset
): void {
  if (targetDateOffset.days < 1) {
    throw new Error(
      `A flexible offset check was attempted between input ${inputDateType} ` +
        `and ${targetDateTypeToOffset}, but the provided offset value of ` +
        `${targetDateOffset.days} was less than one.`
    );
  }

  // Start by getting the raw offset without any modifications
  // Throw if it is a weekend or holiday; the whole point of the flexible checker is to not pick those
  // Then, see if the days match
  const inputDateValue = getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  if (isHoliday(inputDateValue) || isWeekend(inputDateValue)) {
    throw new Error(
      `A flexible offset check was attempted between input ${inputDateType} ` +
        `and ${targetDateTypeToOffset}, but the provided input date ` +
        `of ${inputDateValue.easternTZDate.toISOString()} ` +
        "falls on a holiday or weekend."
    );
  }
  const targetDateValueToOffset = getDateValueFromApplicationDateMap(
    targetDateTypeToOffset,
    applicationDateMap
  );
  const rawOffsetDateValue: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: addDays(targetDateValueToOffset.easternTZDate, targetDateOffset.days),
  };
  const rawOffsetMatchesInput =
    format(rawOffsetDateValue.easternTZDate, "yyyy-MM-dd") ===
    format(inputDateValue.easternTZDate, "yyyy-MM-dd");

  // If the days don't match to start, we begin walking backward
  let correctedOffsetDateValue = rawOffsetDateValue;
  if (!rawOffsetMatchesInput) {
    // The most we should ever need to correct is three steps:
    //   Monday Federal Holiday, Sunday, Saturday
    //   Sunday, Saturday, Friday Federal Holiday
    for (let i = 0; i < 3; i++) {
      // Break as soon as offset lands on a day that is not a weekend or holiday
      if (!isHoliday(correctedOffsetDateValue) && !isWeekend(correctedOffsetDateValue)) {
        break;
      }
      correctedOffsetDateValue = {
        easternTZDate: addDays(correctedOffsetDateValue.easternTZDate, -1),
        isEasternTZDate: true,
      };
    }
  }

  // Once correction is done, see if that matches the input
  const correctedOffsetMatchesInput =
    format(correctedOffsetDateValue.easternTZDate, "yyyy-MM-dd") ===
    format(inputDateValue.easternTZDate, "yyyy-MM-dd");

  // If either the raw or the corrected matched, check the timestamps like before
  // Otherwise, throw an error
  if (rawOffsetMatchesInput || correctedOffsetMatchesInput) {
    if (targetDateOffset.expectedTimestamp === "Start of Day") {
      checkInputDateIsStartOfDay(inputDateType, inputDateValue);
    } else if (targetDateOffset.expectedTimestamp === "End of Day") {
      checkInputDateIsEndOfDay(inputDateType, inputDateValue);
    }
  } else {
    const offsetString = `+${targetDateOffset.days}`;
    throw new Error(
      `The input ${inputDateType} must be equal to ${targetDateTypeToOffset} ${offsetString} days, ` +
        "accounting for weekends and holidays, and it should have a timestamp " +
        `that is ${targetDateOffset.expectedTimestamp.toLowerCase()}. ` +
        `The value provided was ${inputDateValue.easternTZDate.toISOString()}.`
    );
  }
}
