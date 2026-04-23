import { TZDate } from "@date-fns/tz";
import { TagName } from "../../types";

export interface ParsedDemonstrationTypeDatesInput {
  effectiveDate: TZDate;
  expirationDate: TZDate;
}

export interface ParsedDemonstrationTypeInput {
  demonstrationTypeName: TagName;
  demonstrationTypeDates: ParsedDemonstrationTypeDatesInput;
}

export interface ParsedSetDemonstrationTypesInput {
  demonstrationId: string;
  demonstrationTypesToUpsert: ParsedDemonstrationTypeInput[];
  demonstrationTypesToDelete: TagName[];
}
