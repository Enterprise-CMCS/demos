import { excelColumnRow, type ExcelData } from "../index.js";
import { isBlankCell, readNumericValue } from "./cells.js";
import { locateLabelRow, locateLabelRows } from "./labels.js";

export type BNSpendingLimit = {
  programIndex: number;
  programName: string;
  capTotal?: number;
  varianceTotal?: number;
  overCap?: boolean;
  megs: { lineNumber: number; megName: string; subjectToCapTotal?: number }[];
};

const SHEET = "Program Spending Limits";

export function extractSpendingLimits(data: ExcelData): { spendingLimits: BNSpendingLimit[]; warnings: string[] } {
  const spendingLimits: BNSpendingLimit[] = [];
  const warnings: string[] = [];
  const sheet = data.find((entry) => entry.sheet === SHEET);
  if (!sheet) return { spendingLimits, warnings: [`Spending limits omitted: Sheet "${SHEET}" not found.`] };
  const blocks = locateLabelRows(data, SHEET, "Program Name and Associated MEGs");
  if (!blocks.length) return { spendingLimits, warnings: ["Spending limits omitted: no program block headings found."] };
  for (const [index, start] of blocks.entries()) {
    const last = (blocks[index + 1] ?? (sheet.data.length + 1)) - 1;
    const programIndex = index + 1;
    try {
      let first = start + 1;
      const anchor = (label: string) => {
        const result = locateLabelRow(data, SHEET, label, { first, last });
        if (!result.ok) throw new Error(result.reason);
        first = result.row + 1;
        return result.row;
      };
      const programRow = anchor("Program Name") + 1;
      const programName = excelColumnRow(`B${programRow}`, SHEET, data);
      if (isBlankCell(programName)) continue;
      if (typeof programName !== "string") throw new Error("Program name is not text.");
      const subjectRow = anchor("Expenditures Subject to Cap");
      const varianceRow = anchor("Variance");
      const overRow = anchor("Over or Under");
      const program: BNSpendingLimit = {
        programIndex,
        programName,
        capTotal: readNumericValue(data, SHEET, `AQ${programRow}`, warnings),
        varianceTotal: readNumericValue(data, SHEET, `AQ${varianceRow}`, warnings),
        megs: [],
      };
      const over = excelColumnRow(`AQ${overRow}`, SHEET, data);
      if (over === "Over") program.overCap = true;
      else if (over === ".") program.overCap = false;
      else warnings.push(`Cell ${SHEET}!AQ${overRow} has an unrecognized Over or Under flag; stored value will be NULL.`);
      for (let row = subjectRow + 1; row < varianceRow; row++) {
        const megName = excelColumnRow(`B${row}`, SHEET, data);
        if (isBlankCell(megName)) continue;
        if (typeof megName !== "string") {
          warnings.push(`Spending limit ${programIndex} row ${row} omitted: MEG name is not text.`);
          continue;
        }
        const address = `AQ${row}`;
        const raw = excelColumnRow(address, SHEET, data);
        program.megs.push({
          lineNumber: row - subjectRow,
          megName,
          subjectToCapTotal: isBlankCell(raw) ? undefined : readNumericValue(data, SHEET, address, warnings),
        });
      }
      spendingLimits.push(program);
    } catch (error) {
      warnings.push(`Spending limit ${programIndex} omitted: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { spendingLimits, warnings };
}