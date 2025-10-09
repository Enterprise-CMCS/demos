import { DateType } from "../../types.js";
import { getTargetDateValue } from "./getTargetDateValue.js";
import { addDays } from "date-fns";

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
    offsetDays: number;
  }
): Promise<void> {
  const targetResult = await getTargetDateValue(targetDate.bundleId, targetDate.dateType);
  const offsetDateValue = addDays(targetResult, targetDate.offsetDays);
  if (inputDate.dateValue.valueOf() !== offsetDateValue.valueOf()) {
    throw new Error(
      `The input ${inputDate.dateType} must be equal to ${targetDate.dateType} + ${targetDate.offsetDays}, ` +
        `which is ${offsetDateValue.toISOString()}.`
    );
  }
}
