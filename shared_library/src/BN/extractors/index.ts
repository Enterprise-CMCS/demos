import type { ExtractionFunction } from "../validation.js";
import {
  optionalDateCell,
  optionalNumericCell,
  optionalTextCell,
  requiredNumericCell,
  requiredTextCell,
} from "./cells.js";

export * from "./cells.js";
export * from "./labels.js";

export const BN_WORKBOOK_FIELDS = [
  {
    key: "actuals",
    column: "actuals",
    required: true,
    extractor: requiredTextCell("actuals", { kind: "address", sheet: "Summary", address: "B8" }),
  },
  {
    key: "netVariance",
    column: "net_variance_total",
    required: true,
    extractor: requiredNumericCell("netVariance", {
      kind: "label",
      sheet: "Summary",
      label: "NET VARIANCE",
      column: "AS",
    }),
  },
  {
    key: "reportingStartDy",
    column: "reporting_start_dy",
    required: false,
    extractor: optionalNumericCell("reportingStartDy", {
      kind: "address", sheet: "Summary", address: "C4",
    }),
  },
  {
    key: "reportingEndDy",
    column: "reporting_end_dy",
    required: false,
    extractor: optionalNumericCell("reportingEndDy", {
      kind: "address", sheet: "Summary", address: "C5",
    }),
  },
  {
    key: "reportingDy",
    column: "reporting_dy",
    required: false,
    extractor: optionalNumericCell("reportingDy", { kind: "address", sheet: "C Report", address: "F2" }),
  },
  {
    key: "reportingQuarter",
    column: "reporting_quarter",
    required: false,
    extractor: optionalNumericCell("reportingQuarter", {
      kind: "address", sheet: "C Report", address: "F3",
    }),
  },
  {
    key: "dataPulledOn",
    column: "data_pulled_on",
    required: false,
    extractor: optionalDateCell("dataPulledOn", { kind: "address", sheet: "C Report", address: "D2" }),
  },
  {
    key: "periodThrough",
    column: "period_through",
    required: false,
    extractor: optionalDateCell("periodThrough", { kind: "address", sheet: "C Report", address: "D3" }),
  },
  {
    key: "workbookStateName",
    column: "workbook_state_name",
    required: false,
    extractor: optionalTextCell("workbookStateName", {
      kind: "address", sheet: "DY Def", address: "A1",
    }),
  },
  {
    key: "workbookDemonstrationNumber",
    column: "workbook_demonstration_number",
    required: false,
    extractor: optionalTextCell("workbookDemonstrationNumber", {
      kind: "address", sheet: "DY Def", address: "A2",
    }),
  },
] as const satisfies readonly {
  key: string;
  column: string;
  required: boolean;
  extractor: ExtractionFunction;
}[];

export const extractorFunctions: ExtractionFunction[] = BN_WORKBOOK_FIELDS.map((field) => field.extractor);

export function missingFieldWarnings(values: Map<string, string | number>): string[] {
  return BN_WORKBOOK_FIELDS
    .filter((field) => !field.required && !values.has(field.key))
    .map((field) => `Optional workbook field "${field.key}" could not be extracted; stored value will be NULL.`);
}

