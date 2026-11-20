import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

import { DocumentType } from "demos-server";
import { BN_WORKBOOK_DOCUMENT_TYPE } from "demos-server-constants";
import { BNWorkbookInputError } from "demos-shared-library/BN";
import type { ValidationError } from "demos-shared-library/BN/validation";

import { BNPreValidationState, useBNWorkbookPreValidation } from "./useBNWorkbookPreValidation";

const PARSED_WORKBOOK = {
  data: [{ sheet: "Summary", data: [[0]], formulaCells: new Set(["A1"]) }],
  cachedValuesMayBeStale: false,
  warnings: [],
};

const parseBNWorkbook = vi.fn();
const validate = vi.fn();

vi.mock("demos-shared-library/BN", async () => {
  const actual =
    await vi.importActual<typeof import("demos-shared-library/BN")>("demos-shared-library/BN");
  return { ...actual, parseBNWorkbook: (...args: unknown[]) => parseBNWorkbook(...args) };
});
vi.mock("demos-shared-library/BN/validation", () => ({
  validate: (...args: unknown[]) => validate(...args),
}));

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
  validate.mockReset().mockResolvedValue([]);
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

  it("returns valid when shared validation returns no failures", async () => {
    const file = makeFile();

    render(<Probe file={file} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => expect(readState().status).toBe("valid"));
    expect(parseBNWorkbook).toHaveBeenCalledWith(file);
    expect(validate).toHaveBeenCalledOnce();
    expect(validate).toHaveBeenCalledWith(PARSED_WORKBOOK.data);
  });

  it("surfaces every failure returned by shared validation", async () => {
    const errors = [
      { code: "1", message: "Error: C Report Tab - missing data." },
      { code: "5", message: "Error: C Report - 'Data Pulled On' field is blank." },
    ];
    validate.mockResolvedValue(errors);

    render(<Probe file={makeFile()} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => {
      const state = readState();
      expect(state.status).toBe("invalid");
      if (state.status === "invalid") {
        expect(state.errors).toEqual(errors);
      }
    });
    expect(validate).toHaveBeenCalledWith(PARSED_WORKBOOK.data);
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
    expect(validate).not.toHaveBeenCalled();
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
    expect(validate).not.toHaveBeenCalled();
  });

  it("surfaces extraction failures returned by shared validation", async () => {
    const validationError = {
      code: "BN_NET_VARIANCE_VALUE",
      message: "Summary!AS436 must contain a finite numeric value.",
    };
    validate.mockResolvedValue([validationError]);

    render(<Probe file={makeFile()} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => {
      expect(readState()).toEqual({ status: "invalid", errors: [validationError] });
    });
    expect(validate).toHaveBeenCalledWith(PARSED_WORKBOOK.data);
  });

  it("returns a generic validation error when shared validation unexpectedly rejects", async () => {
    const error = new Error("internal extraction failure");
    validate.mockRejectedValue(error);

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

  it("stays validating until required financial validation completes", async () => {
    let finishValidation!: (errors: ValidationError[]) => void;
    validate.mockReturnValue(
      new Promise<ValidationError[]>((resolve) => {
        finishValidation = resolve;
      })
    );

    render(<Probe file={makeFile()} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => expect(validate).toHaveBeenCalled());
    expect(readState()).toEqual({ status: "validating" });

    await act(async () => {
      finishValidation([]);
    });
    expect(readState()).toEqual({ status: "valid" });
  });

  it.each(["cleared", "replaced"])("ignores validation results after the file is %s", async (change) => {
    let finishValidation!: (errors: ValidationError[]) => void;
    validate.mockReturnValueOnce(
      new Promise<ValidationError[]>((resolve) => {
        finishValidation = resolve;
      })
    );
    const { rerender } = render(
      <Probe file={makeFile()} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />
    );

    await waitFor(() => expect(validate).toHaveBeenCalled());
    const replacement = change === "replaced" ? makeFile("replacement.xlsx") : null;
    const expectedStatus = replacement ? "valid" : "idle";
    rerender(<Probe file={replacement} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);
    await waitFor(() => expect(readState()).toEqual({ status: expectedStatus }));

    await act(async () => {
      finishValidation([{ code: "STALE", message: "stale failure" }]);
    });
    expect(readState()).toEqual({ status: expectedStatus });
  });
});
