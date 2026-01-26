import { TZDate } from "@date-fns/tz";
import { Tag } from "../../types";

export interface ParsedDemonstrationTypeDatesInput {
  effectiveDate: TZDate;
  expirationDate: TZDate;
}

export interface ParsedDemonstrationTypeInput {
  demonstrationTypeName: Tag;
  demonstrationTypeDates: ParsedDemonstrationTypeDatesInput;
}

export interface ParsedSetDemonstrationTypesInput {
  demonstrationId: string;
  demonstrationTypesToUpsert: ParsedDemonstrationTypeInput[];
  demonstrationTypesToDelete: Tag[];
}
