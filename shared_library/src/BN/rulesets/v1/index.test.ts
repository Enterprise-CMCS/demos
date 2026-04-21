import { beforeEach, describe, expect, it, vi } from "vitest";

import { type ExcelData } from "../../index.js";
import type { ValidationFunction } from "../../validation.js";
import { validations } from "./index.js";

const { excelColumnRowMock, numberToExcelColumnMock } = vi.hoisted(() => ({
  excelColumnRowMock: vi.fn(),
  numberToExcelColumnMock: vi.fn(),
}));

vi.mock("../../index.js", async () => {
  const actual = await vi.importActual<typeof import("../../index.js")>(
    "../../index.js",
  );
  return {
    ...actual,
    excelColumnRow: excelColumnRowMock,
    numberToExcelColumn: numberToExcelColumnMock,
  };
});

describe("BN rulesets v1 validations", () => {
  const data = [] as unknown as ExcelData;
  const getValidation = (index: number): ValidationFunction => {
    const validation = validations[index];
    if (!validation) {
      throw new Error(`Validation at index ${index} was not found`);
    }
    return validation;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    numberToExcelColumnMock.mockImplementation((num: number) => {
      let n = num;
      let column = "";
      while (n > 0) {
        const remainder = (n - 1) % 26;
        column = String.fromCharCode(65 + remainder) + column;
        n = Math.floor((n - 1) / 26);
      }
      return column;
    });
  });

  it("error1 returns code 1 when waiver headers are missing", () => {
    excelColumnRowMock
      .mockReturnValueOnce("Waiver Name")
      .mockReturnValueOnce("Bad Header")
      .mockReturnValueOnce("Waiver Name")
      .mockReturnValueOnce("Waiver Name");

    expect(getValidation(0)(data)?.code).toBe("1");
  });

  it("error2 returns code 2 when reporting year is blank", () => {
    excelColumnRowMock.mockReturnValueOnce("");

    expect(getValidation(1)(data)?.code).toBe("2");
  });

  it("error3 returns code 3 when reporting quarter is blank", () => {
    excelColumnRowMock.mockReturnValueOnce(null);

    expect(getValidation(2)(data)?.code).toBe("3");
  });

  it("error4 returns code 4 when data exists beyond reporting DY", () => {
    excelColumnRowMock.mockImplementation((cell: string) => {
      if (cell === "F2") {
        return 1;
      }
      return 99;
    });

    expect(getValidation(3)(data)?.code).toBe("4");
  });

  it("error4 scans from D through AP", () => {
    excelColumnRowMock.mockImplementation((cell: string) => {
      if (cell === "F2") {
        return 1;
      }
      if (cell === "E101") {
        return 1;
      }
      return "";
    });

    expect(getValidation(3)(data)?.code).toBe("4");
  });

  it("error5 returns code 5 when Data Pulled On is blank", () => {
    excelColumnRowMock.mockReturnValueOnce("");

    expect(getValidation(4)(data)?.code).toBe("5");
  });

  it("error6 returns code 6 when For the Time Period Through is blank", () => {
    excelColumnRowMock.mockReturnValueOnce(null);

    expect(getValidation(5)(data)?.code).toBe("6");
  });

  it("error7 returns code 7 when reporting quarter is out of range", () => {
    excelColumnRowMock.mockReturnValueOnce(9);

    expect(getValidation(6)(data)?.code).toBe("7");
  });

  it("error8 returns code 8 when MemMon Actual has non-numeric data", () => {
    excelColumnRowMock.mockReturnValueOnce("not-a-number");

    expect(getValidation(7)(data)?.code).toBe("8");
  });

  it("error9 returns code 9 when MemMon Projected has non-numeric data", () => {
    excelColumnRowMock.mockReturnValueOnce("not-a-number");

    expect(getValidation(8)(data)?.code).toBe("9");
  });

  it("error10 returns code 10 when Total Adjustments has non-numeric data", () => {
    excelColumnRowMock.mockReturnValueOnce("not-a-number");

    expect(getValidation(9)(data)?.code).toBe("10");
  });

  it("error11 returns code 11 when WW Spending Projected has non-numeric data", () => {
    excelColumnRowMock.mockReturnValueOnce("not-a-number");

    expect(getValidation(10)(data)?.code).toBe("11");
  });

  it("error12 currently returns null", () => {
    expect(getValidation(11)(data)).toBeNull();
  });
});