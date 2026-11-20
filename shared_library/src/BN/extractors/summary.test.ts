import { describe, expect, it } from "vitest";
import { excelColumnToNumber, type ExcelData } from "../index.js";
import { extractBNReporting } from "./index.js";

function setSummaryCell(data: ExcelData, address: string, value: string | number | boolean | null): void {
  const [, column, row] = /^([A-Z]+)(\d+)$/.exec(address)!;
  const index = Number(row) - 1;
  data[0]!.data[index] ??= [];
  data[0]!.data[index]![excelColumnToNumber(column!)] = value;
}

function mainSummaryFixture(): ExcelData {
  const data: ExcelData = [{ sheet: "Summary", data: [], formulaCells: new Set(["E262", "F262"]) }];
  const label = (row: number, value: string) => setSummaryCell(data, `B${row}`, value);
  const amounts = (row: number, dy1: number, dy2: number, total: number) => {
    setSummaryCell(data, `E${row}`, dy1);
    setSummaryCell(data, `F${row}`, dy2);
    setSummaryCell(data, `AS${row}`, total);
  };

  setSummaryCell(data, "C4", 1);
  setSummaryCell(data, "C5", 2);
  label(12, "MAIN BUDGET NEUTRALITY TEST");
  label(20, "Without-Waiver Total Expenditures");
  label(206, "TOTAL");
  label(220, "With-Waiver Total Expenditures");
  label(249, "TOTAL");
  label(250, "Expenditure Authority Expenditures");
  label(252, "Medicaid Aggregate - WW only");
  label(253, "MEG 1");
  label(254, "MEG 2");
  label(255, "MEG 1");
  label(257, "TOTAL");
  label(258, "Savings Phase-Down (1)");
  label(262, "Is a Corrective Action Plan needed?");
  setSummaryCell(data, "E262", "CAP Needed");
  setSummaryCell(data, "F262", "");

  amounts(206, 120, 130, 1200);
  amounts(249, 210, 220, 2200);
  amounts(253, 31, 32, 0);
  amounts(254, 41, 0, 0);
  amounts(255, 51, 52, 0);
  amounts(257, 72, 74, 720);
  label(300, "HYPOTHETICALS TEST 1");
  return data;
}

function addHypotheticalBlock(
  data: ExcelData,
  testNumber: number,
  capOutcome: string | null = "CAP Needed",
): void {
  const row = 300 + (testNumber - 1) * 10;
  setSummaryCell(data, `B${row}`, `HYPOTHETICALS TEST ${testNumber}`);
  setSummaryCell(data, `B${row + 1}`, "Without-Waiver Total Expenditures");
  setSummaryCell(data, `B${row + 2}`, "TOTAL");
  setSummaryCell(data, `E${row + 2}`, testNumber === 1 ? 0 : testNumber * 10);
  setSummaryCell(data, `AS${row + 2}`, testNumber * 100);
  setSummaryCell(data, `B${row + 3}`, "With-Waiver Total Expenditures");
  setSummaryCell(data, `B${row + 4}`, "TOTAL");
  setSummaryCell(data, `E${row + 4}`, testNumber * 20);
  setSummaryCell(data, `AS${row + 4}`, testNumber * 200);
  setSummaryCell(data, `B${row + 5}`, "Is a Corrective Action Plan needed?");
  if (capOutcome !== null) setSummaryCell(data, `E${row + 5}`, capOutcome);
  data[0]!.formulaCells!.add(`E${row + 5}`);
}

const extractedValues = new Map<string, string | number>([["netVariance", 0]]);

describe("Main reporting extraction", () => {
  it("extracts totals, Expenditure Authority MEGs, DY values and calculated CAP outcomes", () => {
    const data = mainSummaryFixture();
    const result = extractBNReporting(data, extractedValues, { maxHypotheticalTest: 0 });

    expect(result.warnings).toEqual([
      'Main Expenditure Authority row 255 omitted: duplicate MEG name "MEG 1"; keeping the first.',
    ]);
    expect(result.extract.testValues).toContainEqual({
      testId: "Main", measureId: "Without-Waiver Total", megName: null, dyNumber: 1, value: 120,
    });
    expect(result.extract.testValues).toContainEqual({
      testId: "Main", measureId: "With-Waiver Total", megName: null, dyNumber: 2, value: 220,
    });
    expect(result.extract.testValues).toContainEqual({
      testId: "Main", measureId: "Expenditure Authority", megName: "MEG 1", dyNumber: 1, value: 31,
    });
    expect(result.extract.testValues).toContainEqual({
      testId: "Main", measureId: "Expenditure Authority", megName: "MEG 2", dyNumber: 2, value: 0,
    });
    expect(result.extract.testValues).toContainEqual({
      testId: "Main", measureId: "Expenditure Authority", megName: null, dyNumber: null, value: 720,
    });
    expect(result.extract.testValues).toContainEqual({
      testId: "Main", measureId: "Net Variance", megName: null, dyNumber: null, value: 0,
    });
    expect(result.extract.testValues.filter(({ measureId, megName }) => measureId === "Expenditure Authority" && megName === "MEG 1"))
      .toHaveLength(2);
    expect(result.extract.testYears).toEqual([
      { testId: "Main", dyNumber: 1, capNeeded: true },
      { testId: "Main", dyNumber: 2, capNeeded: false },
    ]);

    setSummaryCell(data, "E206", 1e17);
    expect(extractBNReporting(data, extractedValues, { maxHypotheticalTest: 0 }).extract.testValues).toContainEqual({
      testId: "Main", measureId: "Without-Waiver Total", megName: null, dyNumber: 1, value: 1e17,
    });
  });

  it.each([
    ["missing", (data: ExcelData) => setSummaryCell(data, "B300", null)],
    ["an explicit formula", (data: ExcelData) => data[0]!.formulaCells!.add("B300")],
    ["a cached array formula", (data: ExcelData) => {
      data[0]!.arrayFormulaRanges = [{ startRow: 299, endRow: 300, startColumn: 2, endColumn: 2 }];
    }],
    ["duplicated", (data: ExcelData) => setSummaryCell(data, "B301", "HYPOTHETICALS TEST 1")],
    ["after an earlier literal heading", (data: ExcelData) => setSummaryCell(data, "B270", "HYPOTHETICALS TEST 3")],
    ["after an earlier cached heading", (data: ExcelData) => {
      setSummaryCell(data, "B270", "HYPOTHETICALS TEST 3");
      data[0]!.formulaCells!.add("B270");
    }],
  ])("omits optional Main data when the Test 1 boundary is %s", (_reason, setInvalidBoundary) => {
    const data = mainSummaryFixture();
    setInvalidBoundary(data);
    addHypotheticalBlock(data, 2);

    const result = extractBNReporting(data, extractedValues);

    expect(result.extract.testValues.filter(({ testId }) => testId === "Main")).toEqual([{
      testId: "Main", measureId: "Net Variance", megName: null, dyNumber: null, value: 0,
    }]);
    expect(result.extract.testYears.every(({ testId }) => testId !== "Main")).toBe(true);
    expect(result.warnings).toContainEqual(expect.stringContaining("Main test omitted"));
    expect(result.extract.testValues).toContainEqual({
      testId: "Hypothetical 2", measureId: "Without-Waiver Total", megName: null, dyNumber: 1, value: 20,
    });
    expect(result.extract.testYears).toContainEqual({ testId: "Hypothetical 2", dyNumber: 1, capNeeded: true });
  });

  it("falls back to totals only for invalid reporting DY bounds", () => {
    const data = mainSummaryFixture();
    setSummaryCell(data, "C4", 41);
    setSummaryCell(data, "C5", 40);
    const result = extractBNReporting(data, extractedValues, { maxHypotheticalTest: 0 });

    expect(result.extract.testYears).toEqual([]);
    expect(result.extract.testValues).toHaveLength(4);
    expect(result.extract.testValues.every(({ megName, dyNumber }) => megName === null && dyNumber === null)).toBe(true);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining("Reporting DY range is missing or invalid"),
    ]));
  });

  it("omits an ambiguous optional Expenditure Authority section with a warning", () => {
    const data = mainSummaryFixture();
    setSummaryCell(data, "B254", "Medicaid Aggregate - WW only");

    const result = extractBNReporting(data, extractedValues, { maxHypotheticalTest: 0 });

    expect(result.extract.testValues.some(({ measureId }) => measureId === "Expenditure Authority")).toBe(false);
    expect(result.extract.testValues.some(({ measureId }) => measureId === "Without-Waiver Total")).toBe(true);
    expect(result.warnings).toEqual([expect.stringContaining("Main Expenditure Authority omitted")]);
  });

  it("does not borrow a calculated CAP outcome from a later hypothetical when Main's CAP row is missing", () => {
    const data = mainSummaryFixture();
    setSummaryCell(data, "B262", null);
    addHypotheticalBlock(data, 2);

    const result = extractBNReporting(data, extractedValues);

    expect(result.extract.testYears).toEqual([
      { testId: "Hypothetical 2", dyNumber: 1, capNeeded: true },
      { testId: "Hypothetical 2", dyNumber: 2, capNeeded: false },
    ]);
    expect(result.extract.testYears.some(({ testId }) => testId === "Main")).toBe(false);
    expect(result.warnings).toContainEqual(expect.stringContaining("Main CAP-needed omitted"));
  });

  it("does not borrow hypothetical financial outcomes when Main rows are missing", () => {
    const data = mainSummaryFixture();
    setSummaryCell(data, "B20", null);
    setSummaryCell(data, "B220", null);
    setSummaryCell(data, "B262", null);
    addHypotheticalBlock(data, 1);

    const result = extractBNReporting(data, extractedValues);

    const totals = result.extract.testValues.filter(({ measureId }) =>
      measureId === "Without-Waiver Total" || measureId === "With-Waiver Total");
    expect([...new Set(totals.map(({ testId }) => testId))]).toEqual(["Hypothetical 1"]);
    expect(result.extract.testYears.map(({ testId }) => testId)).toEqual(["Hypothetical 1", "Hypothetical 1"]);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining("Main Without-Waiver Total omitted"),
      expect.stringContaining("Main With-Waiver Total omitted"),
    ]));
  });

  it.each([
    ["explicit formula", (data: ExcelData) => { data[0]!.formulaCells!.add("B310"); }],
    ["array formula", (data: ExcelData) => {
      data[0]!.arrayFormulaRanges = [{ startRow: 309, endRow: 310, startColumn: 2, endColumn: 2 }];
    }],
  ])("uses the %s heading as a boundary, but not an extractable heading", (_kind, markFormulaHeading) => {
    const data = mainSummaryFixture();
    addHypotheticalBlock(data, 1);
    setSummaryCell(data, "B305", null);
    addHypotheticalBlock(data, 2);
    markFormulaHeading(data);

    const result = extractBNReporting(data, extractedValues);

    expect(result.extract.testYears.filter(({ testId }) => testId.startsWith("Hypothetical "))).toEqual([]);
    expect(result.extract.testValues.some(({ testId }) => testId === "Hypothetical 2")).toBe(false);
    expect(result.warnings).toContainEqual(expect.stringContaining("Hypothetical 1 CAP-needed omitted"));
  });

  it("omits a missing-heading block with repeated expenditure starts and continues at the next heading", () => {
    const data = mainSummaryFixture();
    addHypotheticalBlock(data, 1);
    addHypotheticalBlock(data, 2);
    setSummaryCell(data, "B310", null);
    setSummaryCell(data, "B305", null);
    addHypotheticalBlock(data, 3);

    const result = extractBNReporting(data, extractedValues);

    expect(result.extract.testValues.some(({ testId }) => testId === "Hypothetical 1")).toBe(false);
    expect(result.extract.testValues.some(({ testId }) => testId === "Hypothetical 3")).toBe(true);
    expect(result.extract.testYears.filter(({ testId }) => testId.startsWith("Hypothetical ")).map(({ testId }) => testId))
      .toEqual(["Hypothetical 3", "Hypothetical 3"]);
    expect(result.extract.testYears.some(({ testId }) => testId === "Hypothetical 1")).toBe(false);
    expect(result.warnings).toContainEqual(expect.stringContaining("Hypothetical 1 omitted: repeated expenditure-section starts"));
  });

  it("uses a formula heading beyond the release cap to bound the preceding eligible block", () => {
    const data = mainSummaryFixture();
    addHypotheticalBlock(data, 13);
    setSummaryCell(data, "B425", null);
    addHypotheticalBlock(data, 14);
    data[0]!.formulaCells!.add("B430");

    const result = extractBNReporting(data, extractedValues, { maxHypotheticalTest: 13 });

    expect(result.extract.testYears.filter(({ testId }) => testId.startsWith("Hypothetical "))).toEqual([]);
    expect(result.extract.testValues.some(({ testId }) => testId === "Hypothetical 14")).toBe(false);
    expect(result.warnings).toContainEqual(expect.stringContaining("Hypothetical 13 CAP-needed omitted"));
  });

  it("extracts 15 blocks by default and honors the explicit release cap while retaining zero and CAP outcomes", () => {
    const data = mainSummaryFixture();
    for (let testNumber = 1; testNumber <= 15; testNumber++) {
      addHypotheticalBlock(data, testNumber, testNumber === 2 ? null : testNumber === 3 ? "unrecognized" : "CAP Needed");
    }

    const allHypotheticals = extractBNReporting(data, extractedValues);
    const releaseHypotheticals = extractBNReporting(data, extractedValues, { maxHypotheticalTest: 13 });
    const allTestIds = new Set(allHypotheticals.extract.testValues.map(({ testId }) => testId));
    const releaseTestIds = new Set(releaseHypotheticals.extract.testValues.map(({ testId }) => testId));

    expect([...allTestIds].filter((testId) => testId.startsWith("Hypothetical "))
      .sort((left, right) => Number(left.split(" ")[1]) - Number(right.split(" ")[1])))
      .toEqual(Array.from({ length: 15 }, (_, index) => `Hypothetical ${index + 1}`));
    expect([...releaseTestIds]).not.toContain("Hypothetical 14");
    expect([...releaseTestIds]).not.toContain("Hypothetical 15");
    expect(releaseTestIds.has("Hypothetical 13")).toBe(true);
    expect(releaseHypotheticals.extract.testYears.map(({ testId }) => testId)).not.toContain("Hypothetical 14");
    expect(releaseHypotheticals.extract.testYears.map(({ testId }) => testId)).not.toContain("Hypothetical 15");
    expect(releaseHypotheticals.extract.testValues).toContainEqual({
      testId: "Hypothetical 1", measureId: "Without-Waiver Total", megName: null, dyNumber: 1, value: 0,
    });
    expect(releaseHypotheticals.extract.testYears).toContainEqual({ testId: "Hypothetical 1", dyNumber: 1, capNeeded: true });
    expect(releaseHypotheticals.extract.testYears).toContainEqual({ testId: "Hypothetical 2", dyNumber: 1, capNeeded: false });
    expect(releaseHypotheticals.extract.testYears).toContainEqual({ testId: "Hypothetical 3", dyNumber: 1, capNeeded: null });
    expect(releaseHypotheticals.warnings).toContainEqual(expect.stringContaining("unrecognized CAP-needed flag"));
  });

  it("keeps missing and duplicate adjacent blocks from borrowing each other's values", () => {
    const data = mainSummaryFixture();
    addHypotheticalBlock(data, 1);
    setSummaryCell(data, "B303", null);
    addHypotheticalBlock(data, 2);
    setSummaryCell(data, "B318", "HYPOTHETICALS TEST 2");
    addHypotheticalBlock(data, 3);

    const result = extractBNReporting(data, extractedValues, { maxHypotheticalTest: 13 });

    expect(result.extract.testValues.some(({ testId }) => testId === "Hypothetical 1")).toBe(false);
    expect(result.extract.testValues.some(({ testId }) => testId === "Hypothetical 2")).toBe(false);
    expect(result.extract.testValues).toContainEqual({
      testId: "Hypothetical 3", measureId: "Without-Waiver Total", megName: null, dyNumber: 1, value: 30,
    });
    expect(result.warnings).toContainEqual(expect.stringContaining("Hypothetical 1 With-Waiver Total omitted"));
    expect(result.warnings).toContainEqual(expect.stringContaining("Hypothetical 2 omitted: HYPOTHETICALS TEST 2 heading has 2 matches"));
  });
});
