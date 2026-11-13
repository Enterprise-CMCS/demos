import { describe, expect, it } from "vitest";
import { extractSummary } from "./summary.js";
import { setCell, summaryFixture } from "../../../test/bnFixtures.js";

describe("extractSummary", () => {
  it("extracts main totals, Expenditure Authority MEGs, and the total for the reporting DY range", () => {
    const data = summaryFixture();
    const result = extractSummary(data, [27, 28]);

    expect(result.warnings).toEqual([]);
    expect(result.testValues.filter(({ testId, measureId }) => testId === "Main" && measureId === "Without-Waiver Total"))
      .toEqual([
        { testId: "Main", measureId: "Without-Waiver Total", megName: null, dyNumber: 27, value: 20627 },
        { testId: "Main", measureId: "Without-Waiver Total", megName: null, dyNumber: 28, value: 20628 },
        { testId: "Main", measureId: "Without-Waiver Total", megName: null, dyNumber: null, value: 206000 },
      ]);
    expect(result.testValues.filter(({ testId, measureId }) => testId === "Main" && measureId === "With-Waiver Total"))
      .toHaveLength(3);

    const authority = result.testValues.filter(({ measureId }) => measureId === "Expenditure Authority");
    expect(authority).toHaveLength(18 * 2 + 3);
    expect(authority.find(({ megName, dyNumber }) => megName === "MEG 1" && dyNumber === 27)?.value).toBe(25327);
  });

  it.each([10, 13])("finds all %i hypothetical blocks after the MEG rows shift", (hypotheticals) => {
    const data = summaryFixture(13, hypotheticals);
    const result = extractSummary(data, [27, 28, 29, 30, 31, 32]);
    const tests = new Set(result.testValues.map(({ testId }) => testId));

    expect(tests).toContain("Hypothetical 1");
    expect(tests).toContain(`Hypothetical ${hypotheticals}`);
    expect([...tests].filter((testId) => testId.startsWith("Hypothetical "))).toHaveLength(hypotheticals);
    expect(result.testValues.find(({ testId, measureId, dyNumber }) =>
      testId === "Hypothetical 1" && measureId === "Without-Waiver Total" && dyNumber === 27)?.value).toBe(56827);

    const authority = result.testValues.filter(({ measureId }) => measureId === "Expenditure Authority");
    expect(authority.filter(({ megName }) => megName !== null)).toHaveLength(31 * 6);
    expect(authority.find(({ megName, dyNumber }) => megName === "MEG 31" && dyNumber === 32)?.value).toBe(28332);
    expect(authority.find(({ megName, dyNumber }) => megName === null && dyNumber === null)?.value).toBe(285000);
  });

  it("supports limiting hypothetical extraction while keeping the default at 15", () => {
    const data = summaryFixture(0, 15);
    const release = extractSummary(data, [], { maxHypotheticalTest: 13 });
    const general = extractSummary(data, []);
    const releaseTests = new Set(release.testValues.map(({ testId }) => testId));
    const generalTests = new Set(general.testValues.map(({ testId }) => testId));

    expect(releaseTests).toContain("Hypothetical 13");
    expect(releaseTests).not.toContain("Hypothetical 14");
    expect(releaseTests).not.toContain("Hypothetical 15");
    expect(generalTests).toContain("Hypothetical 15");
  });

  it("maps CAP flags and warns for unrecognized values", () => {
    const data = summaryFixture(0, 1);
    setCell(data, "Summary", "E454", "CAP Needed");
    setCell(data, "Summary", "F454", " ");
    setCell(data, "Summary", "G454", "unknown");
    setCell(data, "Summary", "H454", " \t");
    setCell(data, "Summary", "I454", 0);
    setCell(data, "Summary", "J454", false);

    const result = extractSummary(data, [1, 2, 3, 4, 5, 6]);

    expect(result.testYears.filter(({ testId }) => testId === "Main")).toEqual([
      { testId: "Main", dyNumber: 1, capNeeded: true },
      { testId: "Main", dyNumber: 2, capNeeded: false },
      { testId: "Main", dyNumber: 3, capNeeded: null },
      { testId: "Main", dyNumber: 4, capNeeded: null },
      { testId: "Main", dyNumber: 5, capNeeded: null },
      { testId: "Main", dyNumber: 6, capNeeded: null },
    ]);
    expect(result.testYears.filter(({ testId }) => testId === "Hypothetical 1")).toEqual([
      { testId: "Hypothetical 1", dyNumber: 1, capNeeded: false },
      { testId: "Hypothetical 1", dyNumber: 2, capNeeded: false },
      { testId: "Hypothetical 1", dyNumber: 3, capNeeded: false },
      { testId: "Hypothetical 1", dyNumber: 4, capNeeded: false },
      { testId: "Hypothetical 1", dyNumber: 5, capNeeded: false },
      { testId: "Hypothetical 1", dyNumber: 6, capNeeded: false },
    ]);
    expect(result.warnings).toEqual([
      expect.stringContaining("Summary!G454"),
      expect.stringContaining("Summary!H454"),
      expect.stringContaining("Summary!I454"),
      expect.stringContaining("Summary!J454"),
    ]);
  });

  it("omits an incomplete Expenditure Authority section without emitting partial rows", () => {
    const data = summaryFixture();
    setCell(data, "Summary", "B252", "missing heading");

    const result = extractSummary(data, [27]);

    expect(result.testValues.some(({ measureId }) => measureId === "Expenditure Authority")).toBe(false);
    expect(result.warnings).toEqual([expect.stringContaining("Main Expenditure Authority omitted")]);
  });

  it("keeps the first duplicate MEG, skips blank names, and reads formula-produced names", () => {
    const data = summaryFixture(0, 1);
    data[0]!.formulaCells = new Set(["B253"]);
    setCell(data, "Summary", "B254", "MEG 1");
    setCell(data, "Summary", "B255", "");
    setCell(data, "Summary", "B256", "Blank cell. No entry");
    setCell(data, "Summary", "B257", "  ");
    setCell(data, "Summary", "B258", "\t");

    const result = extractSummary(data, [27]);
    const values = result.testValues.filter(({ measureId, megName }) => measureId === "Expenditure Authority" && megName === "MEG 1");

    expect(values).toEqual([
      { testId: "Main", measureId: "Expenditure Authority", megName: "MEG 1", dyNumber: 27, value: 25327 },
    ]);
    expect(result.testValues.some(({ megName }) => megName === "" || megName === "Blank cell. No entry")).toBe(false);
    expect(result.testValues.some(({ megName }) => megName === "  ")).toBe(true);
    expect(result.testValues.some(({ megName }) => megName === "\t")).toBe(true);
    expect(result.warnings).toEqual([expect.stringContaining('duplicate MEG name "MEG 1"')]);
  });

  it("emits totals only when no reporting DYs are valid", () => {
    const result = extractSummary(summaryFixture(0, 1), []);
    expect(result.testYears).toEqual([]);
    expect(result.testValues).toHaveLength(5);
    expect(result.testValues.every(({ megName, dyNumber }) => megName === null && dyNumber === null)).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("omits blank, placeholder, and unparseable amounts with one warning per cell", () => {
    const data = summaryFixture(0, 1);
    setCell(data, "Summary", "E206", "");
    setCell(data, "Summary", "F206", "Blank cell. No entry");
    setCell(data, "Summary", "G206", "not numeric");

    const result = extractSummary(data, [1, 2, 3]);

    expect(result.testValues.filter(({ testId, measureId }) => testId === "Main" && measureId === "Without-Waiver Total"))
      .toEqual([{ testId: "Main", measureId: "Without-Waiver Total", megName: null, dyNumber: null, value: 206000 }]);
    expect(result.warnings).toHaveLength(3);
  });

  it("never chooses a main-test boundary when the first hypothetical heading is ambiguous", () => {
    const data = summaryFixture(0, 1);
    const first = data[0]!.data.findIndex((row) => row?.[1] === "HYPOTHETICALS TEST 1") + 1;
    setCell(data, "Summary", `B${first + 1}`, "HYPOTHETICALS TEST 1");

    const result = extractSummary(data, [27]);

    expect(result.testValues).toEqual([]);
    expect(result.testYears).toEqual([]);
    expect(result.warnings).toEqual([
      expect.stringContaining("Main test omitted"),
      expect.stringContaining("Hypothetical 1 omitted"),
    ]);
  });

  it("warns once when Summary is absent", () => {
    expect(extractSummary([], []).warnings).toEqual(['Summary omitted: Sheet "Summary" not found.']);
  });
});