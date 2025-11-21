import { EasternTZDate } from "../../dateUtilities.js";
import { DateType, ExpectedTimestamp } from "../../types.js";

export type DateTimeParts = {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
};

export type DateOffset = {
  days: number;
  expectedTimestamp: ExpectedTimestamp;
};

export type ValidationChecks = {
  expectedTimestamp: ExpectedTimestamp;
  greaterThanChecks: { dateTypeToCheck: DateType }[];
  greaterThanOrEqualChecks: { dateTypeToCheck: DateType }[];
  offsetChecks: { dateTypeToCheck: DateType; dateOffset: DateOffset }[];
};

export type DateTypeValidationChecksRecord = Record<DateType, ValidationChecks>;

export type ApplicationDateMap = Map<DateType, EasternTZDate>;
