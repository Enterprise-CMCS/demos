import { describe, expect, it } from "vitest";
import type { ExcelData } from "../index.js";
import { locateLabelRow, locateLabelRows } from "./labels.js";

const data: ExcelData = [{
  sheet: "Summary",
  data: [
    ["TOTAL", "Start", "TOTAL"],
    [null, "TOTAL"],
    [null, "Middle"],
    [null, "TOTAL"],
    [null, "End"],
    [null, "TOTAL"],
    [null, " TOTAL"],
    [null, "TOTAL "],
    [null, "total"],
    [],
  ],
}];

describe("locateLabelRows", () => {
  it("returns every exact match in column B in ascending, one-based row order", () => {
    expect(locateLabelRows(data, "Summary", "TOTAL")).toEqual([2, 4, 6]);
  });

  it("does not trim, fold case, or match other columns", () => {
    expect(locateLabelRows(data, "Summary", " TOTAL")).toEqual([7]);
    expect(locateLabelRows(data, "Summary", "TOTAL ")).toEqual([8]);
    expect(locateLabelRows(data, "Summary", "total")).toEqual([9]);
    expect(locateLabelRows([{ sheet: "Summary", data: [["TOTAL", null, "TOTAL"]] }], "Summary", "TOTAL")).toEqual([]);
  });

  it("uses inclusive range endpoints and allows either endpoint to be omitted", () => {
    expect(locateLabelRows(data, "Summary", "TOTAL", { first: 2, last: 4 })).toEqual([2, 4]);
    expect(locateLabelRows(data, "Summary", "TOTAL", { first: 4 })).toEqual([4, 6]);
    expect(locateLabelRows(data, "Summary", "TOTAL", { last: 2 })).toEqual([2]);
    expect(locateLabelRows(data, "Summary", "TOTAL", { first: 4, last: 4 })).toEqual([4]);
  });

  it("returns no matches for a missing sheet, label, empty sheet, or out-of-bounds range", () => {
    expect(locateLabelRows(data, "Missing", "TOTAL")).toEqual([]);
    expect(locateLabelRows(data, "Summary", "Missing")).toEqual([]);
    expect(locateLabelRows([{ sheet: "Empty", data: [] }], "Empty", "TOTAL")).toEqual([]);
    expect(locateLabelRows(data, "Summary", "TOTAL", { first: 50 })).toEqual([]);
  });

  it.each([
    { first: 4, last: 2 },
    { first: 0 },
    { first: -1 },
    { first: 1.5 },
    { last: 2.5 },
    { last: Number.NaN },
    { last: Infinity },
  ])("never guesses for an invalid range %j", (range) => {
    expect(locateLabelRows(data, "Summary", "TOTAL", range)).toEqual([]);
  });

  it("handles sparse rows without treating gaps as labels", () => {
    const sparse: ExcelData = [{ sheet: "Summary", data: [] }];
    sparse[0]!.data[100] = [null, "TOTAL"];
    expect(locateLabelRows(sparse, "Summary", "TOTAL")).toEqual([101]);
  });
});

describe("locateLabelRow", () => {
  it("succeeds only for exactly one match in the range", () => {
    expect(locateLabelRow(data, "Summary", "TOTAL", { first: 3, last: 5 })).toEqual({ ok: true, row: 4 });
    expect(locateLabelRow(data, "Summary", "TOTAL")).toEqual({
      ok: false,
      reason: expect.stringContaining("3 matches"),
    });
  });

  it("reports missing labels and sheets instead of choosing a nearby row", () => {
    expect(locateLabelRow(data, "Summary", "Missing")).toEqual({
      ok: false,
      reason: expect.stringContaining('Label "Missing" not found'),
    });
    expect(locateLabelRow(data, "Missing", "TOTAL")).toEqual({
      ok: false,
      reason: expect.stringContaining('Sheet "Missing" not found'),
    });
  });

  it("supports chaining exclusive boundaries from earlier labels", () => {
    const start = locateLabelRow(data, "Summary", "Start");
    expect(start.ok).toBe(true);
    if (!start.ok) throw new Error(start.reason);
    const end = locateLabelRow(data, "Summary", "Middle", { first: start.row + 1 });
    expect(end.ok).toBe(true);
    if (!end.ok) throw new Error(end.reason);
    expect(locateLabelRow(data, "Summary", "TOTAL", {
      first: start.row + 1,
      last: end.row - 1,
    })).toEqual({ ok: true, row: 2 });
  });
});