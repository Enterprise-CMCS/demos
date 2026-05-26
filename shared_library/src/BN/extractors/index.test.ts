import { describe, expect, it } from "vitest";

import type { ExcelData } from "../index.js";
import { extractorFunctions } from "./index.js";

function buildWorkbook(b8: string , as436:  number ): ExcelData {
  const summaryData = Array.from({ length: 436 }, () => [] as (string | number | null)[]);

  summaryData[7]![1] = b8 ?? null;
  summaryData[435]![18] = as436 ?? null;

  return [{ sheet: "Summary", data: summaryData }];
}

describe("BN extractors", () => {
  it("run all extractors and verify output.", () => {
    const data = buildWorkbook("FY25", 1250);

    const extractedValues = new Map<string, string | number>();

    extractorFunctions.forEach((extractor) => {
      const result = extractor(data);
      if(result){
        result.forEach((value, key) => {
          extractedValues.set(key, value);
        });
      }
    });    
    

    expect(extractedValues.get("actuals")).toEqual("FY25");
    expect(extractedValues.get("netVariance")).toEqual(1250);
  });
  
});