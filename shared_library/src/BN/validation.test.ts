import { describe, it, expect, vi } from "vitest";

import type { ExcelData } from "./index.js";
import { validateBNWorkbook, type ValidationError } from "./validation.js";

describe("validateBNWorkbook", () => {
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
    const extraction = vi.fn(() => new Map<string, string | number>([["actuals", "FY25"]]));

    const result = await validateBNWorkbook(data, [
      firstValidation,
      secondValidation,
      thirdValidation,
    ], [extraction]);

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
