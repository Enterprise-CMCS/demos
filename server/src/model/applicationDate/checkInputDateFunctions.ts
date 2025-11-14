import { DateType } from "../../types.js";
import { ApplicationDateMap } from "./validateInputDates.js";
import { addDays, addHours, addMinutes, addSeconds, addMilliseconds } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { GraphQLError } from "graphql";

type TZDateTimeParts = {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
};

export type DateOffset = TZDateTimeParts & {
  days: number;
};

export function getTZDateTimeParts(dateValue: Date): TZDateTimeParts {
  const tzDateValue = new TZDate(dateValue, "America/New_York");
  return {
    hours: tzDateValue.getHours(),
    minutes: tzDateValue.getMinutes(),
    seconds: tzDateValue.getSeconds(),
    milliseconds: tzDateValue.getMilliseconds(),
  };
}

export function checkInputDateIsStartOfDay(
  dateType: DateType | "effectiveDate",
  dateValue: Date
): void {
  const dateParts = getTZDateTimeParts(dateValue);
  if (
    dateParts.hours !== 0 ||
    dateParts.minutes !== 0 ||
    dateParts.seconds !== 0 ||
    dateParts.milliseconds !== 0
  ) {
    throw new GraphQLError(
      `The input ${dateType} must be a start of day date ` +
        `(midnight in Eastern time), but it is ${dateValue.toISOString()}`,
      {
        extensions: {
          code: "INVALID_START_OF_DAY_DATETIME",
        },
      }
    );
  }
}

export function checkInputDateIsEndOfDay(
  dateType: DateType | "expirationDate",
  dateValue: Date
): void {
  const dateParts = getTZDateTimeParts(dateValue);
  if (
    dateParts.hours !== 23 ||
    dateParts.minutes !== 59 ||
    dateParts.seconds !== 59 ||
    dateParts.milliseconds !== 999
  ) {
    throw new GraphQLError(
      `The input ${dateType} must be an end of day date ` +
        `(11:59:59.999 in Eastern time), but it is ${dateValue.toISOString()}`,
      {
        extensions: {
          code: "INVALID_END_OF_DAY_DATETIME",
        },
      }
    );
  }
}

export function __getDateValueFromApplicationDateMap(
  dateType: DateType,
  applicationDateMap: ApplicationDateMap
): Date {
  const result = applicationDateMap.get(dateType);
  if (!result) {
    throw new Error(
      `The date ${dateType} was requested as part of a validation, but is undefined. ` +
        `It must either be in the database, or part of your payload.`
    );
  }
  return result;
}

export function __checkInputDateGreaterThan(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType,
  targetDateType: DateType
): void {
  const inputDateValue = __getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  const targetDateValue = __getDateValueFromApplicationDateMap(targetDateType, applicationDateMap);
  if (!(inputDateValue.valueOf() > targetDateValue.valueOf())) {
    throw new Error(
      `The input ${inputDateType} has value ${inputDateValue.toISOString()}, ` +
        `but it must be greater than ${targetDateType}, ` +
        `which has value ${targetDateValue.toISOString()}.`
    );
  }
}

export function __checkInputDateGreaterThanOrEqual(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType,
  targetDateType: DateType
): void {
  const inputDateValue = __getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  const targetDateValue = __getDateValueFromApplicationDateMap(targetDateType, applicationDateMap);
  if (!(inputDateValue.valueOf() >= targetDateValue.valueOf())) {
    throw new Error(
      `The input ${inputDateType} has value ${inputDateValue.toISOString()}, ` +
        `but it must be greater than or equal to ${targetDateType}, ` +
        `which has value ${targetDateValue.toISOString()}.`
    );
  }
}

export function __checkInputDateMeetsOffset(
  applicationDateMap: ApplicationDateMap,
  inputDateType: DateType,
  targetDateType: DateType,
  targetDateOffset: DateOffset
): void {
  const inputDateValue = __getDateValueFromApplicationDateMap(inputDateType, applicationDateMap);
  const targetDateValue = __getDateValueFromApplicationDateMap(targetDateType, applicationDateMap);
  let offsetDateValue: Date;
  offsetDateValue = addDays(targetDateValue, targetDateOffset.days);
  offsetDateValue = addHours(offsetDateValue, targetDateOffset.hours);
  offsetDateValue = addMinutes(offsetDateValue, targetDateOffset.minutes);
  offsetDateValue = addSeconds(offsetDateValue, targetDateOffset.seconds);
  offsetDateValue = addMilliseconds(offsetDateValue, targetDateOffset.milliseconds);
  if (inputDateValue.valueOf() !== offsetDateValue.valueOf()) {
    throw new Error(
      `The input ${inputDateType} must be equal to ${targetDateType} + ${targetDateOffset.days} days, ` +
        `${targetDateOffset.hours} hours, ` +
        `${targetDateOffset.minutes} minutes, ` +
        `${targetDateOffset.seconds} seconds, ` +
        `and ${targetDateOffset.milliseconds} milliseconds, ` +
        `which is ${offsetDateValue.toISOString()}. ` +
        `The value provided was ${inputDateValue.toISOString()}.`
    );
  }
}
