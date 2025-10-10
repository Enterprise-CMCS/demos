import { DateType } from "../../types.js";
import { getTargetDateValue } from "./getTargetDateValue.js";
import { addDays, addHours, addMinutes, addSeconds, addMilliseconds } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { GraphQLError } from "graphql";

type TZDateParts = {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
};

export type DateOffset = TZDateParts & {
  days: number;
};

export function getTZDateParts(dateValue: Date): TZDateParts {
  const tzDateValue = new TZDate(dateValue, "America/New_York");
  return {
    hours: tzDateValue.getHours(),
    minutes: tzDateValue.getMinutes(),
    seconds: tzDateValue.getSeconds(),
    milliseconds: tzDateValue.getMilliseconds(),
  };
}

export function checkInputDateIsStartOfDay(inputDate: {
  dateType: DateType | "effectiveDate";
  dateValue: Date;
}): void {
  const dateParts = getTZDateParts(inputDate.dateValue);
  if (
    dateParts.hours !== 0 ||
    dateParts.minutes !== 0 ||
    dateParts.seconds !== 0 ||
    dateParts.milliseconds !== 0
  ) {
    throw new GraphQLError(
      `The input ${inputDate.dateType} must be a start of day date ` +
        `(midnight in Eastern time), but it is ${inputDate.dateValue.toISOString()}`,
      {
        extensions: {
          code: "INVALID_START_OF_DAY_DATETIME",
        },
      }
    );
  }
}

export function checkInputDateIsEndOfDay(inputDate: {
  dateType: DateType | "expirationDate";
  dateValue: Date;
}): void {
  const dateParts = getTZDateParts(inputDate.dateValue);
  if (
    dateParts.hours !== 23 ||
    dateParts.minutes !== 59 ||
    dateParts.seconds !== 59 ||
    dateParts.milliseconds !== 999
  ) {
    throw new GraphQLError(
      `The input ${inputDate.dateType} must be an end of day date ` +
        `(11:59:59.999 in Eastern time), but it is ${inputDate.dateValue.toISOString()}`,
      {
        extensions: {
          code: "INVALID_END_OF_DAY_DATETIME",
        },
      }
    );
  }
}

export async function checkInputDateGreaterThan(
  inputDate: {
    dateType: DateType;
    dateValue: Date;
  },
  targetDate: {
    bundleId: string;
    dateType: DateType;
  }
): Promise<void> {
  const targetResult = await getTargetDateValue(targetDate.bundleId, targetDate.dateType);
  if (inputDate.dateValue.valueOf() <= targetResult.valueOf()) {
    throw new Error(
      `The input ${inputDate.dateType} must be greater than ${targetDate.dateType}, ` +
        `which is ${targetResult.toISOString()}.`
    );
  }
}

export async function checkInputDateGreaterThanOrEqual(
  inputDate: {
    dateType: DateType;
    dateValue: Date;
  },
  targetDate: {
    bundleId: string;
    dateType: DateType;
  }
): Promise<void> {
  const targetResult = await getTargetDateValue(targetDate.bundleId, targetDate.dateType);
  if (inputDate.dateValue.valueOf() < targetResult.valueOf()) {
    throw new Error(
      `The input ${inputDate.dateType} must be greater than or equal to ${targetDate.dateType}, ` +
        `which is ${targetResult.toISOString()}.`
    );
  }
}

export async function checkInputDateMeetsOffset(
  inputDate: {
    dateType: DateType;
    dateValue: Date;
  },
  targetDate: {
    bundleId: string;
    dateType: DateType;
    offset: DateOffset;
  }
): Promise<void> {
  const targetResult = await getTargetDateValue(targetDate.bundleId, targetDate.dateType);
  let offsetDateValue: Date;
  offsetDateValue = addDays(targetResult, targetDate.offset.days);
  offsetDateValue = addHours(offsetDateValue, targetDate.offset.hours);
  offsetDateValue = addMinutes(offsetDateValue, targetDate.offset.minutes);
  offsetDateValue = addSeconds(offsetDateValue, targetDate.offset.seconds);
  offsetDateValue = addMilliseconds(offsetDateValue, targetDate.offset.milliseconds);
  if (inputDate.dateValue.valueOf() !== offsetDateValue.valueOf()) {
    throw new Error(
      `The input ${inputDate.dateType} must be equal to ${targetDate.dateType} + ${targetDate.offset.days} days, ` +
        `${targetDate.offset.hours} hours, ` +
        `${targetDate.offset.minutes} minutes, ` +
        `${targetDate.offset.seconds} seconds, ` +
        `and ${targetDate.offset.milliseconds} milliseconds, ` +
        `which is ${offsetDateValue.toISOString()}.`
    );
  }
}
