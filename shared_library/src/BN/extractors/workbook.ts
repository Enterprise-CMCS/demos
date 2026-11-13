import { numberToExcelColumn, type CellValue, type ExcelData } from "../index.js";
import { isBlankCell } from "./cells.js";
import { extractSummary, type BNTestValue, type BNTestYear } from "./summary.js";
import { extractSpendingLimits, type BNSpendingLimit } from "./spendingLimits.js";

export const BN_PARSER_VERSION = "v2.14-1";
export type BNWorkbookExtract = {
  testValues: BNTestValue[];
  testYears: BNTestYear[];
  spendingLimits: BNSpendingLimit[];
};
export type BNWorkbookExtractionOptions = { maxHypotheticalTest?: number };
export type SparseContent = Record<string, Record<string, CellValue>>;

export function reportingDys(startDy?: number, endDy?: number): { dys: number[]; warning?: string } {
  if (startDy === undefined || endDy === undefined || !Number.isInteger(startDy) || !Number.isInteger(endDy)
    || startDy < 1 || endDy > 40 || startDy > endDy) {
    return { dys: [], warning: "Reporting DY range is missing or invalid (expected integers 1–40, start <= end); only totals will be stored." };
  }
  return { dys: Array.from({ length: endDy - startDy + 1 }, (_, index) => startDy + index) };
}

export function extractBNWorkbook(
  data: ExcelData,
  dys: number[],
  extractedValues: ReadonlyMap<string, string | number>,
  options: BNWorkbookExtractionOptions = {},
): {
  extract: BNWorkbookExtract;
  warnings: string[];
} {
  const summary = extractSummary(data, dys, options);
  const spending = extractSpendingLimits(data);
  const netVariance = extractedValues.get("netVariance");
  if (typeof netVariance !== "number" || !Number.isFinite(netVariance)) {
    throw new Error("Required registry value netVariance is missing or invalid.");
  }
  summary.testValues.push({ testId: "Main", measureId: "Net Variance", megName: null, dyNumber: null, value: netVariance });
  return {
    extract: { testValues: summary.testValues, testYears: summary.testYears, spendingLimits: spending.spendingLimits },
    warnings: [...summary.warnings, ...spending.warnings],
  };
}

export function toSparseContent(data: ExcelData): SparseContent {
  return Object.fromEntries(data.map((sheet) => {
    const cells: [string, CellValue][] = [];
    sheet.data.forEach((row, rowIndex) => row?.forEach((value, columnIndex) => {
      if (value === null || isBlankCell(value) || (typeof value === "string" && value.trim() === "")) return;
      cells.push([`${numberToExcelColumn(columnIndex)}${rowIndex + 1}`, value]);
    }));
    return [sheet.sheet, Object.fromEntries(cells)];
  }));
}