import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseBNFile, parseBNFileFromPath, parseBNWorkbook, isFormulaCell, excelColumnRow, numberToExcelColumn, excelColumnToNumber } from "./index.js";
import * as formulas from "./formulas.js";
import { workbookParts, zipWorkbook } from "../../test/bnFixtures.js";

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

describe("parseBNWorkbook", () => {
  afterEach(() => vi.restoreAllMocks());

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

  it.each(["1", "true"])("returns one warning for fullCalcOnLoad=%s", async (flag) => {
    await withWorkbook(workbookParts(`<calcPr fullCalcOnLoad="${flag}"/>`), async (file) => {
      const result = await parseBNWorkbook(file);
      expect(result.cachedValuesMayBeStale).toBe(true);
      expect(result.warnings).toEqual([
        "Workbook is flagged for full recalculation on open (fullCalcOnLoad); stored values may be stale. Open and save it in Excel, then re-upload.",
      ]);
    });
  });

  it.each(["false", "0"])("does not warn for fullCalcOnLoad=%s", async (flag) => {
    await withWorkbook(workbookParts(`<calcPr fullCalcOnLoad="${flag}"/>`), async (file) => {
      const result = await parseBNWorkbook(file);
      expect(result.cachedValuesMayBeStale).toBe(false);
      expect(result.warnings).toEqual([]);
    });
  });

  it("falls back to values only and one warning when formula information cannot be read", async () => {
    vi.spyOn(formulas, "readFormulaInfo").mockImplementation(() => {
      throw new formulas.FormulaReadError("synthetic formula read failure");
    });
    await withWorkbook(workbookParts('<calcPr fullCalcOnLoad="1"/>'), async (file) => {
      const result = await parseBNWorkbook(file);
      expect(excelColumnRow("E2", "Summary", result.data)).toBe(4);
      expect(result.data.every(({ formulaCells }) => formulaCells === undefined)).toBe(true);
      expect(result.cachedValuesMayBeStale).toBe(false);
      expect(result.warnings).toEqual([expect.stringContaining("synthetic formula read failure")]);
    });
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
