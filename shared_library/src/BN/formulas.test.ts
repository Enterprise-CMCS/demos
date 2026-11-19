import { describe, expect, it } from "vitest";
import { FormulaReadError, isCellInArrayFormulaRange, readFormulaInfo } from "./formulas.js";
import { workbookParts, zipWorkbook } from "../../test/bnFixtures.js";

const ARRAY_FORMULA = '<row r="435"><c r="B435" t="str"><f t="array" ref="B435:C436">"NET VARIANCE"</f><v>NET VARIANCE</v></c></row>';

describe("array formula metadata", () => {
  it("retains rectangular ranges and matches only cells within their boundaries", () => {
    const info = readFormulaInfo(zipWorkbook(workbookParts("", ARRAY_FORMULA)));
    const [range] = info.arrayFormulaRanges.get("Summary")!;

    expect(range).toEqual({ startRow: 435, startColumn: 2, endRow: 436, endColumn: 3 });
    expect(info.formulaCells.get("Summary")).toEqual(new Set(["B435"]));
    expect(info.arrayFormulaRanges.get("Program Spending Limits")).toEqual([]);
    expect(isCellInArrayFormulaRange("B435", range!)).toBe(true);
    expect(isCellInArrayFormulaRange("B436", range!)).toBe(true);
    expect(isCellInArrayFormulaRange("C435", range!)).toBe(true);
    expect(isCellInArrayFormulaRange("C436", range!)).toBe(true);
    expect(isCellInArrayFormulaRange("A435", range!)).toBe(false);
    expect(isCellInArrayFormulaRange("B434", range!)).toBe(false);
    expect(isCellInArrayFormulaRange("D436", range!)).toBe(false);
    expect(isCellInArrayFormulaRange("B437", range!)).toBe(false);
    expect(isCellInArrayFormulaRange("INVALID", range!)).toBe(false);
  });

  it.each(["B435", "$B$435:$C$436"])("accepts valid array formula reference %s", (ref) => {
    const info = readFormulaInfo(zipWorkbook(workbookParts("", ARRAY_FORMULA.replace("B435:C436", ref))));
    expect(info.arrayFormulaRanges.get("Summary")).toHaveLength(1);
  });

  it("keeps a full-sheet range compact rather than expanding it into cell markers", () => {
    const summary = ARRAY_FORMULA.replace('r="B435"', 'r="A1"').replace("B435:C436", "A1:XFD1048576");
    const info = readFormulaInfo(zipWorkbook(workbookParts("", summary)));
    const ranges = info.arrayFormulaRanges.get("Summary")!;
    expect(ranges).toHaveLength(1);
    expect(info.formulaCells.get("Summary")).toEqual(new Set(["A1"]));
    expect(isCellInArrayFormulaRange("XFD1048576", ranges[0]!)).toBe(true);
  });

  it("rejects an array formula without a range", () => {
    const summary = ARRAY_FORMULA.replace(' ref="B435:C436"', "");
    expect(() => readFormulaInfo(zipWorkbook(workbookParts("", summary)))).toThrow(FormulaReadError);
  });

  it.each(["", "B435:", "B435:INVALID", "C436:B435", "A1:A2", "B435:C436:D437", "XFE1:XFE2", "A1048577:A1048578"])(
    "rejects malformed array formula range %s",
    (ref) => {
      const summary = ARRAY_FORMULA.replace("B435:C436", ref);
      expect(() => readFormulaInfo(zipWorkbook(workbookParts("", summary)))).toThrow(FormulaReadError);
    },
  );
});