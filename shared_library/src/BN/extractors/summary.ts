import { excelColumnRow, numberToExcelColumn, type ExcelData } from "../index.js";
import { readNumericValue } from "./cells.js";
import { locateLabelRow, locateLabelRows, type LabelRange } from "./labels.js";

export type BNTestValue = {
  testId: string;
  measureId: string;
  megName: string | null;
  dyNumber: number | null;
  value: number;
};
export type BNTestYear = { testId: string; dyNumber: number; capNeeded: boolean | null };

const SHEET = "Summary";
const CAP_LABEL = "Is a Corrective Action Plan needed?";
const WOW_LABEL = "Without-Waiver Total Expenditures";
const WW_LABEL = "With-Waiver Total Expenditures";

function sectionRows(data: ExcelData, labels: string[], range: LabelRange, section: string, warnings: string[]): number[] | undefined {
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

export function extractSummary(data: ExcelData, dys: number[]): {
  testValues: BNTestValue[];
  testYears: BNTestYear[];
  warnings: string[];
} {
  const testValues: BNTestValue[] = [];
  const testYears: BNTestYear[] = [];
  const warnings: string[] = [];
  const sheet = data.find((entry) => entry.sheet === SHEET);
  if (!sheet) return { testValues, testYears, warnings: ['Summary omitted: Sheet "Summary" not found.'] };

  const addValues = (row: number, testId: string, measureId: string, megName: string | null, totals: boolean) => {
    const columns = dys.map((dy) => ({ column: numberToExcelColumn(3 + dy), dyNumber: dy as number | null }));
    if (totals) columns.push({ column: "AS", dyNumber: null });
    for (const { column, dyNumber } of columns) {
      const value = readNumericValue(data, SHEET, `${column}${row}`, warnings);
      if (value !== undefined) testValues.push({ testId, measureId, megName, dyNumber, value });
    }
  };

  const extractTest = (testId: string, range: LabelRange, main: boolean) => {
    for (const [measure, after, before] of [
      ["Without-Waiver Total", WOW_LABEL, WW_LABEL],
      ["With-Waiver Total", WW_LABEL, main ? "Expenditure Authority Expenditures" : CAP_LABEL],
    ] as const) {
      const bounds = sectionRows(data, [after, before], range, `${testId} ${measure}`, warnings);
      if (!bounds) continue;
      const total = sectionRows(data, ["TOTAL"], { first: bounds[0]! + 1, last: bounds[1]! - 1 }, `${testId} ${measure}`, warnings);
      if (total) addValues(total[0]!, testId, measure, null, true);
    }
    const cap = sectionRows(data, [CAP_LABEL], range, `${testId} CAP-needed`, warnings);
    if (cap) {
      for (const dyNumber of dys) {
        const address = `${numberToExcelColumn(3 + dyNumber)}${cap[0]}`;
        const raw = excelColumnRow(address, SHEET, data);
        let capNeeded: boolean | null = null;
        if (raw === "CAP Needed") capNeeded = true;
        else if (raw === null || raw === undefined || raw === "" || raw === " " || raw === "Blank cell. No entry") capNeeded = false;
        else warnings.push(`Cell ${SHEET}!${address} has an unrecognized CAP-needed flag; stored value will be NULL.`);
        testYears.push({ testId, dyNumber, capNeeded });
      }
    }
    if (!main) return;
    const bounds = sectionRows(data, ["Medicaid Aggregate - WW only", "Savings Phase-Down (1)"], range, "Main Expenditure Authority", warnings);
    if (!bounds) return;
    const total = sectionRows(data, ["TOTAL"], { first: bounds[0]! + 1, last: bounds[1]! - 1 }, "Main Expenditure Authority", warnings);
    if (!total) return;
    const names = new Set<string>();
    for (let row = bounds[0]! + 1; row < total[0]!; row++) {
      const name = excelColumnRow(`B${row}`, SHEET, data);
      if (name === null || name === undefined || name === "" || name === "Blank cell. No entry") continue;
      if (typeof name !== "string") {
        warnings.push(`Main Expenditure Authority row ${row} omitted: MEG name is not text.`);
        continue;
      }
      if (names.has(name)) {
        warnings.push(`Main Expenditure Authority row ${row} omitted: duplicate MEG name "${name}"; keeping the first.`);
        continue;
      }
      names.add(name);
      addValues(row, testId, "Expenditure Authority", name, false);
    }
    addValues(total[0]!, testId, "Expenditure Authority", null, true);
  };

  const firstHypotheticals = locateLabelRows(data, SHEET, "HYPOTHETICALS TEST 1");
  if (firstHypotheticals.length > 1) {
    warnings.push(`Main test omitted: HYPOTHETICALS TEST 1 boundary has ${firstHypotheticals.length} matches.`);
  } else {
    const mainRange = { last: firstHypotheticals[0] !== undefined ? firstHypotheticals[0] - 1 : sheet.data.length };
    const main = sectionRows(data, ["MAIN BUDGET NEUTRALITY TEST"], mainRange, "Main test", warnings);
    if (main) extractTest("Main", { first: main[0]! + 1, last: mainRange.last }, true);
  }

  let first = 1;
  for (let n = 1; n <= 15; n++) {
    const heading = `HYPOTHETICALS TEST ${n}`;
    if (locateLabelRows(data, SHEET, heading, { first }).length === 0) break;
    const start = sectionRows(data, [heading], { first }, `Hypothetical ${n}`, warnings);
    if (!start) break;
    const next = locateLabelRows(data, SHEET, `HYPOTHETICALS TEST ${n + 1}`, { first: start[0]! + 1 });
    if (next.length > 1) {
      warnings.push(`Hypothetical ${n} omitted: next block heading has ${next.length} matches.`);
      break;
    }
    extractTest(`Hypothetical ${n}`, { first: start[0]! + 1, last: next[0] !== undefined ? next[0] - 1 : sheet.data.length }, false);
    first = start[0]! + 1;
  }
  return { testValues, testYears, warnings };
}