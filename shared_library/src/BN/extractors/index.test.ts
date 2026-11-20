import { describe, expect, it } from "vitest";

import type { ExcelData } from "../index.js";
import { extractorFunctions } from "./index.js";

function workbook(): ExcelData {
  const summary: (string | number | null)[][] = Array.from({ length: 436 }, () => []);
  summary[7]![1] = "Actuals + Projected";
  summary[435]![1] = "NET VARIANCE";
  summary[435]![44] = 12345678;
  return [{ sheet: "Summary", data: summary }];
}

describe("BN extractors", () => {
  it("run all extractors and verify output.", async () => {
    const data = workbook();
    const extractedValues = new Map<string, string | number>();

    extractorFunctions.forEach((extractor) => {
      const result = extractor(data);
      if(result){
        result.forEach((value, key) => {
          extractedValues.set(key, value);
        });
      }
    });    
    

    expect(extractedValues.get("actuals")).toEqual("Actuals + Projected");
    expect(extractedValues.get("netVariance")).toEqual(12345678);
  });
});
