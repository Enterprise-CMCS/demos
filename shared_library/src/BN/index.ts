import readExcelFile from "read-excel-file/universal";
import fs from "node:fs/promises";

export type CellValue<ParsedNumber = number> =
  | string
  | ParsedNumber
  | boolean
  | typeof Date;

export type Row<ParsedNumber = number> = (CellValue<ParsedNumber> | null)[];

export type SheetData<ParsedNumber = number> = Row<ParsedNumber>[];

export type ExcelData<ParsedNumber = number> = {
  sheet: string;
  data: SheetData<ParsedNumber>;
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

  let columnNumber = 0;
  for (let i = 0; i < columnLetters.length; i++) {
    columnNumber *= 26;
    columnNumber += columnLetters.charCodeAt(i) - "A".charCodeAt(0);
  }

  const row = sheetData.data[rowNumber];
  if (!row) {
    throw new Error(`Row ${rowNumber + 1} not found`);
  }

  return row[columnNumber];
}
