import { describe, expect, it } from "vitest";
import { extractSpendingLimits } from "./spendingLimits.js";
import { setCell, spendingFixture } from "../../../test/bnFixtures.js";

describe("extractSpendingLimits", () => {
  it("extracts repeating program blocks, exact names, MEG totals, variance, and flags", () => {
    const result = extractSpendingLimits(spendingFixture(3));

    expect(result.warnings).toEqual([]);
    expect(result.spendingLimits).toHaveLength(3);
    expect(result.spendingLimits.map(({ programName, capTotal, varianceTotal, overCap }) =>
      [programName, capTotal, varianceTotal, overCap])).toEqual([
      ["Program 1 ", 1000, -5, false],
      ["Program 2 ", 2000, -5, false],
      ["Program 3 ", 3000, -5, false],
    ]);
    expect(result.spendingLimits[0]!.megs).toHaveLength(6);
    expect(result.spendingLimits[0]!.megs[0]).toEqual({ lineNumber: 1, megName: "MEG 1", subjectToCapTotal: 10 });
    expect(result.spendingLimits[0]!.megs[5]).toEqual({ lineNumber: 6, megName: "MEG 6", subjectToCapTotal: undefined });
  });

  it("skips unused blocks and blank MEG lines without warnings", () => {
    const data = spendingFixture(2);
    setCell(data, "Program Spending Limits", "B6", "");
    setCell(data, "Program Spending Limits", "B22", " \t");
    setCell(data, "Program Spending Limits", "B23", "Blank cell. No entry");

    const result = extractSpendingLimits(data);

    expect(result.warnings).toEqual([]);
    expect(result.spendingLimits).toHaveLength(1);
    expect(result.spendingLimits[0]!.programIndex).toBe(2);
    expect(result.spendingLimits[0]!.megs.map(({ lineNumber }) => lineNumber)).toEqual([1, 3, 4, 5, 6]);
    expect(result.spendingLimits[0]!.megs[0]!.megName).toBe(" \t");
    expect(result.spendingLimits[0]!.megs.map(({ megName }) => megName)).not.toContain("Blank cell. No entry");
  });

  it("omits an incomplete program block but keeps subsequent complete blocks", () => {
    const data = spendingFixture(2);
    setCell(data, "Program Spending Limits", "B14", "missing variance label");

    const result = extractSpendingLimits(data);

    expect(result.spendingLimits.map(({ programIndex }) => programIndex)).toEqual([2]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Spending limit 1 omitted");
  });

  it("stores unrecognized Over or Under text as NULL and warns", () => {
    const data = spendingFixture();
    setCell(data, "Program Spending Limits", "AQ15", "Neither");

    const result = extractSpendingLimits(data);

    expect(result.spendingLimits[0]!.overCap).toBeUndefined();
    expect(result.warnings).toEqual([expect.stringContaining("AQ15")]);
  });

  it.each([["Over", true], [".", false]] as const)("maps %s to overCap=%j", (text, expected) => {
    const data = spendingFixture();
    setCell(data, "Program Spending Limits", "AQ15", text);
    const result = extractSpendingLimits(data);
    expect(result.spendingLimits[0]!.overCap).toBe(expected);
    expect(result.warnings).toEqual([]);
  });

  it("omits an ambiguous block without partial program or MEG rows", () => {
    const data = spendingFixture();
    setCell(data, "Program Spending Limits", "B16", "Variance");
    const result = extractSpendingLimits(data);
    expect(result.spendingLimits).toEqual([]);
    expect(result.warnings).toEqual([expect.stringContaining("2 matches")]);
  });

  it("keeps a program with NULL optional amounts and records the misses", () => {
    const data = spendingFixture();
    setCell(data, "Program Spending Limits", "AQ6", "");
    setCell(data, "Program Spending Limits", "AQ8", " \t");
    setCell(data, "Program Spending Limits", "AQ14", "not numeric");
    const result = extractSpendingLimits(data);
    expect(result.spendingLimits[0]!.capTotal).toBeUndefined();
    expect(result.spendingLimits[0]!.varianceTotal).toBeUndefined();
    expect(result.spendingLimits[0]!.megs).toHaveLength(6);
    expect(result.spendingLimits[0]!.megs[0]!.subjectToCapTotal).toBeUndefined();
    expect(result.warnings).toHaveLength(3);
  });

  it("warns when the spending-limit sheet is absent", () => {
    expect(extractSpendingLimits([])).toEqual({
      spendingLimits: [],
      warnings: ['Spending limits omitted: Sheet "Program Spending Limits" not found.'],
    });
  });
});