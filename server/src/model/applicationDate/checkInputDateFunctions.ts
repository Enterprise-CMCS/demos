import { DateType, ExpectedTimestamp } from "../../types";
import { DateOffset, ApplicationDateMap } from ".";
import { addDays, format } from "date-fns";
import { GraphQLError } from "graphql";
import { EasternTZDate, getDateTimeParts } from "../../dateUtilities";
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
        `(midnight in Eastern time), but it is ${dateValue.easternTZDate.toISOString()}`,
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

  const doYMDMatch =
    offsetDateValue.easternTZDate.getFullYear() === inputDateValue.easternTZDate.getFullYear() &&
    offsetDateValue.easternTZDate.getMonth() === inputDateValue.easternTZDate.getMonth() &&
    offsetDateValue.easternTZDate.getDate() === inputDateValue.easternTZDate.getDate();

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

  if (!doYMDMatch) {
    throw new Error(
      `The input ${inputDateType} must be equal to ${targetDateTypeToOffset} ${offsetString} days ` +
        `and should have a timestamp that is ${targetDateOffset.expectedTimestamp.toLowerCase()}. ` +
        `The value provided was ${inputDateValue.easternTZDate.toISOString()}.`
    );
  }
}

export function checkInputDateNotWeekend(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType
): void {
  const inputDateValue = getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  const isWeekendDay = [0, 6].includes(inputDateValue.easternTZDate.getDay());

  if (isWeekendDay) {
    throw new Error(
      `The input ${inputDateType} must not be a Saturday or Sunday. ` +
        `The value provided was ${inputDateValue.easternTZDate.toISOString()}.`
    );
  }
}

export function checkInputDateNotHoliday(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType
): void {
  const inputDateValue = getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  const localDate = format(inputDateValue.easternTZDate, "yyyy-MM-dd");
  const isHoliday = FEDERAL_HOLIDAYS.includes(localDate);

  if (isHoliday) {
    throw new Error(
      `The input ${inputDateType} must not be a federal holiday. ` +
        `The value provided was ${inputDateValue.easternTZDate.toISOString()}.`
    );
  }
}
