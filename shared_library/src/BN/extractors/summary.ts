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
const MAX_HYPOTHETICAL_TEST = 15;
const HYPOTHETICAL_HEADING = /^HYPOTHETICALS TEST ([1-9]\d*)$/;

type HypotheticalHeading = { testNumber: number; row: number };

export type BNReportingOptions = { maxHypotheticalTest?: number };

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

function addValues(
  extract: BNWorkbookExtract,
  data: ExcelData,
  dys: number[],
  row: number,
  testId: string,
  measureId: string,
  megName: string | null,
  includeTotal: boolean,
  warnings: string[],
): void {
  const columns: { column: string; dyNumber: number | null }[] = dys.map((dyNumber) => ({
    column: numberToExcelColumn(3 + dyNumber),
    dyNumber,
  }));
  if (includeTotal) columns.push({ column: "AS", dyNumber: null });
  for (const { column, dyNumber } of columns) {
    const value = readNumericValue(data, SHEET, `${column}${row}`, warnings);
    if (value !== undefined) extract.testValues.push({ testId, measureId, megName, dyNumber, value });
  }
}

function addCapYears(
  extract: BNWorkbookExtract,
  data: ExcelData,
  dys: number[],
  row: number,
  testId: string,
  warnings: string[],
): void {
  for (const dyNumber of dys) {
    const address = `${numberToExcelColumn(3 + dyNumber)}${row}`;
    const raw = excelColumnRow(address, SHEET, data);
    let capNeeded: boolean | null = null;
    if (raw === "CAP Needed") capNeeded = true;
    else if (isBlankCell(raw) || raw === " ") capNeeded = false;
    else warnings.push(`Cell ${SHEET}!${address} has an unrecognized CAP-needed flag; stored value will be NULL.`);
    extract.testYears.push({ testId, dyNumber, capNeeded });
  }
}

function findHypotheticalHeadings(data: ExcelData): HypotheticalHeading[] {
  const sheet = data.find((entry) => entry.sheet === SHEET);
  if (!sheet) return [];

  const headings: HypotheticalHeading[] = [];
  for (let index = 0; index < sheet.data.length; index++) {
    const label = sheet.data[index]?.[1];
    if (typeof label !== "string" || isFormulaCell(data, SHEET, `B${index + 1}`)) continue;
    const match = HYPOTHETICAL_HEADING.exec(label);
    if (match) headings.push({ testNumber: Number(match[1]), row: index + 1 });
  }
  return headings;
}

function extractMainSummary(
  data: ExcelData,
  dys: number[],
): { extract: BNWorkbookExtract; warnings: string[] } {
  const extract: BNWorkbookExtract = { testValues: [], testYears: [] };
  const warnings: string[] = [];
  const sheet = data.find((entry) => entry.sheet === SHEET);
  if (!sheet) return { extract, warnings: ['Summary omitted: Sheet "Summary" not found.'] };

  const firstHypothetical = locateLabelRow(data, SHEET, "HYPOTHETICALS TEST 1");
  if (!firstHypothetical.ok) {
    warnings.push(`Main test omitted: ${firstHypothetical.reason}`);
    return { extract, warnings };
  }
  // An earlier heading makes the Main boundary unsafe even if that heading is a cached formula result.
  const earlierHypothetical = sheet.data.findIndex((row, index) =>
    index + 1 < firstHypothetical.row && typeof row?.[1] === "string" && HYPOTHETICAL_HEADING.test(row[1]));
  if (earlierHypothetical >= 0) {
    warnings.push(`Main test omitted: HYPOTHETICALS TEST 1 boundary is out of order; HYPOTHETICALS TEST heading found at row ${earlierHypothetical + 1}.`);
    return { extract, warnings };
  }
  const mainRange = { last: firstHypothetical.row - 1 };
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
    if (total) addValues(extract, data, dys, total[0]!, "Main", measureId, null, true, warnings);
  }

  const cap = sectionRows(data, [CAP_LABEL], sectionRange, "Main CAP-needed", warnings);
  if (cap) addCapYears(extract, data, dys, cap[0]!, "Main", warnings);

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
    addValues(extract, data, dys, row, "Main", "Expenditure Authority", name, false, warnings);
  }
  addValues(extract, data, dys, total[0]!, "Main", "Expenditure Authority", null, true, warnings);
  return { extract, warnings };
}

function extractHypotheticalSummaries(
  data: ExcelData,
  dys: number[],
  headings: HypotheticalHeading[],
  maxHypotheticalTest: number,
): { extract: BNWorkbookExtract; warnings: string[] } {
  const extract: BNWorkbookExtract = { testValues: [], testYears: [] };
  const warnings: string[] = [];
  const sheet = data.find((entry) => entry.sheet === SHEET);
  if (!sheet) return { extract, warnings };

  const headingCounts = new Map<number, number>();
  for (const { testNumber } of headings) {
    headingCounts.set(testNumber, (headingCounts.get(testNumber) ?? 0) + 1);
  }
  for (const [testNumber, count] of headingCounts) {
    if (count > 1 && testNumber <= maxHypotheticalTest) {
      warnings.push(`Hypothetical ${testNumber} omitted: HYPOTHETICALS TEST ${testNumber} heading has ${count} matches.`);
    }
  }

  for (let index = 0; index < headings.length; index++) {
    const heading = headings[index]!;
    if (heading.testNumber > maxHypotheticalTest || headingCounts.get(heading.testNumber) !== 1) continue;

    const nextHeading = headings[index + 1];
    const range = { first: heading.row + 1, last: (nextHeading?.row ?? sheet.data.length + 1) - 1 };
    const testId = `Hypothetical ${heading.testNumber}`;

    const withoutWaiver = sectionRows(
      data,
      [WITHOUT_WAIVER_LABEL, WITH_WAIVER_LABEL],
      range,
      `${testId} Without-Waiver Total`,
      warnings,
    );
    if (withoutWaiver) {
      const total = sectionRows(
        data,
        ["TOTAL"],
        { first: withoutWaiver[0]! + 1, last: withoutWaiver[1]! - 1 },
        `${testId} Without-Waiver Total`,
        warnings,
      );
      if (total) addValues(extract, data, dys, total[0]!, testId, "Without-Waiver Total", null, true, warnings);
    }

    const withWaiver = sectionRows(data, [WITH_WAIVER_LABEL], range, `${testId} With-Waiver Total`, warnings);
    if (withWaiver) {
      const boundaryRows = [
        ...locateLabelRows(data, SHEET, CAP_LABEL, { first: withWaiver[0]! + 1, last: range.last }),
        ...locateLabelRows(data, SHEET, "Expenditure Authority Expenditures", {
          first: withWaiver[0]! + 1,
          last: range.last,
        }),
      ];
      const lastTotalRow = boundaryRows.length > 0 ? Math.min(...boundaryRows) - 1 : range.last;
      const total = sectionRows(
        data,
        ["TOTAL"],
        { first: withWaiver[0]! + 1, last: lastTotalRow },
        `${testId} With-Waiver Total`,
        warnings,
      );
      if (total) addValues(extract, data, dys, total[0]!, testId, "With-Waiver Total", null, true, warnings);
    }

    const cap = sectionRows(data, [CAP_LABEL], range, `${testId} CAP-needed`, warnings);
    if (cap) addCapYears(extract, data, dys, cap[0]!, testId, warnings);
  }

  return { extract, warnings };
}

export function extractBNReporting(
  data: ExcelData,
  extractedValues: ReadonlyMap<string, unknown>,
  options: BNReportingOptions = {},
): { extract: BNWorkbookExtract; warnings: string[] } {
  const maxHypotheticalTest = options.maxHypotheticalTest ?? MAX_HYPOTHETICAL_TEST;
  if (!Number.isInteger(maxHypotheticalTest) || maxHypotheticalTest < 0 || maxHypotheticalTest > MAX_HYPOTHETICAL_TEST) {
    throw new RangeError(`maxHypotheticalTest must be an integer between 0 and ${MAX_HYPOTHETICAL_TEST}.`);
  }

  const reportingRange = reportingDys(data);
  const headings = findHypotheticalHeadings(data);
  const mainResult = extractMainSummary(data, reportingRange.dys);
  const hypotheticalResult = extractHypotheticalSummaries(data, reportingRange.dys, headings, maxHypotheticalTest);
  const extract = mainResult.extract;
  extract.testValues.push(...hypotheticalResult.extract.testValues);
  extract.testYears.push(...hypotheticalResult.extract.testYears);
  const warnings = [...mainResult.warnings, ...hypotheticalResult.warnings];
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
