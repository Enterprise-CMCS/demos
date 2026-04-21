import { describe, it, expect, vi } from "vitest";

import type { ExcelData } from "./index.js";
import { validateBNWorkbook, type ValidationError } from "./validation.js";

describe("validateBNWorkbook", () => {
  it("returns an empty array when no validations are provided", async () => {
    const data: ExcelData = [];

    const result = await validateBNWorkbook(data, []);

    expect(result).toEqual([]);
  });

  it("returns only validation errors and keeps validator execution", async () => {
    const data: ExcelData = [{ sheet: "Sheet1", data: [["A", 1]] }];

    const expectedError: ValidationError = {
      code: "MISSING_CELL",
      message: "Required cell is missing",
    };

    const firstValidation = vi.fn(() => null);
    const secondValidation = vi.fn(() => expectedError);
    const thirdValidation = vi.fn(() => null);

    const result = await validateBNWorkbook(data, [
      firstValidation,
      secondValidation,
      thirdValidation,
    ]);

    expect(result).toEqual([expectedError]);
    expect(firstValidation).toHaveBeenCalledWith(data);
    expect(secondValidation).toHaveBeenCalledWith(data);
    expect(thirdValidation).toHaveBeenCalledWith(data);
  });
});
