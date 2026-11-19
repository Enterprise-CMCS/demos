import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BNWorkbookInputError } from "./errors.js";
import type { ExcelData } from "./index.js";
import type { ExtractionFunction, ValidationError, ValidationFunction } from "./validation.js";

const mocks = vi.hoisted(() => ({
  validations: [] as ValidationFunction[],
  extractorFunctions: [] as ExtractionFunction[],
}));

vi.mock("./rulesets/v1/index.js", () => ({ validations: mocks.validations }));
vi.mock("./extractors/index.js", () => ({ extractorFunctions: mocks.extractorFunctions }));

import { validate } from "./validation.js";

const data: ExcelData = [{ sheet: "Summary", data: [["value"]] }];

beforeEach(() => {
  mocks.validations.length = 0;
  mocks.extractorFunctions.length = 0;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("validate", () => {
  it("returns an empty error array when rules and extractors pass", async () => {
    const rule = vi.fn(() => null);
    const extraction = vi.fn(() => new Map<string, string | number>([["actuals", "FY25"]]));
    mocks.validations.push(rule);
    mocks.extractorFunctions.push(extraction);

    await expect(validate(data)).resolves.toEqual([]);
    expect(rule).toHaveBeenCalledWith(data);
    expect(extraction).toHaveBeenCalledWith(data);
  });

  it("collects rule failures and continues after Error and non-Error throws", async () => {
    const firstError: ValidationError = { code: "FIRST", message: "First failure" };
    const lastError: ValidationError = { code: "LAST", message: "Last failure" };
    const firstRule = vi.fn(() => firstError);
    const errorThrowingRule = vi.fn(() => {
      throw new Error('Sheet "C Report" not found');
    });
    const nonErrorThrowingRule = vi.fn(() => {
      throw "unexpected rule failure";
    });
    const lastRule = vi.fn(() => lastError);
    const extraction = vi.fn(() => null);
    mocks.validations.push(firstRule, errorThrowingRule, nonErrorThrowingRule, lastRule);
    mocks.extractorFunctions.push(extraction);

    await expect(validate(data)).resolves.toEqual([
      firstError,
      {
        code: "RULE_ERROR",
        message: 'Workbook is missing expected structure: Sheet "C Report" not found.',
      },
      {
        code: "RULE_ERROR",
        message: "Workbook is missing expected structure.",
      },
      lastError,
    ]);
    expect(lastRule).toHaveBeenCalledWith(data);
    expect(extraction).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it("returns typed extraction failures as validation errors", async () => {
    const validationError: ValidationError = {
      code: "BN_NET_VARIANCE_VALUE",
      message: "Summary!AS436 must contain a finite numeric value.",
    };
    mocks.validations.push(vi.fn(() => null));
    mocks.extractorFunctions.push(() => {
      throw new BNWorkbookInputError(validationError);
    });

    await expect(validate(data)).resolves.toEqual([validationError]);
  });

  it("continues to throw unexpected extraction errors", async () => {
    mocks.validations.push(vi.fn(() => null));
    mocks.extractorFunctions.push(() => {
      throw new Error("unexpected extractor failure");
    });

    await expect(validate(data)).rejects.toThrow("unexpected extractor failure");
  });
});