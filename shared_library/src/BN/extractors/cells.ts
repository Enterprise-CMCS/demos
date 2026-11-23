import { excelColumnRow, type CellValue, type ExcelData } from "../index.js";

const BLANK_PLACEHOLDER = "Blank cell. No entry";

export function isBlankCell(value: CellValue | null | undefined): boolean {
  return value === null || value === undefined || value === "" || value === BLANK_PLACEHOLDER;
}

export function readNumericValue(data: ExcelData, sheet: string, address: string, warnings: string[]): number | undefined {
  const raw = excelColumnRow(address, sheet, data);
  const cell = `${sheet}!${address}`;
  if (isBlankCell(raw) || (typeof raw === "string" && raw.trim() === "")) {
    warnings.push(`Cell ${cell} is blank.`);
    return undefined;
  }
  if (typeof raw !== "number" && typeof raw !== "string") {
    warnings.push(`Cell ${cell} could not be parsed.`);
    return undefined;
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    warnings.push(`Cell ${cell} could not be parsed.`);
    return undefined;
  }
  return value;
}
