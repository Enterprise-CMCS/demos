import { excelColumnRow, type CellValue, type ExcelData } from "../index.js";
import type { ExtractionFunction } from "../validation.js";
import { locateLabelRow, type LabelRange } from "./labels.js";

export type CellLocator =
  | { kind: "address"; sheet: string; address: string }
  | {
      kind: "label";
      sheet: string;
      label: string;
      column: string;
      within?: { afterLabel?: string; beforeLabel?: string };
    };

export type CellRead<T> = { ok: true; value: T } | { ok: false; reason: string };

function locateCellAddress(data: ExcelData, locator: CellLocator): string {
  if (locator.kind === "address") return locator.address;
  if (!/^[A-Z]+$/.test(locator.column)) throw new Error("Invalid Excel column");

  const range: LabelRange = {};
  if (locator.within?.afterLabel !== undefined) {
    const after = locateLabelRow(data, locator.sheet, locator.within.afterLabel);
    if (!after.ok) throw new Error(after.reason);
    range.first = after.row + 1;
  }
  if (locator.within?.beforeLabel !== undefined) {
    const before = locateLabelRow(data, locator.sheet, locator.within.beforeLabel, range);
    if (!before.ok) throw new Error(before.reason);
    range.last = before.row - 1;
  }

  const result = locateLabelRow(data, locator.sheet, locator.label, range);
  if (!result.ok) throw new Error(result.reason);
  return `${locator.column}${result.row}`;
}

export function readCell<T>(
  data: ExcelData,
  locator: CellLocator,
  parse: (raw: CellValue) => T | null,
): CellRead<T> {
  try {
    const address = locateCellAddress(data, locator);
    if (!/^[A-Z]+[1-9]\d*$/.test(address)) {
      throw new Error("Invalid Excel column-row format");
    }
    const raw = excelColumnRow(address, locator.sheet, data);
    const cell = `${locator.sheet}!${address}`;
    if (raw === null || raw === undefined || (typeof raw === "string" && raw.trim() === "")) {
      return { ok: false, reason: `Cell ${cell} is blank.` };
    }
    if (raw === "Blank cell. No entry") {
      return { ok: false, reason: `Cell ${cell} contains the "Blank cell. No entry" placeholder.` };
    }

    const value = parse(raw);
    return value === null
      ? { ok: false, reason: `Cell ${cell} could not be parsed.` }
      : { ok: true, value };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

function parseNumeric(raw: CellValue): number | null {
  if (typeof raw !== "number" && typeof raw !== "string") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseText(raw: CellValue): string | null {
  return typeof raw === "string" ? raw : null;
}

function parseDate(raw: CellValue): string | null {
  if (raw instanceof Date) {
    return Number.isFinite(raw.getTime()) ? raw.toISOString().slice(0, 10) : null;
  }
  if (typeof raw !== "string") return null;

  const text = raw.trim();
  const usDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  const value = usDate
    ? `${usDate[3]}-${usDate[1]!.padStart(2, "0")}-${usDate[2]!.padStart(2, "0")}`
    : text;
  if (!/^\d{4}-\d{2}-\d{2}(?:$|T.+(?:Z|[+-]\d{2}:\d{2})$)/.test(value)) return null;

  const calendarDate = value.slice(0, 10);
  const date = new Date(calendarDate);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== calendarDate) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null;
}

function cellExtractor(
  key: string,
  locator: CellLocator,
  parse: (raw: CellValue) => string | number | null,
  required: boolean,
): ExtractionFunction {
  return (data) => {
    const result = readCell(data, locator, parse);
    if (result.ok) return new Map([[key, result.value]]);

    const message = `Unable to extract "${key}": ${result.reason}`;
    if (required) throw new Error(message);
    console.warn(message);
    return null;
  };
}

export function optionalNumericCell(key: string, locator: CellLocator): ExtractionFunction {
  return cellExtractor(key, locator, parseNumeric, false);
}

export function optionalTextCell(key: string, locator: CellLocator): ExtractionFunction {
  return cellExtractor(key, locator, parseText, false);
}

export function optionalDateCell(key: string, locator: CellLocator): ExtractionFunction {
  return cellExtractor(key, locator, parseDate, false);
}

export function requiredNumericCell(key: string, locator: CellLocator): ExtractionFunction {
  return cellExtractor(key, locator, parseNumeric, true);
}

export function requiredTextCell(key: string, locator: CellLocator): ExtractionFunction {
  return cellExtractor(key, locator, parseText, true);
}