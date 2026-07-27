import { describe, it, expect, vi } from "vitest";

import type { ExcelData } from "./index.js";
import * as BN from "./index.js";
import {
  EXTRACTION_ERROR_CODE,
  RULE_ERROR_CODE,
  validateBNWorkbook,
  type ValidationError,
} from "./validation.js";
import { validations as v1Validations } from "./rulesets/v1/index.js";
import { extractorFunctions } from "./extractors/index.js";

describe("validateBNWorkbook", () => {
  it("should validate a real file", async () => {
    const data = await BN.parseBNFileFromPath("test/fixtures/test-bn.xlsm");
    const result = await validateBNWorkbook(
      data,
      v1Validations,
      extractorFunctions,
    );
    expect(result.isValid).toBe(true);
    expect(result.extractedValues?.get("netVariance")).toBe(46848737436.56);
    expect(result.extractedValues?.get("actuals")).toBe("Actuals + Projected");
  });

  it("returns a valid result with empty errors when no validations are provided", async () => {
    const data: ExcelData = [];

    const result = await validateBNWorkbook(data, [], []);

    expect(result).toEqual({
      isValid: true,
      errors: [],
      extractedValues: new Map(),
    });
  });

  it("returns validation errors and still extracts values while keeping validator execution", async () => {
    const data: ExcelData = [{ sheet: "Sheet1", data: [["A", 1]] }];

    const expectedError: ValidationError = {
      code: "MISSING_CELL",
      message: "Required cell is missing",
    };

    const firstValidation = vi.fn(() => null);
    const secondValidation = vi.fn(() => expectedError);
    const thirdValidation = vi.fn(() => null);
    const extraction = vi.fn(
      () => new Map<string, string | number>([["actuals", "FY25"]]),
    );

    const result = await validateBNWorkbook(
      data,
      [firstValidation, secondValidation, thirdValidation],
      [extraction],
    );

    expect(result).toEqual({
      isValid: false,
      errors: [expectedError],
      extractedValues: new Map([["actuals", "FY25"]]),
    });
    expect(firstValidation).toHaveBeenCalledWith(data);
    expect(secondValidation).toHaveBeenCalledWith(data);
    expect(thirdValidation).toHaveBeenCalledWith(data);
    expect(extraction).toHaveBeenCalledWith(data);
  });

  it("reports a throwing extractor as an error and keeps the values other extractors read", async () => {
    const data: ExcelData = [{ sheet: "Sheet1", data: [["A", 1]] }];

    const actualsExtraction = vi.fn(
      () => new Map<string, string | number>([["actuals", "Actuals Only"]]),
    );
    const netVarianceExtraction = vi.fn(() => {
      throw new Error("Unable to extract net variance from cell AS436 in Summary tab.");
    });

    const result = await validateBNWorkbook(
      data,
      [],
      [actualsExtraction, netVarianceExtraction],
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual([
      {
        code: EXTRACTION_ERROR_CODE,
        message: "Unable to extract net variance from cell AS436 in Summary tab.",
      },
    ]);
    expect(result.extractedValues.get("actuals")).toBe("Actuals Only");
    expect(result.extractedValues.has("netVariance")).toBe(false);
  });

  it("reports a throwing validation rule as an error instead of aborting the run", async () => {
    const data: ExcelData = [{ sheet: "Sheet1", data: [["A", 1]] }];

    const throwingValidation = vi.fn(() => {
      throw new Error("Sheet \"C Report\" not found");
    });
    const laterValidation = vi.fn(() => null);
    const extraction = vi.fn(
      () => new Map<string, string | number>([["actuals", "Actuals Only"]]),
    );

    const result = await validateBNWorkbook(
      data,
      [throwingValidation, laterValidation],
      [extraction],
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual([
      {
        code: RULE_ERROR_CODE,
        message: 'Workbook is missing expected structure: Sheet "C Report" not found',
      },
    ]);
    expect(laterValidation).toHaveBeenCalledWith(data);
    expect(result.extractedValues.get("actuals")).toBe("Actuals Only");
  });
});
