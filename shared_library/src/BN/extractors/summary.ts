import { excelColumnRow, isFormulaCell, numberToExcelColumn, type CellValue, type ExcelData } from "../index.js";
import { isBlankCell, readNumericValue } from "./cells.js";
import { locateLabelRow, locateLabelRows, type LabelRange } from "./labels.js";

export type BNTestValue = {
  testId: string;
  measureId: string;
  megName: string | null;
  dyNumber: number | null;
  value: number;
};
export type BNTestYear = { testId: string; dyNumber: number; capNeeded: boolean | null };
export type BNWorkbookExtract = { testValues: BNTestValue[]; testYears: BNTestYear[] };

const SHEET = "Summary";
const CAP_LABEL = "Is a Corrective Action Plan needed?";
const WITHOUT_WAIVER_LABEL = "Without-Waiver Total Expenditures";
const WITH_WAIVER_LABEL = "With-Waiver Total Expenditures";
const MAX_REPORTING_DY = 40;

function sectionRows(
  data: ExcelData,
  labels: readonly string[],
  range: LabelRange,
  section: string,
  warnings: string[],
): number[] | undefined {
  const rows: number[] = [];
  let first = range.first;
  for (const label of labels) {
    const result = locateLabelRow(data, SHEET, label, { first, last: range.last });
    if (!result.ok) {
      warnings.push(`${section} omitted: ${result.reason}`);
      return undefined;
    }
    rows.push(result.row);
    first = result.row + 1;
  }
  return rows;
}

function reportingDys(data: ExcelData): { dys: number[]; warning?: string } {
  const sheet = data.find((entry) => entry.sheet === SHEET);
  const start = sheet?.data[3]?.[2];
  const end = sheet?.data[4]?.[2];
  const startDy = typeof start === "number" || typeof start === "string" && start.trim() !== "" ? Number(start) : Number.NaN;
  const endDy = typeof end === "number" || typeof end === "string" && end.trim() !== "" ? Number(end) : Number.NaN;
  if (!Number.isInteger(startDy) || !Number.isInteger(endDy) || startDy < 1 || endDy > MAX_REPORTING_DY || startDy > endDy) {
    return { dys: [], warning: "Reporting DY range is missing or invalid; exporting Summary totals only." };
  }
  return { dys: Array.from({ length: endDy - startDy + 1 }, (_, index) => startDy + index) };
}

function extractMainSummary(data: ExcelData, dys: number[]): { extract: BNWorkbookExtract; warnings: string[] } {
  const extract: BNWorkbookExtract = { testValues: [], testYears: [] };
  const warnings: string[] = [];
  const sheet = data.find((entry) => entry.sheet === SHEET);
  if (!sheet) return { extract, warnings: ['Summary omitted: Sheet "Summary" not found.'] };

  const addValues = (row: number, measureId: string, megName: string | null, includeTotal: boolean) => {
    const columns: { column: string; dyNumber: number | null }[] = dys.map((dyNumber) => ({
      column: numberToExcelColumn(3 + dyNumber),
      dyNumber,
    }));
    if (includeTotal) columns.push({ column: "AS", dyNumber: null });
    for (const { column, dyNumber } of columns) {
      const value = readNumericValue(data, SHEET, `${column}${row}`, warnings);
      if (value !== undefined) extract.testValues.push({ testId: "Main", measureId, megName, dyNumber, value });
    }
  };

  const hypotheticalBoundaries = locateLabelRows(data, SHEET, "HYPOTHETICALS TEST 1");
  if (hypotheticalBoundaries.length > 1) {
    warnings.push(`Main test omitted: HYPOTHETICALS TEST 1 boundary has ${hypotheticalBoundaries.length} matches.`);
    return { extract, warnings };
  }
  const firstHypothetical = sheet.data.findIndex((row, index) =>
    typeof row?.[1] === "string" && /^HYPOTHETICALS TEST [1-9]\d*$/.test(row[1]) &&
    !isFormulaCell(data, SHEET, `B${index + 1}`));
  const mainRange = { last: firstHypothetical >= 0 ? firstHypothetical : sheet.data.length };
  const main = sectionRows(data, ["MAIN BUDGET NEUTRALITY TEST"], mainRange, "Main test", warnings);
  if (!main) return { extract, warnings };
  const sectionRange = { first: main[0]! + 1, last: mainRange.last };

  for (const [measureId, startLabel, endLabel] of [
    ["Without-Waiver Total", WITHOUT_WAIVER_LABEL, WITH_WAIVER_LABEL],
    ["With-Waiver Total", WITH_WAIVER_LABEL, "Expenditure Authority Expenditures"],
  ] as const) {
    const bounds = sectionRows(data, [startLabel, endLabel], sectionRange, `Main ${measureId}`, warnings);
    if (!bounds) continue;
    const total = sectionRows(data, ["TOTAL"], { first: bounds[0]! + 1, last: bounds[1]! - 1 }, `Main ${measureId}`, warnings);
    if (total) addValues(total[0]!, measureId, null, true);
  }

  const cap = sectionRows(data, [CAP_LABEL], sectionRange, "Main CAP-needed", warnings);
  if (cap) {
    for (const dyNumber of dys) {
      const address = `${numberToExcelColumn(3 + dyNumber)}${cap[0]}`;
      const raw = excelColumnRow(address, SHEET, data);
      let capNeeded: boolean | null = null;
      if (raw === "CAP Needed") capNeeded = true;
      else if (isBlankCell(raw) || raw === " ") capNeeded = false;
      else warnings.push(`Cell ${SHEET}!${address} has an unrecognized CAP-needed flag; stored value will be NULL.`);
      extract.testYears.push({ testId: "Main", dyNumber, capNeeded });
    }
  }

  const bounds = sectionRows(data, ["Medicaid Aggregate - WW only", "Savings Phase-Down (1)"], sectionRange, "Main Expenditure Authority", warnings);
  if (!bounds) return { extract, warnings };
  const total = sectionRows(data, ["TOTAL"], { first: bounds[0]! + 1, last: bounds[1]! - 1 }, "Main Expenditure Authority", warnings);
  if (!total) return { extract, warnings };
  const names = new Set<string>();
  for (let row = bounds[0]! + 1; row < total[0]!; row++) {
    const name = excelColumnRow(`B${row}`, SHEET, data) as CellValue | null;
    if (isBlankCell(name)) continue;
    if (typeof name !== "string") {
      warnings.push(`Main Expenditure Authority row ${row} omitted: MEG name is not text.`);
      continue;
    }
    if (names.has(name)) {
      warnings.push(`Main Expenditure Authority row ${row} omitted: duplicate MEG name "${name}"; keeping the first.`);
      continue;
    }
    names.add(name);
    addValues(row, "Expenditure Authority", name, false);
  }
  addValues(total[0]!, "Expenditure Authority", null, true);
  return { extract, warnings };
}

export function extractBNReporting(
  data: ExcelData,
  extractedValues: ReadonlyMap<string, unknown>,
): { extract: BNWorkbookExtract; warnings: string[] } {
  const reportingRange = reportingDys(data);
  const { extract, warnings } = extractMainSummary(data, reportingRange.dys);
  if (reportingRange.warning) warnings.unshift(reportingRange.warning);

  const netVariance = extractedValues.get("netVariance");
  if (typeof netVariance !== "number" || !Number.isFinite(netVariance)) {
    throw new Error("A valid BN workbook must have a finite extracted net-variance value.");
  }
  extract.testValues.push({
    testId: "Main",
    measureId: "Net Variance",
    megName: null,
    dyNumber: null,
    value: netVariance,
  });
  return { extract, warnings };
}
