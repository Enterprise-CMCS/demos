import { DateType, ExpectedTimestamp } from "../../types.js";

export type TZDateTimeParts = {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
};

export type DateOffset = TZDateTimeParts & {
  days: number;
};

export type ValidationChecks = {
  expectedTimestamp: ExpectedTimestamp;
  greaterThanChecks: { dateTypeToCheck: DateType }[];
  greaterThanOrEqualChecks: { dateTypeToCheck: DateType }[];
  offsetChecks: { dateTypeToCheck: DateType; dateOffset: DateOffset }[];
};

export type DateTypeValidationChecksRecord = Record<DateType, ValidationChecks>;

export type ApplicationDateMap = Map<DateType, Date>;
