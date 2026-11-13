import { describe, expect, it } from "vitest";
import { setCell, spendingFixture, summaryFixture } from "../../../test/bnFixtures.js";
import { extractBNWorkbook, reportingDys, toSparseContent } from "./workbook.js";

describe("reportingDys", () => {
  it("returns the inclusive reporting DY range", () => {
    expect(reportingDys(27, 32)).toEqual({ dys: [27, 28, 29, 30, 31, 32] });
  });

  it.each([
    [undefined, 32], [27, undefined], [0, 32], [1, 41], [32, 27], [1.5, 2],
  ] as const)("falls back to totals for invalid range %j–%j", (start, end) => {
    const result = reportingDys(start, end);
    expect(result.dys).toEqual([]);
    expect(result.warning).toContain("only totals will be stored");
  });
});

describe("extractBNWorkbook", () => {
  it("adds registry net variance and combines the purple reporting sections", () => {
    const data = [...summaryFixture(13, 13), ...spendingFixture(3)];
    const result = extractBNWorkbook(data, [27, 32], new Map([["netVariance", 987654]]));

    expect(result.extract.testValues).toContainEqual({
      testId: "Main", measureId: "Net Variance", megName: null, dyNumber: null, value: 987654,
    });
    expect(result.extract.testValues.filter(({ measureId }) => measureId === "Net Variance")).toHaveLength(1);
    expect(result.extract.spendingLimits).toHaveLength(3);
    expect(result.extract.testValues.filter(({ testId }) => testId === "Hypothetical 13")).not.toHaveLength(0);
    expect(result.warnings).toEqual([]);
  });

  it("requires a numeric net variance from the field registry", () => {
    expect(() => extractBNWorkbook(summaryFixture(), [], new Map())).toThrow("netVariance");
  });
});

describe("toSparseContent", () => {
  it("drops empty cells and placeholders while retaining real values and exact addresses", () => {
    const data = summaryFixture(0, 1);
    setCell(data, "Summary", "A1", null);
    setCell(data, "Summary", "C1", "");
    setCell(data, "Summary", "D1", "   ");
    setCell(data, "Summary", "E1", "Blank cell. No entry");
    setCell(data, "Summary", "F1", false);
    setCell(data, "Summary", "G1", 0);
    setCell(data, "Summary", "H1", "value");
    data[0]!.formulaCells = new Set(["H1"]);

    const content = toSparseContent(data);

    expect(content.Summary).toMatchObject({ B8: "Actuals + Projected", F1: false, G1: 0, H1: "value" });
    expect(content.Summary).not.toHaveProperty("A1");
    expect(content.Summary).not.toHaveProperty("C1");
    expect(content.Summary).not.toHaveProperty("D1");
    expect(content.Summary).not.toHaveProperty("E1");
    expect(content.Summary).not.toHaveProperty("formulaCells");
  });
});