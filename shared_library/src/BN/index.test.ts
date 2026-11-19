import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as excelReader from "read-excel-file/universal";

import { BNWorkbookInputError, parseBNFile, parseBNFileFromPath, parseBNWorkbook, isFormulaCell, excelColumnRow, numberToExcelColumn, excelColumnToNumber } from "./index.js";
import * as formulas from "./formulas.js";
import { workbookParts, zipWorkbook } from "../../test/bnFixtures.js";
import { validateBNWorkbook } from "./validation.js";
import { validateNetVarianceLocation } from "./netVarianceLocation.js";
import { extractorFunctions } from "./extractors/index.js";

vi.mock("read-excel-file/universal", { spy: true });

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(currentDir, ".." , "..", "test", "fixtures", "sample.xlsx");

async function withWorkbook(parts: Record<string, string>, action: (file: string) => Promise<void>, extension = "xlsx"): Promise<void> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "bn-parser-test-"));
  try {
    const file = path.join(directory, `fixture.${extension}`);
    await fs.writeFile(file, zipWorkbook(parts));
    await action(file);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

function omitSheet(parts: Record<string, string>, name: string): Record<string, string> {
  const workbookXml = parts["xl/workbook.xml"]!;
  const sheet = workbookXml.match(new RegExp(`<sheet name="${name}" sheetId="\\d+" r:id="([^"]+)"/>`));
  if (!sheet) throw new Error(`Sheet "${name}" not found in workbook fixture.`);
  parts["xl/workbook.xml"] = workbookXml.replace(sheet[0], "");

  const relationshipsXml = parts["xl/_rels/workbook.xml.rels"]!;
  const relationship = relationshipsXml.match(new RegExp(`<Relationship Id="${sheet[1]}"[^>]+Target="([^"]+)"/>`));
  if (!relationship) throw new Error(`Relationship for sheet "${name}" not found in workbook fixture.`);
  parts["xl/_rels/workbook.xml.rels"] = relationshipsXml.replace(relationship[0], "");
  const worksheetPath = relationship[1]!.startsWith("/")
    ? relationship[1]!.slice(1)
    : `xl/${relationship[1]}`;
  delete parts[worksheetPath];
  return parts;
}

describe("parseBNWorkbook", () => {
  afterEach(() => {
    vi.mocked(excelReader.default).mockReset();
    vi.restoreAllMocks();
  });

  it.each(["xlsx", "xlsm"])("keeps cached values and attaches formula markers for %s files", async (extension) => {
    await withWorkbook(workbookParts(), async (file) => {
      const result = await parseBNWorkbook(file);
      expect(excelColumnRow("B1", "Summary", result.data)).toBe("TOTAL");
      expect(excelColumnRow("E2", "Summary", result.data)).toBe(4);
      expect(isFormulaCell(result.data, "Summary", "B1")).toBe(true);
      expect(isFormulaCell(result.data, "Summary", "E2")).toBe(true);
      expect(isFormulaCell(result.data, "Summary", "AS2")).toBe(false);
      expect(isFormulaCell(result.data, "Ignored", "A1")).toBe(false);
      expect(result.cachedValuesMayBeStale).toBe(false);
      expect(result.warnings).toEqual([]);
    }, extension);
  });

  it.each([
    { name: "a literal label and zero", label: '<c r="B436" t="inlineStr"><is><t>NET VARIANCE</t></is></c>', value: '<c r="AS436"><v>0</v></c>', code: null },
    { name: "a cached numeric formula", label: '<c r="B436" t="inlineStr"><is><t>NET VARIANCE</t></is></c>', value: '<c r="AS436"><f>1-1</f><v>0</v></c>', code: null },
    { name: "a cached numeric array-formula result", label: '<c r="B436" t="inlineStr"><is><t>NET VARIANCE</t></is></c>', value: '<c r="AR436"><f t="array" ref="AR436:AS436">1-1</f><v>0</v></c><c r="AS436"><v>0</v></c>', code: null },
    { name: "a formula-derived label", label: '<c r="B436" t="str"><f>"NET VARIANCE"</f><v>NET VARIANCE</v></c>', value: '<c r="AS436"><v>0</v></c>', code: "BN_NET_VARIANCE_LOCATION" },
    { name: "a missing label with a misleading fixed value", label: "", value: '<c r="AS436"><v>99</v></c>', code: "BN_NET_VARIANCE_LOCATION" },
    { name: "a moved label with a misleading fixed value", label: "", value: '<c r="AS436"><v>99</v></c>', extra: '<row r="437"><c r="B437" t="inlineStr"><is><t>NET VARIANCE</t></is></c><c r="AS437"><v>1</v></c></row>', code: "BN_NET_VARIANCE_LOCATION" },
    { name: "duplicate labels", label: '<c r="B436" t="inlineStr"><is><t>NET VARIANCE</t></is></c>', value: '<c r="AS436"><v>0</v></c>', extra: '<row r="437"><c r="B437" t="inlineStr"><is><t>NET VARIANCE</t></is></c></row>', code: "BN_NET_VARIANCE_LOCATION" },
    { name: "non-numeric financial input", label: '<c r="B436" t="inlineStr"><is><t>NET VARIANCE</t></is></c>', value: '<c r="AS436" t="inlineStr"><is><t>not numeric</t></is></c>', code: "BN_NET_VARIANCE_VALUE" },
    { name: "a blank financial value", label: '<c r="B436" t="inlineStr"><is><t>NET VARIANCE</t></is></c>', value: "", code: "BN_NET_VARIANCE_VALUE" },
  ])("makes identical File/path acceptance decisions for $name", async ({ label, value, extra = "", code }) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const summary = '<row r="8"><c r="B8" t="inlineStr"><is><t>Actuals + Projected</t></is></c></row>'
      + `<row r="436">${label}${value}</row>${extra}`;
    await withWorkbook(workbookParts("", summary), async (file) => {
      const browserFile = new File([await fs.readFile(file)], "workbook.xlsx");
      const fromPath = await parseBNWorkbook(file);
      const fromFile = await parseBNWorkbook(browserFile);
      const results = await Promise.all([fromPath, fromFile].map(({ data }) =>
        validateBNWorkbook(data, [validateNetVarianceLocation], extractorFunctions)));

      expect(results[0]).toEqual(results[1]);
      expect(results[0]!.isValid).toBe(code === null);
      expect(results[0]!.errors.map((error) => error.code)).toEqual(code === null ? [] : [code]);
      if (code === null) expect(results[0]!.extractedValues.get("netVariance")).toBe(0);
      else expect(results[0]!.extractedValues.size).toBe(0);
    });
  });

  it("rejects a label in a non-anchor array-formula cell for File and path inputs", async () => {
    const summary = '<row r="8"><c r="B8" t="inlineStr"><is><t>Actuals + Projected</t></is></c></row>'
      + '<row r="435"><c r="B435" t="str"><f t="array" ref="B435:B436">"NET VARIANCE"</f><v>NET VARIANCE</v></c></row>'
      + '<row r="436"><c r="B436" t="str"><v>NET VARIANCE</v></c><c r="AS436"><v>0</v></c></row>';
    await withWorkbook(workbookParts("", summary), async (file) => {
      const browserFile = new File([await fs.readFile(file)], "workbook.xlsx");
      const parsed = await Promise.all([file, browserFile].map((source) => parseBNWorkbook(source)));

      expect(isFormulaCell(parsed[0]!.data, "Summary", "B436")).toBe(true);
      expect(isFormulaCell(parsed[1]!.data, "Summary", "B436")).toBe(true);
      for (const { data } of parsed) {
        const result = await validateBNWorkbook(data, [validateNetVarianceLocation], extractorFunctions);
        expect(result.isValid).toBe(false);
        expect(result.errors.map((error) => error.code)).toEqual(["BN_NET_VARIANCE_LOCATION"]);
      }
    });
  });

  it.each(["C Report", "Summary"] as const)("rejects a workbook without required sheet %s", async (missingSheet) => {
    await withWorkbook(omitSheet(workbookParts(), missingSheet), async (file) => {
      const browserFile = new File([await fs.readFile(file)], "workbook.xlsx");
      for (const source of [file, browserFile]) {
        const result = parseBNWorkbook(source);
        await expect(result).rejects.toBeInstanceOf(BNWorkbookInputError);
        await expect(result).rejects.toMatchObject({
          validationError: {
            code: "BN_REQUIRED_WORKBOOK_SHEET",
            message: expect.stringContaining(missingSheet),
          },
        });
      }
    });
  });

  it("accepts a workbook without the optional Program Spending Limits sheet", async () => {
    await withWorkbook(omitSheet(workbookParts(), "Program Spending Limits"), async (file) => {
      const browserFile = new File([await fs.readFile(file)], "workbook.xlsx");
      for (const source of [file, browserFile]) {
        const result = await parseBNWorkbook(source);
        expect(result.data.some((entry) => entry.sheet === "Program Spending Limits")).toBe(false);
        expect(result.data.some((entry) => entry.sheet === "C Report")).toBe(true);
      }
    });
  });

  it("maps malformed array ranges to typed validation failures for File and path inputs", async () => {
    const summary = '<row r="1"><c r="B1"><f t="array" ref="B1:INVALID">1</f><v>1</v></c></row>';
    await withWorkbook(workbookParts("", summary), async (file) => {
      const browserFile = new File([await fs.readFile(file)], "workbook.xlsx");
      for (const source of [file, browserFile]) {
        const result = parseBNWorkbook(source);
        await expect(result).rejects.toBeInstanceOf(BNWorkbookInputError);
        await expect(result).rejects.toMatchObject({
          validationError: { code: "BN_FORMULA_METADATA" },
        });
      }
    });
  });

  it("rejects when formula information cannot be read", async () => {
    vi.spyOn(formulas, "readFormulaInfo").mockImplementation(() => {
      throw new formulas.FormulaReadError("synthetic formula read failure");
    });
    await withWorkbook(workbookParts('<calcPr fullCalcOnLoad="1"/>'), async (file) => {
      const browserFile = new File([await fs.readFile(file)], "workbook.xlsx");
      for (const source of [file, browserFile]) {
        await expect(parseBNWorkbook(source)).rejects.toMatchObject({
          validationError: {
            code: "BN_FORMULA_METADATA",
            message: "Workbook formula metadata could not be inspected. Save the workbook in Excel and upload it again.",
          },
        });
      }
    });
  });

  it("maps unreadable workbook bytes to a typed validation failure", async () => {
    await expect(parseBNWorkbook(new Blob([new Uint8Array([0, 1, 2])]))).rejects.toMatchObject({
      validationError: {
        code: "BN_WORKBOOK_PARSE",
        message: expect.any(String),
      },
    });
  });

  it("does not convert unexpected value-reader failures into workbook errors", async () => {
    const failure = new Error("unexpected value-reader failure");
    vi.spyOn(excelReader, "default").mockRejectedValue(failure);
    await expect(parseBNWorkbook(new Blob([new Uint8Array(zipWorkbook())]))).rejects.toBe(failure);
  });

  it("does not convert unexpected formula-reader failures into workbook errors", async () => {
    const failure = new TypeError("unexpected formula-reader failure");
    vi.spyOn(formulas, "readFormulaInfo").mockImplementation(() => { throw failure; });
    await expect(parseBNWorkbook(new Blob([new Uint8Array(zipWorkbook())]))).rejects.toBe(failure);
  });

  it("does not convert filesystem failures into workbook errors", async () => {
    const failure = Object.assign(new Error("temporary filesystem failure"), { code: "EIO" });
    vi.spyOn(fs, "readFile").mockRejectedValue(failure);
    await expect(parseBNWorkbook("workbook.xlsx")).rejects.toBe(failure);
  });
});

describe("parseBNFile", () => {
  it("parses workbook contents from a Blob", async () => {
    const buffer = await fs.readFile(fixturePath);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await parseBNFile(blob);

    expect(excelColumnRow("A1", "Sheet1", result)).toBe("Budget");
    expect(excelColumnRow("A2", "Sheet1", result)).toBe("Amount");
    expect(excelColumnRow("B1", "Sheet1", result)).toBe(2026);
    expect(excelColumnRow("B2", "Sheet1", result)).toBe(123.45);

    expect(excelColumnRow("B2", "Sheet2", result)).toBe(7);

    expect(excelColumnRow("AS436", "Summary", result)).toBe(12345678);

    expect(result).toHaveLength(3);
  });
});

describe("parseBNFileFromPath", () => {
  it("parses workbook contents from a file path", async () => {
    const result = await parseBNFileFromPath(fixturePath);

    expect(result).toHaveLength(3);
    expect(excelColumnRow("A1", "Sheet1", result)).toBe("Budget");
    expect(excelColumnRow("A2", "Sheet1", result)).toBe("Amount");
    expect(excelColumnRow("B1", "Sheet1", result)).toBe(2026);
    expect(excelColumnRow("B2", "Sheet1", result)).toBe(123.45);
    
    expect(excelColumnRow("B2", "Sheet2", result)).toBe(7);

    expect(excelColumnRow("AS436", "Summary", result)).toBe(12345678);
      
  });

  it("throws when file path does not exist", async () => {
    const missingPath = path.join(currentDir, "..", "test", "fixtures", "missing.xlsx");
    await expect(parseBNFileFromPath(missingPath)).rejects.toThrow();
  });
});

describe("excelColumnRow", () => {
  let workbookData: Awaited<ReturnType<typeof parseBNFileFromPath>>;

  beforeAll(async () => {
    workbookData = await parseBNFileFromPath(fixturePath);
  });

  it("returns string value for A1", () => {
    expect(excelColumnRow("A1", "Sheet1", workbookData)).toBe("Budget");
  });

  it("returns numeric value for B2", () => {
    expect(excelColumnRow("B2", "Sheet1", workbookData)).toBe(123.45);
  });

  it("returns string value from the second sheet", () => {
    expect(excelColumnRow("B1", "Sheet2", workbookData)).toBe("Active");
  });

  it("returns numeric value from the second sheet", () => {
    expect(excelColumnRow("B2", "Sheet2", workbookData)).toBe(7);
  });

  it("throws for missing sheet", () => {
    expect(() => excelColumnRow("A1", "Missing", workbookData)).toThrow(
      'Sheet "Missing" not found',
    );
  });

  it("throws for invalid cell reference format", () => {
    expect(() => excelColumnRow("1A", "Sheet1", workbookData)).toThrow(
      "Invalid Excel column-row format",
    );
  });

  it("returns null when row is out of range", () => {
    expect(excelColumnRow("A99", "Sheet1", workbookData)).toBeNull();
  });

  it("numberToExcelColumn converts numbers to Excel column letters correctly", () => {
    expect(numberToExcelColumn(0)).toBe("A");
    expect(numberToExcelColumn(25)).toBe("Z");
    expect(numberToExcelColumn(26)).toBe("AA");
    expect(numberToExcelColumn(51)).toBe("AZ");
    expect(numberToExcelColumn(52)).toBe("BA");
    expect(numberToExcelColumn(701)).toBe("ZZ");
    expect(numberToExcelColumn(702)).toBe("AAA");
  });

  describe("excelColumnToNumber", () => {
  it("converts A, Z, AA, and AH correctly", () => {
    expect(excelColumnToNumber("A")).toBe(0);
    expect(excelColumnToNumber("Z")).toBe(25);
    expect(excelColumnToNumber("AA")).toBe(26);
    expect(excelColumnToNumber("AH")).toBe(33);
    expect(excelColumnToNumber("AS")).toBe(44);

  });
});

});
