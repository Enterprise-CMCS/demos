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
  return data;
}

const extractedValues = new Map<string, string | number>([["netVariance", 0]]);

describe("Main reporting extraction", () => {
  it("extracts totals, Expenditure Authority MEGs, DY values and calculated CAP outcomes", () => {
    const result = extractBNReporting(mainSummaryFixture(), extractedValues);

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
  });

  it("falls back to totals only for invalid reporting DY bounds", () => {
    const data = mainSummaryFixture();
    setSummaryCell(data, "C4", 41);
    setSummaryCell(data, "C5", 40);
    const result = extractBNReporting(data, extractedValues);

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

    const result = extractBNReporting(data, extractedValues);

    expect(result.extract.testValues.some(({ measureId }) => measureId === "Expenditure Authority")).toBe(false);
    expect(result.extract.testValues.some(({ measureId }) => measureId === "Without-Waiver Total")).toBe(true);
    expect(result.warnings).toEqual([expect.stringContaining("Main Expenditure Authority omitted")]);
  });

  it("does not borrow a calculated CAP outcome from a later hypothetical when Main's CAP row is missing", () => {
    const data = mainSummaryFixture();
    setSummaryCell(data, "B262", null);
    setSummaryCell(data, "B280", "HYPOTHETICALS TEST 2");
    setSummaryCell(data, "B284", "Is a Corrective Action Plan needed?");
    setSummaryCell(data, "E284", "CAP Needed");

    const result = extractBNReporting(data, extractedValues);

    expect(result.extract.testYears).toEqual([]);
    expect(result.warnings).toContainEqual(expect.stringContaining("Main CAP-needed omitted"));
  });
});
