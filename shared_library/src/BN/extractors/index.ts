import type { ExtractionFunction } from "../validation.js";
import type { ExcelData } from "../index.js";
import { NET_VARIANCE_LOCATION, validateNetVarianceLocation } from "../netVarianceLocation.js";
import {
  optionalDateCell,
  optionalIntegerCell,
  optionalTextCell,
  requiredNumericCell,
  requiredTextCell,
} from "./cells.js";
import { extractBNWorkbook, reportingDys, type BNWorkbookExtractionOptions } from "./workbook.js";

export * from "./cells.js";
export * from "./labels.js";
export * from "./summary.js";
export * from "./spendingLimits.js";
export * from "./workbook.js";

const netVarianceValueExtractor = requiredNumericCell("netVariance", {
  kind: "address",
  sheet: NET_VARIANCE_LOCATION.sheet,
  address: NET_VARIANCE_LOCATION.valueAddress,
});

function extractNetVariance(data: Parameters<ExtractionFunction>[0]) {
  const validationError = validateNetVarianceLocation(data);
  if (validationError) {
    throw new Error(`Unable to extract "netVariance": ${validationError.message}`);
  }
  return netVarianceValueExtractor(data);
}

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
    extractor: extractNetVariance,
  },
  {
    key: "reportingStartDy",
    column: "reporting_start_dy",
    required: false,
    extractor: optionalIntegerCell("reportingStartDy", {
      kind: "address", sheet: "Summary", address: "C4",
    }),
  },
  {
    key: "reportingEndDy",
    column: "reporting_end_dy",
    required: false,
    extractor: optionalIntegerCell("reportingEndDy", {
      kind: "address", sheet: "Summary", address: "C5",
    }),
  },
  {
    key: "reportingDy",
    column: "reporting_dy",
    required: false,
    extractor: optionalIntegerCell("reportingDy", { kind: "address", sheet: "C Report", address: "F2" }),
  },
  {
    key: "reportingQuarter",
    column: "reporting_quarter",
    required: false,
    extractor: optionalIntegerCell("reportingQuarter", {
      kind: "address", sheet: "C Report", address: "F3",
    }),
  },
  {
    key: "dataPulledOn",
    column: "data_pulled_on",
    required: false,
    extractor: optionalDateCell(
      "dataPulledOn",
      { kind: "address", sheet: "C Report", address: "D2" },
      "calendarDate",
    ),
  },
  {
    key: "periodThrough",
    column: "period_through",
    required: false,
    extractor: optionalDateCell(
      "periodThrough",
      { kind: "address", sheet: "C Report", address: "D3" },
      "calendarDate",
    ),
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

export function extractBNReporting(
  data: ExcelData,
  extractedValues: Map<string, string | number>,
  options?: BNWorkbookExtractionOptions,
): ReturnType<typeof extractBNWorkbook> {
  const startDy = extractedValues.get("reportingStartDy");
  const endDy = extractedValues.get("reportingEndDy");
  const reportingRange = reportingDys(
    typeof startDy === "number" ? startDy : undefined,
    typeof endDy === "number" ? endDy : undefined,
  );
  const extractionResult = extractBNWorkbook(data, reportingRange.dys, extractedValues, options);

  return {
    extract: extractionResult.extract,
    warnings: [
      ...missingFieldWarnings(extractedValues),
      ...(reportingRange.warning ? [reportingRange.warning] : []),
      ...extractionResult.warnings,
    ],
  };
}

