import { describe, expect, it } from "vitest";
import { fileURLToPath } from "url";
import path from "path";

import { parseBNFileFromPath, type ExcelData } from "../index.js";
import { extractorFunctions } from "./index.js";

describe("BN extractors", () => {
  it("run all extractors and verify output.", async () => {
    
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const fixturePath = path.join(currentDir, "..", ".." , "..", "test", "fixtures", "sample.xlsx");

    const data = await parseBNFileFromPath(fixturePath);    

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
