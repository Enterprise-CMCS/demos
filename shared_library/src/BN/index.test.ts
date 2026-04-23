import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseBNFile, parseBNFileFromPath, excelColumnRow, numberToExcelColumn, excelColumnToNumber } from "./index.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(currentDir, ".." , "..", "test", "fixtures", "sample.xlsx");

describe("parseBNFile", () => {
  it("parses workbook contents from a Blob", async () => {
    const buffer = await fs.readFile(fixturePath);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await parseBNFile(blob);

    expect(result).toHaveLength(2);
    expect(result[0]?.sheet).toBe("Sheet1");
    expect(result[0]?.data).toEqual([
      ["Budget", 2026],
      ["Amount", 123.45],
    ]);
    expect(result[1]?.sheet).toBe("Sheet2");
    expect(result[1]?.data).toEqual([
      ["Status", "Active"],
      ["Count", 7],
    ]);
  });
});

describe("parseBNFileFromPath", () => {
  it("parses workbook contents from a file path", async () => {
    const result = await parseBNFileFromPath(fixturePath);

    expect(result).toHaveLength(2);
    expect(result[0]?.sheet).toBe("Sheet1");
    expect(result[0]?.data).toEqual([
      ["Budget", 2026],
      ["Amount", 123.45],
    ]);
    expect(result[1]?.sheet).toBe("Sheet2");
    expect(result[1]?.data).toEqual([
      ["Status", "Active"],
      ["Count", 7],
    ]);
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

  it("throws when row is out of range", () => {
    expect(() => excelColumnRow("A99", "Sheet1", workbookData)).toThrow(
      "Row 99 not found",
    );
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
  });
});

});
