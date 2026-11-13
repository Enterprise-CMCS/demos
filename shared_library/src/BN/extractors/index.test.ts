import { afterEach, describe, expect, it, vi } from "vitest";
import { excelColumnToNumber, type ExcelData } from "../index.js";
import { validateBNWorkbook } from "../validation.js";
import { BN_WORKBOOK_FIELDS, extractBNReporting, extractorFunctions, missingFieldWarnings } from "./index.js";

function workbook(netVarianceRow = 436): ExcelData {
  const summary: ExcelData[number] = { sheet: "Summary", data: [] };
  summary.data[3] = [null, null, 27];
  summary.data[4] = [null, null, 32];
  summary.data[7] = [null, "Actuals + Projected"];
  summary.data[435] = [];
  summary.data[435]![excelColumnToNumber("AS")] = -999;
  summary.data[netVarianceRow - 1] = [null, "NET VARIANCE"];
  summary.data[netVarianceRow - 1]![excelColumnToNumber("AS")] = 12345678;
  return [
    summary,
    {
      sheet: "C Report",
      data: [
        [],
        [null, null, null, new Date("2026-07-14T00:00:00.000Z"), null, 32],
        [null, null, null, new Date("2026-06-30T12:00:00.000Z"), null, 4],
      ],
    },
    { sheet: "DY Def", data: [["Example State "], ["11-W-00000/1"]] },
  ];
}

function extract(data: ExcelData): Map<string, string | number> {
  const values = new Map<string, string | number>();
  for (const extractor of extractorFunctions) {
    extractor(data)?.forEach((value, key) => values.set(key, value));
  }
  return values;
}

afterEach(() => vi.restoreAllMocks());

describe("BN extractors", () => {
  it("reads NET VARIANCE from the fixed AS436 address when its label is at B436", () => {
    const values = extract(workbook(436));

    expect(values.get("actuals")).toBe("Actuals + Projected");
    expect(values.get("netVariance")).toBe(12345678);
  });

  it("extracts every period and identity field using its registered key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const data = workbook();
    const values = extract(data);
    expect(values).toEqual(new Map<string, string | number>([
      ["actuals", "Actuals + Projected"],
      ["netVariance", 12345678],
      ["reportingStartDy", 27],
      ["reportingEndDy", 32],
      ["reportingDy", 32],
      ["reportingQuarter", 4],
      ["dataPulledOn", "2026-07-14"],
      ["periodThrough", "2026-06-30"],
      ["workbookStateName", "Example State "],
      ["workbookDemonstrationNumber", "11-W-00000/1"],
    ]));
    for (const field of BN_WORKBOOK_FIELDS) {
      expect(field.extractor(data)).toEqual(new Map([[field.key, values.get(field.key)]]));
    }
    expect(missingFieldWarnings(values)).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("derives extractors from a unique registry of database columns", () => {
    expect(extractorFunctions).toEqual(BN_WORKBOOK_FIELDS.map((field) => field.extractor));
    expect(BN_WORKBOOK_FIELDS.map(({ key, column, required }) => [key, column, required])).toEqual([
      ["actuals", "actuals", true],
      ["netVariance", "net_variance_total", true],
      ["reportingStartDy", "reporting_start_dy", false],
      ["reportingEndDy", "reporting_end_dy", false],
      ["reportingDy", "reporting_dy", false],
      ["reportingQuarter", "reporting_quarter", false],
      ["dataPulledOn", "data_pulled_on", false],
      ["periodThrough", "period_through", false],
      ["workbookStateName", "workbook_state_name", false],
      ["workbookDemonstrationNumber", "workbook_demonstration_number", false],
    ]);
    expect(new Set(BN_WORKBOOK_FIELDS.map((field) => field.key)).size).toBe(BN_WORKBOOK_FIELDS.length);
    expect(new Set(BN_WORKBOOK_FIELDS.map((field) => field.column)).size).toBe(BN_WORKBOOK_FIELDS.length);
  });

  it("keeps validation successful when optional fields or sheets are missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const summary = workbook()[0]!;
    summary.data[3] = [];
    summary.data[4] = [];
    const result = await validateBNWorkbook([summary], [], extractorFunctions);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.extractedValues).toEqual(new Map<string, string | number>([
      ["actuals", "Actuals + Projected"], ["netVariance", 12345678],
    ]));
    expect(warn).toHaveBeenCalledTimes(8);
    const warnings = missingFieldWarnings(result.extractedValues!);
    expect(warnings).toHaveLength(8);
    for (const field of BN_WORKBOOK_FIELDS.filter((field) => !field.required)) {
      expect(warnings.filter((warning) => warning.includes(`"${field.key}"`))).toHaveLength(1);
    }
  });

  it("warns once per unparseable optional field without affecting required values", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const data = workbook();
    data[0]!.data[3]![2] = "not numeric";
    data[1]!.data[1]![3] = "not a date";
    const result = await validateBNWorkbook(data, [], extractorFunctions);
    expect(result.isValid).toBe(true);
    expect(result.extractedValues?.get("actuals")).toBe("Actuals + Projected");
    expect(result.extractedValues?.get("netVariance")).toBe(12345678);
    expect(result.extractedValues?.has("reportingStartDy")).toBe(false);
    expect(result.extractedValues?.has("dataPulledOn")).toBe(false);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(missingFieldWarnings(result.extractedValues!)).toEqual([
      expect.stringContaining('"reportingStartDy"'),
      expect.stringContaining('"dataPulledOn"'),
    ]);
  });

  it.each([1.5, 2147483648])("omits non-integer or out-of-range database integers %j", (value) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const data = workbook();
    data[0]!.data[3]![2] = value;
    data[0]!.data[4]![2] = value;
    data[1]!.data[1]![5] = value;
    data[1]!.data[2]![5] = value;
    const values = extract(data);
    for (const key of ["reportingStartDy", "reportingEndDy", "reportingDy", "reportingQuarter"]) {
      expect(values.has(key)).toBe(false);
    }
    expect(warn).toHaveBeenCalledTimes(4);
    expect(missingFieldWarnings(values)).toHaveLength(4);
  });

  it.each([null, "", "Blank cell. No entry"])("still throws on missing required actuals %j", async (value) => {
    const data = workbook();
    data[0]!.data[7]![1] = value;
    await expect(validateBNWorkbook(data, [], extractorFunctions)).rejects.toThrow('Unable to extract "actuals"');
  });

  it.each(["Missing", "NET VARIANCE ", "net variance"])("never falls back to AS436 for label %j", async (value) => {
    const data = workbook();
    data[0]!.data[435]![1] = value;
    await expect(validateBNWorkbook(data, [], extractorFunctions)).rejects.toThrow('Unable to extract "netVariance"');
  });

  it("throws for duplicate required labels even when AS436 is numeric", () => {
    const data = workbook();
    data[0]!.data[448] = [null, "NET VARIANCE"];
    expect(() => extract(data)).toThrow("Summary!AS436, Summary!AS449");
  });

  it.each([null, "", "Blank cell. No entry", "not numeric"])("still throws for an unreadable required net variance %j", async (value) => {
    const data = workbook(436);
    data[0]!.data[435]![excelColumnToNumber("AS")] = value;
    await expect(validateBNWorkbook(data, [], extractorFunctions)).rejects.toThrow('Unable to extract "netVariance"');
  });
});

describe("missingFieldWarnings", () => {
  it("only reports absent optional keys, not required keys or present zero/empty values", () => {
    const values = new Map<string, string | number>([
      ["reportingStartDy", 0], ["workbookStateName", ""], ["unknown", 1],
    ]);
    const warnings = missingFieldWarnings(values);
    expect(warnings).toHaveLength(6);
    expect(warnings.some((warning) => warning.includes('"actuals"'))).toBe(false);
    expect(warnings.some((warning) => warning.includes('"netVariance"'))).toBe(false);
    expect(warnings.some((warning) => warning.includes('"reportingStartDy"'))).toBe(false);
    expect(warnings.some((warning) => warning.includes('"workbookStateName"'))).toBe(false);
    expect(warnings.some((warning) => warning.includes('"unknown"'))).toBe(false);
    expect(missingFieldWarnings(values)).toEqual(warnings);
  });
});

describe("extractBNReporting", () => {
  const requiredValues = () => new Map<string, string | number>([["netVariance", 0]]);

  it.each([
    { name: "valid range", values: [["reportingStartDy", 1], ["reportingEndDy", 2]], invalid: false },
    { name: "missing start", values: [["reportingEndDy", 2]], invalid: true },
    { name: "reversed range", values: [["reportingStartDy", 3], ["reportingEndDy", 2]], invalid: true },
    { name: "fractional range", values: [["reportingStartDy", 1.5], ["reportingEndDy", 2]], invalid: true },
    { name: "nonnumeric range", values: [["reportingStartDy", "1"], ["reportingEndDy", 2]], invalid: true },
  ] as const)("handles a $name", ({ values, invalid }) => {
    const extractedValues = requiredValues();
    values.forEach(([key, value]) => extractedValues.set(key, value));

    const result = extractBNReporting(workbook(), extractedValues);
    const rangeWarnings = result.warnings.filter((warning) => warning.startsWith("Reporting DY range"));

    expect(rangeWarnings).toHaveLength(invalid ? 1 : 0);
    if (invalid) expect(result.warnings[0]).toMatch(/^Optional workbook field/);
  });

  it("orders optional-field and range warnings before summary and spending-limit warnings", () => {
    const extractedValues = new Map<string, string | number>([
      ["netVariance", 0],
      ["reportingStartDy", 3],
      ["reportingEndDy", 2],
    ]);

    const result = extractBNReporting(workbook(), extractedValues);

    expect(result.warnings).toEqual([
      ...missingFieldWarnings(extractedValues),
      "Reporting DY range is missing or invalid (expected integers 1–40, start <= end); only totals will be stored.",
      'Main test omitted: Label "MAIN BUDGET NEUTRALITY TEST" not found in column B of sheet "Summary" in the search range.',
      'Spending limits omitted: Sheet "Program Spending Limits" not found.',
    ]);
  });

  it("includes DY rows for a valid reporting range", () => {
    const data: ExcelData[number]["data"] = [
      [null, "MAIN BUDGET NEUTRALITY TEST"],
      [null, "Without-Waiver Total Expenditures"],
      [null, "TOTAL"],
      [null, "With-Waiver Total Expenditures"],
      [null, "TOTAL"],
      [null, "Expenditure Authority Expenditures"],
      [null, "Medicaid Aggregate - WW only"],
      [null, "MEG A"],
      [null, "TOTAL"],
      [null, "Savings Phase-Down (1)"],
    ];
    data[2]![excelColumnToNumber("E")] = 101;
    data[2]![excelColumnToNumber("AS")] = 11;
    data[4]![excelColumnToNumber("AS")] = 12;
    data[8]![excelColumnToNumber("AS")] = 13;

    const result = extractBNReporting([{ sheet: "Summary", data }], new Map([
      ["netVariance", 0],
      ["reportingStartDy", 1],
      ["reportingEndDy", 2],
    ]));

    expect(result.extract.testValues).toContainEqual({
      testId: "Main", measureId: "Without-Waiver Total", megName: null, dyNumber: 1, value: 101,
    });
    expect(result.warnings.some((warning) => warning.startsWith("Reporting DY range"))).toBe(false);
  });

  it("extracts summary totals without DY rows when the reporting range is invalid", () => {
    const data: ExcelData[number]["data"] = [
      [null, "MAIN BUDGET NEUTRALITY TEST"],
      [null, "Without-Waiver Total Expenditures"],
      [null, "TOTAL"],
      [null, "With-Waiver Total Expenditures"],
      [null, "TOTAL"],
      [null, "Expenditure Authority Expenditures"],
      [null, "Medicaid Aggregate - WW only"],
      [null, "MEG A"],
      [null, "TOTAL"],
      [null, "Savings Phase-Down (1)"],
    ];
    data[2]![excelColumnToNumber("AS")] = 11;
    data[4]![excelColumnToNumber("AS")] = 12;
    data[8]![excelColumnToNumber("AS")] = 13;
    const summary: ExcelData[number] = { sheet: "Summary", data };
    const extractedValues = new Map<string, string | number>([
      ["netVariance", 0],
      ["reportingStartDy", 1.5],
      ["reportingEndDy", 2],
    ]);

    const result = extractBNReporting([summary], extractedValues);

    expect(result.extract.testValues).toEqual([
      { testId: "Main", measureId: "Without-Waiver Total", megName: null, dyNumber: null, value: 11 },
      { testId: "Main", measureId: "With-Waiver Total", megName: null, dyNumber: null, value: 12 },
      { testId: "Main", measureId: "Expenditure Authority", megName: null, dyNumber: null, value: 13 },
      { testId: "Main", measureId: "Net Variance", megName: null, dyNumber: null, value: 0 },
    ]);
    expect(result.extract.testValues.every(({ dyNumber }) => dyNumber === null)).toBe(true);
  });
});
