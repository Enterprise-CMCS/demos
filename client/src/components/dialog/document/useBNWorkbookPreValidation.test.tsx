import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

import { DocumentType } from "demos-server";
import { BN_WORKBOOK_DOCUMENT_TYPE } from "demos-server-constants";
import { BNWorkbookInputError } from "demos-shared-library/BN";
import type { ValidationResult } from "demos-shared-library/BN/validation";

import { BNPreValidationState, useBNWorkbookPreValidation } from "./useBNWorkbookPreValidation";

const PARSED_WORKBOOK = {
  data: [{ sheet: "Summary", data: [[0]], formulaCells: new Set(["A1"]) }],
  cachedValuesMayBeStale: false,
  warnings: [],
};

const parseBNWorkbook = vi.fn();
const validateBNWorkbook = vi.fn();
const rule1 = vi.fn();
const rule2 = vi.fn();
const extractorFunctions = [vi.fn()];

vi.mock("demos-shared-library/BN", async () => {
  const actual =
    await vi.importActual<typeof import("demos-shared-library/BN")>("demos-shared-library/BN");
  return { ...actual, parseBNWorkbook: (...args: unknown[]) => parseBNWorkbook(...args) };
});
vi.mock("demos-shared-library/BN/rulesets", () => ({
  validations: [rule1, rule2],
}));
vi.mock("demos-shared-library/BN/validation", () => ({
  validateBNWorkbook: (...args: unknown[]) => validateBNWorkbook(...args),
}));
vi.mock("demos-shared-library/BN/extractors", () => ({ extractorFunctions }));

const Probe: React.FC<{ file: File | null; documentType: DocumentType }> = ({
  file,
  documentType,
}) => {
  const state = useBNWorkbookPreValidation(file, documentType);
  return <span data-testid="state">{JSON.stringify(state)}</span>;
};

const readState = (): BNPreValidationState =>
  JSON.parse(screen.getByTestId("state").textContent ?? '{"status":"idle"}');

const makeFile = (name = "wb.xlsx") =>
  new File(["xlsx-bytes"], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

beforeEach(() => {
  parseBNWorkbook.mockReset().mockResolvedValue(PARSED_WORKBOOK);
  validateBNWorkbook
    .mockReset()
    .mockResolvedValue({ isValid: true, errors: [], extractedValues: new Map() });
  rule1.mockReset().mockReturnValue(null);
  rule2.mockReset().mockReturnValue(null);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("useBNWorkbookPreValidation", () => {
  it("stays idle when no file is selected", () => {
    render(<Probe file={null} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);
    expect(readState().status).toBe("idle");
    expect(parseBNWorkbook).not.toHaveBeenCalled();
  });

  it("stays idle when document type is not BN Workbook", () => {
    render(<Probe file={makeFile()} documentType="General File" />);
    expect(readState().status).toBe("idle");
    expect(parseBNWorkbook).not.toHaveBeenCalled();
  });

  it("returns valid when every rule returns null", async () => {
    const file = makeFile();

    render(<Probe file={file} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => expect(readState().status).toBe("valid"));
    expect(parseBNWorkbook).toHaveBeenCalledWith(file);
    expect(rule1).toHaveBeenCalledWith(PARSED_WORKBOOK.data);
    expect(rule2).toHaveBeenCalledWith(PARSED_WORKBOOK.data);
    expect(validateBNWorkbook).toHaveBeenCalledWith(PARSED_WORKBOOK.data, [], extractorFunctions);
    expect(validateBNWorkbook.mock.calls[0]?.[0]).toBe(PARSED_WORKBOOK.data);
  });

  it("collects every rule's error verbatim when rules return them", async () => {
    rule1.mockReturnValue({ code: "1", message: "Error: C Report Tab - missing data." });
    rule2.mockReturnValue({
      code: "5",
      message: "Error: C Report - 'Data Pulled On' field is blank.",
    });

    render(<Probe file={makeFile()} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => {
      const state = readState();
      expect(state.status).toBe("invalid");
      if (state.status === "invalid") {
        expect(state.errors).toEqual([
          { code: "1", message: "Error: C Report Tab - missing data." },
          { code: "5", message: "Error: C Report - 'Data Pulled On' field is blank." },
        ]);
      }
    });
    expect(validateBNWorkbook).not.toHaveBeenCalled();
  });

  it("returns invalid with a PARSE_ERROR when the file cannot be parsed", async () => {
    parseBNWorkbook.mockRejectedValue(new Error("bad xlsx"));

    render(<Probe file={makeFile("not-really.xlsx")} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => {
      expect(readState()).toEqual({
        status: "invalid",
        errors: [
          {
            code: "PARSE_ERROR",
            message: "Unable to read the workbook. Please upload a valid .xlsx file.",
          },
        ],
      });
    });
    expect(rule1).not.toHaveBeenCalled();
    expect(rule2).not.toHaveBeenCalled();
    expect(validateBNWorkbook).not.toHaveBeenCalled();
  });

  it.each([
    {
      code: "BN_FORMULA_METADATA",
      message: "Unable to inspect formula metadata.",
    },
    {
      code: "BN_WORKBOOK_PARSE",
      message: "Unable to read the workbook. Please upload a valid .xlsx file.",
    },
  ])("maps typed $code input failures to their shared validation error", async (validationError) => {
    parseBNWorkbook.mockRejectedValue(new BNWorkbookInputError(validationError));

    render(<Probe file={makeFile()} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => {
      expect(readState()).toEqual({ status: "invalid", errors: [validationError] });
    });
    expect(rule1).not.toHaveBeenCalled();
    expect(rule2).not.toHaveBeenCalled();
    expect(validateBNWorkbook).not.toHaveBeenCalled();
  });

  it("surfaces required-cell extraction failures using the shared error contract", async () => {
    const validationError = {
      code: "BN_NET_VARIANCE_VALUE",
      message: "Summary!AS436 must contain a finite numeric value.",
    };
    validateBNWorkbook.mockResolvedValue({
      isValid: false,
      errors: [validationError],
      extractedValues: new Map(),
    });

    render(<Probe file={makeFile()} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => {
      expect(readState()).toEqual({ status: "invalid", errors: [validationError] });
    });
    expect(validateBNWorkbook).toHaveBeenCalledWith(PARSED_WORKBOOK.data, [], extractorFunctions);
  });

  it("returns a generic validation error when shared validation unexpectedly rejects", async () => {
    const error = new Error("internal extraction failure");
    validateBNWorkbook.mockRejectedValue(error);

    render(<Probe file={makeFile()} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => {
      expect(readState()).toEqual({
        status: "invalid",
        errors: [
          {
            code: "VALIDATION_ERROR",
            message: "Unable to validate the workbook. Please try again.",
          },
        ],
      });
    });
    expect(console.error).toHaveBeenCalledWith("BN workbook validation failed:", error);
  });

  it("survives a throwing rule and still surfaces other rules' results", async () => {
    rule1.mockImplementation(() => {
      throw new Error('Sheet "C Report" not found');
    });
    rule2.mockReturnValue({ code: "2", message: "Error: Reporting Year missing." });

    render(<Probe file={makeFile()} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => {
      const state = readState();
      expect(state.status).toBe("invalid");
      if (state.status === "invalid") {
        expect(state.errors).toHaveLength(2);
        expect(state.errors[0]?.code).toBe("RULE_ERROR");
        expect(state.errors[0]?.message).toContain('Sheet "C Report" not found');
        expect(state.errors[1]?.code).toBe("2");
      }
    });
    expect(validateBNWorkbook).not.toHaveBeenCalled();
  });

  it("stays validating until required financial validation completes", async () => {
    let finishValidation!: (result: ValidationResult) => void;
    validateBNWorkbook.mockReturnValue(
      new Promise<ValidationResult>((resolve) => {
        finishValidation = resolve;
      })
    );

    render(<Probe file={makeFile()} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => expect(validateBNWorkbook).toHaveBeenCalled());
    expect(readState()).toEqual({ status: "validating" });

    await act(async () => {
      finishValidation({ isValid: true, errors: [] });
    });
    expect(readState()).toEqual({ status: "valid" });
  });

});
