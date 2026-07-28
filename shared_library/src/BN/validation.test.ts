import { describe, it, expect, vi } from "vitest";

import type { ExcelData } from "./index.js";
import * as BN from "./index.js";
import { validateBNWorkbook, type ValidationError } from "./validation.js";
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

  it("returns validation errors and skips extraction while keeping validator execution", async () => {
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
      extractedValues: new Map(),
    });
    expect(firstValidation).toHaveBeenCalledWith(data);
    expect(secondValidation).toHaveBeenCalledWith(data);
    expect(thirdValidation).toHaveBeenCalledWith(data);
    expect(extraction).not.toHaveBeenCalled();
  });
});
