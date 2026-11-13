import { excelColumnRow, type CellValue, type ExcelData } from "../index.js";
import type { ExtractionFunction } from "../validation.js";
import { locateLabelRow, type LabelRange } from "./labels.js";

const EASTERN_DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

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
export type NativeDateSemantics = "calendarDate" | "timestamp";

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
      return { ok: false, reason: "Invalid Excel column-row format" };
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

// We want to return any YYYY-MM-DD type value as the day that it says, which read_exel_file
// parses as UTC. So if we cast raw YYYY-MM-DD to Eastern, that would be incorrect.
function parseDate(raw: CellValue, nativeDateSemantics: NativeDateSemantics): string | null {
  if (raw instanceof Date) {
    if (!Number.isFinite(raw.getTime())) return null;
    return nativeDateSemantics === "calendarDate" ? utcCalendarDate(raw) : easternCalendarDate(raw);
  }
  if (typeof raw !== "string") return null;

  const text = raw.trim();
  const usDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  const value = usDate
    ? `${usDate[3]}-${usDate[1]!.padStart(2, "0")}-${usDate[2]!.padStart(2, "0")}`
    : text;
  if (!/^\d{4}-\d{2}-\d{2}(?:$|T.+(?:Z|[+-]\d{2}:\d{2})$)/.test(value)) return null;

  const calendarDate = value.slice(0, 10);
  const date = new Date(`${calendarDate}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== calendarDate) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return calendarDate;

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? easternCalendarDate(parsed) : null;
}

function easternCalendarDate(date: Date): string | null {
  const parts = EASTERN_DAY_FORMAT.formatToParts(date);
  const year = parts.find(({ type }) => type === "year")?.value;
  const month = parts.find(({ type }) => type === "month")?.value;
  const day = parts.find(({ type }) => type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
}

// Grab year month date from any UTC date
function utcCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
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

export function optionalDateCell(
  key: string,
  locator: CellLocator,
  nativeDateSemantics: NativeDateSemantics = "timestamp",
): ExtractionFunction {
  // Use calendarDate only when the field contract treats native Excel dates as calendar dates.
  return cellExtractor(key, locator, (raw) => parseDate(raw, nativeDateSemantics), false);
}

export function requiredNumericCell(key: string, locator: CellLocator): ExtractionFunction {
  return cellExtractor(key, locator, parseNumeric, true);
}

export function requiredTextCell(key: string, locator: CellLocator): ExtractionFunction {
  return cellExtractor(key, locator, parseText, true);
}
