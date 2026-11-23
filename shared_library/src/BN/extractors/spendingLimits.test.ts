import { describe, expect, it } from "vitest";
import { excelColumnToNumber, type ExcelData } from "../index.js";
import { extractSpendingLimits } from "./spendingLimits.js";

function spendingFixture(): ExcelData {
  const data: ExcelData = [{ sheet: "Program Spending Limits", data: [] }];
  const setCell = (address: string, value: string | number | null) => {
    const [, column, row] = /^([A-Z]+)(\d+)$/.exec(address)!;
    const rowIndex = Number(row) - 1;
    data[0]!.data[rowIndex] ??= [];
    data[0]!.data[rowIndex]![excelColumnToNumber(column!)] = value;
  };
  const addProgram = (
    start: number,
    name: string,
    cap: number | null,
    variance: number | null,
    over: string,
    megAmounts: (number | null)[],
  ) => {
    setCell(`B${start}`, "Program Name and Associated MEGs");
    setCell(`B${start + 1}`, "Program Name");
    setCell(`B${start + 2}`, name);
    setCell(`AQ${start + 2}`, cap);
    setCell(`B${start + 3}`, "Expenditures Subject to Cap");
    megAmounts.forEach((amount, index) => {
      setCell(`B${start + 4 + index}`, "Shared MEG");
      setCell(`AQ${start + 4 + index}`, amount);
    });
    const varianceRow = start + 4 + megAmounts.length;
    setCell(`B${varianceRow}`, "Variance");
    setCell(`AQ${varianceRow}`, variance);
    setCell(`B${varianceRow + 1}`, "Over or Under");
    setCell(`AQ${varianceRow + 1}`, over);
  };

  addProgram(1, "Program One", 0, 0, ".", [0, null]);
  addProgram(11, "Program Two", null, -2, "Over", [5]);
  return data;
}

describe("extractSpendingLimits", () => {
  it("keeps program identity and repeated MEG names separate while preserving zero and false", () => {
    const result = extractSpendingLimits(spendingFixture());

    expect(result.spendingLimits).toEqual([
      {
        programIndex: 1,
        programName: "Program One",
        capTotal: 0,
        varianceTotal: 0,
        overCap: false,
        megs: [
          { lineNumber: 1, megName: "Shared MEG", subjectToCapTotal: 0 },
          { lineNumber: 2, megName: "Shared MEG", subjectToCapTotal: undefined },
        ],
      },
      {
        programIndex: 2,
        programName: "Program Two",
        varianceTotal: -2,
        overCap: true,
        megs: [{ lineNumber: 1, megName: "Shared MEG", subjectToCapTotal: 5 }],
      },
    ]);
  });

  it("omits an incomplete program without borrowing rows from the next block", () => {
    const data = spendingFixture();
    data[0]!.data[6]![excelColumnToNumber("B")] = "Missing variance";

    const result = extractSpendingLimits(data);

    expect(result.spendingLimits.map(({ programIndex, programName }) => [programIndex, programName]))
      .toEqual([[2, "Program Two"]]);
    expect(result.warnings).toContainEqual(expect.stringContaining("Spending limit 1 omitted"));
  });

  it("keeps missing optional amounts null and warns on an unrecognized flag", () => {
    const data = spendingFixture();
    data[0]!.data[2]![excelColumnToNumber("AQ")] = "not numeric";
    data[0]!.data[7]![excelColumnToNumber("AQ")] = "Unknown";

    const result = extractSpendingLimits(data);

    expect(result.spendingLimits[0]?.capTotal).toBeUndefined();
    expect(result.spendingLimits[0]?.overCap).toBeUndefined();
    expect(result.spendingLimits[0]?.megs[1]?.subjectToCapTotal).toBeUndefined();
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining("AQ3"),
      expect.stringContaining("AQ8"),
    ]));
  });

  it("warns when the sheet or program headings are absent", () => {
    expect(extractSpendingLimits([]).warnings).toEqual([
      'Spending limits omitted: Sheet "Program Spending Limits" not found.',
    ]);
    expect(extractSpendingLimits([{ sheet: "Program Spending Limits", data: [] }]).warnings).toEqual([
      "Spending limits omitted: no program block headings found.",
    ]);
  });
});
