import { BNWorkbookInputError } from "../errors.js";
import { excelColumnRow } from "../index.js";
import { NET_VARIANCE_LOCATION, validateNetVarianceLocation } from "../netVarianceLocation.js";
import type { ExtractionFunction } from "../validation.js";


export const extractorFunctions: ExtractionFunction[] = [
  function extractActuals(data) {
    const B8 = excelColumnRow("B8", "Summary", data);
    if (B8 === "" || B8 === null || B8 === undefined) {
      throw new BNWorkbookInputError({
        code: "BN_REQUIRED_WORKBOOK_VALUE",
        message: 'Unable to extract "actuals" from Summary!B8: the required value is blank.',
      });
    }
    return new Map<string, string>([["actuals", B8 as string]]);
  },

  function extractNetVariance(data) {
    const locationError = validateNetVarianceLocation(data);
    if (locationError) throw new BNWorkbookInputError(locationError);

    const AS436 = excelColumnRow("AS436", "Summary", data);
    const netVariance = typeof AS436 === "number"
      ? AS436
      : typeof AS436 === "string" && AS436.trim() !== ""
        ? Number(AS436)
        : Number.NaN;
    if (!Number.isFinite(netVariance) || Math.abs(netVariance) >= 1e16) {
      throw new BNWorkbookInputError({
        code: "BN_NET_VARIANCE_VALUE",
        message: 'Unable to extract "netVariance" from Summary!AS436: the required value must be finite and numeric, with an absolute value below 10,000,000,000,000,000.',
      });
    }
    return new Map<string, number>([["netVariance", netVariance]]);
  },
];  

export { extractBNReporting } from "./summary.js";
export type { BNTestValue, BNTestYear, BNWorkbookExtract } from "./summary.js";
