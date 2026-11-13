import { describe, expect, it, vi } from "vitest";
import type { ExcelData } from "./index.js";
import { extractorFunctions } from "./extractors/index.js";
import { validateNetVarianceLocation, NET_VARIANCE_LOCATION } from "./netVarianceLocation.js";
import { validateBNWorkbook } from "./validation.js";
import { validations } from "./rulesets/v1/index.js";
import { setCell } from "../../test/bnFixtures.js";

function workbook(): ExcelData {
  return [
    { sheet: "Summary", data: [] },
    { sheet: "C Report", data: [] },
    { sheet: "MemMon Actual", data: [] },
    { sheet: "MemMon Projected", data: [] },
    { sheet: "Total Adjustments", data: [] },
    { sheet: "WW Spending Projected", data: [] },
  ];
}

function validWorkbook(): ExcelData {
  const data = workbook();
  setCell(data, "Summary", "B8", "Actuals");
  setCell(data, "Summary", NET_VARIANCE_LOCATION.labelAddress, NET_VARIANCE_LOCATION.label);
  setCell(data, "Summary", NET_VARIANCE_LOCATION.valueAddress, 0);
  for (const address of ["A100", "A300", "A500", "A700"]) setCell(data, "C Report", address, "Waiver Name");
  for (const address of ["F2", "F3"]) setCell(data, "C Report", address, 1);
  for (const address of ["D2", "D3"]) setCell(data, "C Report", address, "2026-07-14");
  return data;
}

describe("net variance fixed location", () => {
  it("keeps the fixed label and value template coordinates", () => {
    expect(NET_VARIANCE_LOCATION).toEqual({
      sheet: "Summary",
      label: "NET VARIANCE",
      labelAddress: "B436",
      valueAddress: "AS436",
    });
  });
  it("accepts the exact label and AS436 value, including zero", () => {
    const data = validWorkbook();
    expect(validateNetVarianceLocation(data)).toBeNull();
    expect(extractorFunctions[1]?.(data)).toEqual(new Map([["netVariance", 0]]));
  });

  it("rejects an MA-style row 449 label despite unrelated numeric content at AS436", async () => {
    const data = validWorkbook();
    setCell(data, "Summary", NET_VARIANCE_LOCATION.labelAddress, "Other label");
    setCell(data, "Summary", "AS436", 999);
    setCell(data, "Summary", "B449", NET_VARIANCE_LOCATION.label);
    setCell(data, "Summary", "AS449", 123456);

    const error = validateNetVarianceLocation(data);
    expect(error?.code).toBe("BN_NET_VARIANCE_LOCATION");
    expect(error?.message).toBe("Net variance location is invalid. Expected the literal label at Summary!B436 and its numeric value at Summary!AS436; detected Summary!AS449.");

    const extract = vi.fn(() => new Map([["shouldNotExtract", 1]]));
    const result = await validateBNWorkbook(data, validations, [extract]);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(error);
    expect(result.extractedValues).toEqual(new Map());
    expect(extract).not.toHaveBeenCalled();
    expect(() => extractorFunctions[1]?.(data)).toThrow("Summary!AS449");
  });

  it.each([
    [
      "label missing",
      (data: ExcelData) => setCell(data, "Summary", "B436", "Other"),
      'Net variance location is invalid. Expected the literal label at Summary!B436 and its numeric value at Summary!AS436; detected Summary!B436 contains "Other".',
    ],
    [
      "wrong label at row 436",
      (data: ExcelData) => setCell(data, "Summary", "B436", "NET VARIANCE "),
      'Net variance location is invalid. Expected the literal label at Summary!B436 and its numeric value at Summary!AS436; detected Summary!B436 contains "NET VARIANCE ".',
    ],
    ["label moved", (data: ExcelData) => {
      setCell(data, "Summary", "B436", "Other");
      setCell(data, "Summary", "B449", NET_VARIANCE_LOCATION.label);
    }, "Net variance location is invalid. Expected the literal label at Summary!B436 and its numeric value at Summary!AS436; detected Summary!AS449."],
    ["duplicate labels", (data: ExcelData) => setCell(data, "Summary", "B449", NET_VARIANCE_LOCATION.label), "Net variance location is invalid. Expected the literal label at Summary!B436 and its numeric value at Summary!AS436; detected Summary!AS436, Summary!AS449."],
  ])("rejects %s", (_description, change, message) => {
    const data = validWorkbook();
    change(data);
    expect(validateNetVarianceLocation(data)).toEqual({ code: "BN_NET_VARIANCE_LOCATION", message });
  });

  it("rejects a missing Summary sheet", () => {
    expect(validateNetVarianceLocation([])).toMatchObject({
      code: "BN_NET_VARIANCE_LOCATION",
      message: expect.stringContaining("Summary sheet is missing"),
    });
  });

  it("does not treat a formula-derived label as a literal label", () => {
    const data = validWorkbook();
    data[0]!.formulaCells = new Set(["B436"]);
    expect(validateNetVarianceLocation(data)?.message).toBe("Net variance location is invalid. Expected the literal label at Summary!B436 and its numeric value at Summary!AS436; detected Summary!B436 contains \"NET VARIANCE\" (formula-derived; a literal label is required).");
  });

  it.each([null, "", "Blank cell. No entry", "not numeric", Number.POSITIVE_INFINITY])(
    "retains required numeric validation for AS436 value %j",
    (value) => {
      const data = validWorkbook();
      setCell(data, "Summary", "AS436", value);
      expect(() => extractorFunctions[1]?.(data)).toThrow('Unable to extract "netVariance"');
    },
  );

  it("registers the location check in the normal ruleset", () => {
    expect(validations).toContain(validateNetVarianceLocation);
  });
});