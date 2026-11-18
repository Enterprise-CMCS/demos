import readExcelFile, { InvalidInputError, InvalidSpreadsheetError } from "read-excel-file/universal";
import fs from "node:fs/promises";
import { FormulaReadError, readFormulaInfo, type FormulaInfo } from "./formulas.js";
import { BNWorkbookInputError } from "./errors.js";

export { BNWorkbookInputError } from "./errors.js";

export type CellValue<ParsedNumber = number> =
  | string
  | ParsedNumber
  | boolean
  | Date;

export type Row<ParsedNumber = number> = (CellValue<ParsedNumber> | null)[];

export type SheetData<ParsedNumber = number> = Row<ParsedNumber>[];

export type ExcelData<ParsedNumber = number> = {
  sheet: string;
  data: SheetData<ParsedNumber>;
  formulaCells?: Set<string>;
}[];

export async function parseBNFile(blob: Blob): Promise<ExcelData> {
  return await readExcelFile(blob);
}

export async function parseBNFileFromPath(path: string): Promise<ExcelData> {
  const data = await fs.readFile(path);
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  return await parseBNFile(blob);
}

export async function parseBNWorkbook(source: string | Blob): Promise<{
  data: ExcelData;
  cachedValuesMayBeStale: boolean;
  warnings: string[];
}> {
  const bytes = typeof source === "string"
    ? await fs.readFile(source)
    : new Uint8Array(await source.arrayBuffer());
  let data: ExcelData;
  try {
    data = await parseBNFile(new Blob([bytes]));
  } catch (error) {
    if (!(error instanceof InvalidInputError) && !(error instanceof InvalidSpreadsheetError)) throw error;
    throw new BNWorkbookInputError({
      code: "BN_WORKBOOK_PARSE",
      message: "Unable to read the workbook. Please upload a valid .xlsx file.",
    });
  }

  const warnings: string[] = [];
  let info: FormulaInfo;
  try {
    info = readFormulaInfo(bytes);
  } catch (error) {
    if (!(error instanceof FormulaReadError)) throw error;
    throw new BNWorkbookInputError({
      code: "BN_FORMULA_METADATA",
      message: "Workbook formula metadata could not be inspected. Save the workbook in Excel and upload it again.",
    });
  }

  for (const entry of data) {
    const cells = info.formulaCells.get(entry.sheet);
    if (cells) entry.formulaCells = cells;
  }
  const cachedValuesMayBeStale = info.fullCalcOnLoad;
  if (cachedValuesMayBeStale) {
    warnings.push("Workbook is flagged for full recalculation on open (fullCalcOnLoad); stored values may be stale. Open and save it in Excel, then re-upload.");
  }
  return { data, cachedValuesMayBeStale, warnings };
}

export function isFormulaCell(data: ExcelData, sheet: string, a1: string): boolean {
  return data.find((entry) => entry.sheet === sheet)?.formulaCells?.has(a1) ?? false;
}

export function numberToExcelColumn(num: number): string {
  let n = num + 1;
  let column = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    n = Math.floor((n - 1) / 26);
  }
  return column;
}

export function excelColumnToNumber(column: string): number {
  let result = 0;
  for (const char of column) {
    result = result * 26 + (char.charCodeAt(0) - 64);
  }
  return result - 1;
}

export function excelColumnRow(
  excelColumnRow: String,
  sheet: String,
  excelData: ExcelData,
) {
  const sheetData = excelData.find((sheetData) => sheetData.sheet === sheet);
  if (!sheetData) {
    throw new Error(`Sheet "${sheet}" not found`);
  }

  const match = excelColumnRow.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error("Invalid Excel column-row format");
  }

  const columnLetters = match[1]!;
  const rowNumber = parseInt(match[2]!, 10) - 1;

  const row = sheetData.data[rowNumber];
  if (!row) {
    return null;
  }

  return row[excelColumnToNumber(columnLetters)] as CellValue;
}
