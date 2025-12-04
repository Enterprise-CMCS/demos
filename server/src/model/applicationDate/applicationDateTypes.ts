import { EasternTZDate } from "../../dateUtilities.js";
import { DateType, ExpectedTimestamp } from "../../types.js";

export interface ParsedApplicationDateInput {
  dateType: DateType;
  dateValue: EasternTZDate;
}

export interface ParsedSetApplicationDatesInput {
  applicationId: string;
  applicationDatesToUpsert: ParsedApplicationDateInput[];
  applicationDatesToDelete: DateType[];
}

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
