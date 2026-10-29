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
  allowedToBeWeekend: boolean;
  allowedToBeHoliday: boolean;
  greaterThanChecks: { dateTypeToCheck: DateType }[];
  greaterThanOrEqualChecks: { dateTypeToCheck: DateType }[];
  lessThanChecks: { dateTypeToCheck: DateType }[];
  offsetChecks: { dateTypeToCheck: DateType; dateOffset: DateOffset }[];
  flexibleOffsetChecks: { dateTypeToCheck: DateType; dateOffset: DateOffset }[];
};

export type DateTypeValidationChecksRecord = Record<DateType, ValidationChecks>;

export type ApplicationDateMap = Map<DateType, EasternTZDate>;
