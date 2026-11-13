import { afterEach, describe, expect, it, vi } from "vitest";
import { excelColumnToNumber, type ExcelData } from "../index.js";
import { validateBNWorkbook } from "../validation.js";
import { BN_WORKBOOK_FIELDS, extractorFunctions, missingFieldWarnings } from "./index.js";

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
        [null, null, null, "06/30/2026", null, 4],
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
  it.each([436, 449])("reads NET VARIANCE by label at row %i", (netVarianceRow) => {
    const values = extract(workbook(netVarianceRow));

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
    expect(() => extract(data)).toThrow("2 matches");
  });

  it.each([null, "", "Blank cell. No entry", "not numeric"])("still throws for an unreadable required net variance %j", async (value) => {
    const data = workbook(449);
    data[0]!.data[448]![excelColumnToNumber("AS")] = value;
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
