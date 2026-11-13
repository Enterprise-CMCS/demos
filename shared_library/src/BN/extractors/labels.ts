import type { ExcelData } from "../index.js";

export type LabelRange = { first?: number; last?: number };

export function locateLabelRows(
  data: ExcelData,
  sheet: string,
  label: string,
  range: LabelRange = {},
): number[] {
  const sheetData = data.find((entry) => entry.sheet === sheet);
  if (!sheetData) return [];

  const first = range.first ?? 1;
  const last = range.last ?? sheetData.data.length;
  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first) {
    return [];
  }

  const rows: number[] = [];
  for (let row = first; row <= Math.min(last, sheetData.data.length); row++) {
    if (sheetData.data[row - 1]?.[1] === label) rows.push(row);
  }
  return rows;
}

export function locateLabelRow(
  data: ExcelData,
  sheet: string,
  label: string,
  range: LabelRange = {},
): { ok: true; row: number } | { ok: false; reason: string } {
  if (!data.some((entry) => entry.sheet === sheet)) {
    return { ok: false, reason: `Sheet "${sheet}" not found` };
  }

  const rows = locateLabelRows(data, sheet, label, range);
  if (rows.length === 1) return { ok: true, row: rows[0]! };

  return {
    ok: false,
    reason: rows.length === 0
      ? `Label "${label}" not found in column B of sheet "${sheet}" in the search range.`
      : `Label "${label}" has ${rows.length} matches in column B of sheet "${sheet}" in the search range; expected exactly one.`,
  };
}