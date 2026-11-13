import { afterEach, describe, expect, it, vi } from "vitest";
import type { CellValue, ExcelData } from "../index.js";
import {
  type CellLocator,
  optionalDateCell,
  optionalNumericCell,
  optionalTextCell,
  readCell,
  requiredNumericCell,
  requiredTextCell,
} from "./cells.js";

const address: CellLocator = { kind: "address", sheet: "Summary", address: "C2" };
const label: CellLocator = { kind: "label", sheet: "Summary", label: "TOTAL", column: "C" };
const workbook = (value: CellValue | null): ExcelData => [{
  sheet: "Summary",
  data: [[null, "Start"], [null, "TOTAL", value], [null, "End"]],
}];

afterEach(() => vi.restoreAllMocks());

describe("readCell", () => {
  it("resolves address and label locators to the same cell", () => {
    for (const locator of [address, label]) {
      expect(readCell(workbook(123), locator, Number)).toEqual({ ok: true, value: 123 });
    }
  });

  it("chains after/before anchors and excludes both boundaries", () => {
    const data: ExcelData = [{
      sheet: "Summary",
      data: [
        [null, "End"],
        [null, "TOTAL", -1],
        [null, "Start"],
        [null, "TOTAL", 42],
        [null, "End"],
        [null, "TOTAL", -2],
      ],
    }];
    const within = { afterLabel: "Start", beforeLabel: "End" };
    expect(readCell(data, { ...label, within }, Number)).toEqual({ ok: true, value: 42 });
    expect(readCell(data, { ...label, label: "Start", within }, Number).ok).toBe(false);
    expect(readCell(data, { ...label, label: "End", within }, Number).ok).toBe(false);
  });

  it("supports a single after or before boundary", () => {
    expect(readCell(workbook(42), { ...label, within: { afterLabel: "Start" } }, Number)).toEqual({ ok: true, value: 42 });
    expect(readCell(workbook(42), { ...label, within: { beforeLabel: "End" } }, Number)).toEqual({ ok: true, value: 42 });
  });

  it("returns failure when parsing returns null or throws", () => {
    expect(readCell(workbook(42), address, () => null)).toEqual({ ok: false, reason: expect.stringContaining("could not be parsed") });
    expect(readCell(workbook(42), address, () => { throw new Error("parse failed"); })).toEqual({ ok: false, reason: expect.stringContaining("parse failed") });
    expect(readCell(workbook(42), address, () => { throw "parse failed"; })).toEqual({ ok: false, reason: "parse failed" });
  });

  it("rejects duplicate target labels inside a chained range", () => {
    const data: ExcelData = [{
      sheet: "Summary",
      data: [[null, "Start"], [null, "TOTAL", 1], [null, "TOTAL", 2], [null, "End"]],
    }];
    expect(readCell(data, {
      ...label,
      within: { afterLabel: "Start", beforeLabel: "End" },
    }, Number)).toEqual({ ok: false, reason: expect.stringContaining("2 matches") });
  });

  it("does not invoke the parser for blanks or the placeholder", () => {
    const parse = vi.fn(() => "parsed");
    for (const value of [null, "", " ", "Blank cell. No entry"]) {
      expect(readCell(workbook(value), address, parse).ok).toBe(false);
    }
    expect(parse).not.toHaveBeenCalled();
  });
});

const misses: { name: string; data: ExcelData; locator: CellLocator; reason: string }[] = [
  { name: "null", data: workbook(null), locator: address, reason: "blank" },
  { name: "empty text", data: workbook(""), locator: address, reason: "blank" },
  { name: "whitespace", data: workbook(" \t"), locator: address, reason: "blank" },
  { name: "placeholder", data: workbook("Blank cell. No entry"), locator: address, reason: "placeholder" },
  { name: "missing cell", data: workbook(null).map((sheet) => ({ ...sheet, data: [[], []] })), locator: address, reason: "blank" },
  { name: "missing row", data: [{ sheet: "Summary", data: [] }], locator: address, reason: "blank" },
  { name: "missing sheet", data: [], locator: address, reason: 'Sheet "Summary" not found' },
  { name: "missing label sheet", data: [], locator: label, reason: 'Sheet "Summary" not found' },
  { name: "missing label", data: workbook(42), locator: { ...label, label: "Missing" }, reason: 'Label "Missing" not found' },
  { name: "padded label", data: workbook(42), locator: { ...label, label: "TOTAL " }, reason: "not found" },
  { name: "duplicate labels", data: [{ sheet: "Summary", data: [[null, "TOTAL", 1], [null, "TOTAL", 2]] }], locator: label, reason: "2 matches" },
  { name: "missing after anchor", data: workbook(42), locator: { ...label, within: { afterLabel: "Missing" } }, reason: 'Label "Missing" not found' },
  { name: "missing before anchor", data: workbook(42), locator: { ...label, within: { beforeLabel: "Missing" } }, reason: 'Label "Missing" not found' },
  { name: "duplicate after anchor", data: [{ sheet: "Summary", data: [[null, "Start"], [null, "TOTAL", 42], [null, "Start"]] }], locator: { ...label, within: { afterLabel: "Start" } }, reason: "2 matches" },
  { name: "duplicate before anchor", data: [{ sheet: "Summary", data: [[null, "End"], [null, "TOTAL", 42], [null, "End"]] }], locator: { ...label, within: { beforeLabel: "End" } }, reason: "2 matches" },
  { name: "reversed boundaries", data: workbook(42), locator: { ...label, within: { afterLabel: "End", beforeLabel: "Start" } }, reason: 'Label "Start" not found' },
  { name: "invalid address", data: workbook(42), locator: { ...address, address: "2C" }, reason: "Invalid Excel column-row format" },
  { name: "zero row", data: workbook(42), locator: { ...address, address: "C0" }, reason: "Invalid Excel column-row format" },
  { name: "invalid label column", data: workbook(42), locator: { ...label, column: "C1" }, reason: "Invalid Excel column" },
];

describe.each(misses)("cell misses: $name", ({ data, locator, reason }) => {
  it("returns an informative failure without throwing", () => {
    expect(readCell(data, locator, () => "value")).toEqual({ ok: false, reason: expect.stringContaining(reason) });
  });

  it.each([optionalNumericCell, optionalTextCell, optionalDateCell])("optional helper returns null and warns", (factory) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(factory("field", locator)(data)).toBeNull();
    expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(reason));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("field"));
  });

  it.each([requiredNumericCell, requiredTextCell])("required helper throws the same reason", (factory) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => factory("field", locator)(data)).toThrow(reason);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("numeric cell helpers", () => {
  it.each([0, -123.45, 123, "123.45", " 123.45 "])("returns a finite number for %j", (value) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const factory of [optionalNumericCell, requiredNumericCell]) {
      expect(factory("amount", address)(workbook(value))).toEqual(new Map([["amount", Number(value)]]));
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(["not numeric", "NaN", "Infinity", Number.NaN, Infinity, -Infinity, true, false, new Date("2026-01-01")])("rejects non-numeric or non-finite value %s", (value) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(optionalNumericCell("amount", address)(workbook(value))).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    expect(() => requiredNumericCell("amount", address)(workbook(value))).toThrow("could not be parsed");
  });
});

describe("text cell helpers", () => {
  it("preserves text exactly without trimming it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const factory of [optionalTextCell, requiredTextCell]) {
      expect(factory("name", address)(workbook("  Name  "))).toEqual(new Map([["name", "  Name  "]]));
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([42, 0, true, new Date("2026-01-01")])("does not coerce %s into text", (value) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(optionalTextCell("name", address)(workbook(value))).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    expect(() => requiredTextCell("name", address)(workbook(value))).toThrow("could not be parsed");
  });
});

describe("optionalDateCell", () => {
  it.each([
    [new Date("2026-07-14T00:00:00.000Z"), "2026-07-13"],
    [new Date("2026-07-14T03:59:59.000Z"), "2026-07-13"],
    [new Date("2026-07-14T04:00:00.000Z"), "2026-07-14"],
    [new Date("2026-01-14T04:59:59.000Z"), "2026-01-13"],
    [new Date("2026-01-14T05:00:00.000Z"), "2026-01-14"],
    ["2026-07-14", "2026-07-14"],
    ["07/14/2026", "2026-07-14"],
    ["7/4/2026", "2026-07-04"],
    ["02/29/2024", "2024-02-29"],
    ["2026-07-14T00:00:00.000Z", "2026-07-13"],
    ["2026-07-14T12:34:56.000Z", "2026-07-14"],
    ["2026-07-14T00:30:00+02:00", "2026-07-13"],
  ] as const)("normalizes date %s to %s in Eastern time", (value, expected) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(optionalDateCell("date", address)(workbook(value))).toEqual(new Map([["date", expected]]));
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    [new Date("2026-07-14T00:00:00.000Z"), "2026-07-14"],
    [new Date("2026-07-14T12:00:00.000Z"), "2026-07-14"],
  ] as const)("preserves the UTC calendar date for declared calendar-date fields: %s", (value, expected) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(optionalDateCell("date", address, "calendarDate")(workbook(value))).toEqual(new Map([["date", expected]]));
    expect(warn).not.toHaveBeenCalled();
  });

  it("still interprets an explicit offset-bearing string as a timestamp in a calendar-date field", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(optionalDateCell("date", address, "calendarDate")(workbook("2026-07-14T00:00:00.000Z")))
      .toEqual(new Map([["date", "2026-07-13"]]));
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    "not a date", "2026-02-30", "02/30/2026", "2025-02-29", "7", "45000",
    "2026-07-14T25:00:00Z", new Date(Number.NaN), 45000, true,
  ])("returns null and warns for invalid date %s", (value) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(optionalDateCell("date", address)(workbook(value))).toBeNull();
    expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("could not be parsed"));
  });
});