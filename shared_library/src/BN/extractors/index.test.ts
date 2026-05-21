import { describe, expect, it } from "vitest";

import type { ExcelData } from "../index.js";
import { extractions } from "./index.js";

function buildWorkbook(b8: string , as436:  number ): ExcelData {
  const summaryData = Array.from({ length: 436 }, () => [] as (string | number | null)[]);

  summaryData[7]![1] = b8 ?? null;
  summaryData[435]![18] = as436 ?? null;

  return [{ sheet: "Summary", data: summaryData }];
}

describe("BN extractors", () => {
  it("extracts actuals from cell B8", () => {
    const data = buildWorkbook("FY25", 1250);

    const result = extractions[0]!(data);

    expect(result).toEqual(new Map([["actuals", "FY25"]]));
  });


  it("extracts net variance from cell AS436", () => {
    const data = buildWorkbook("FY25", 3200.5);

    const result = extractions[1]!(data);

    expect(result).toEqual(new Map([["netVariance", 3200.5]]));
  });
  
});