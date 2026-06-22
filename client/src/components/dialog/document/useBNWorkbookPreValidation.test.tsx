import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { DocumentType } from "demos-server";

import {
  BNPreValidationState,
  useBNWorkbookPreValidation,
} from "./useBNWorkbookPreValidation";
import { BN_WORKBOOK_DOCUMENT_TYPE } from "demos-server-constants";

const parseBNFile = vi.fn();
const rule1 = vi.fn();
const rule2 = vi.fn();

vi.mock("demos-shared-library/dist/src/BN/index.js", () => ({
  parseBNFile: (...args: unknown[]) => parseBNFile(...args),
}));
vi.mock("demos-shared-library/dist/src/BN/rulesets/v1/index.js", () => ({
  validations: [rule1, rule2],
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
  parseBNFile.mockReset();
  rule1.mockReset();
  rule2.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useBNWorkbookPreValidation", () => {
  it("stays idle when no file is selected", () => {
    render(<Probe file={null} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);
    expect(readState().status).toBe("idle");
    expect(parseBNFile).not.toHaveBeenCalled();
  });

  it("stays idle when document type is not BN Workbook", () => {
    render(<Probe file={makeFile()} documentType="General File" />);
    expect(readState().status).toBe("idle");
    expect(parseBNFile).not.toHaveBeenCalled();
  });

  it("returns valid when every rule returns null", async () => {
    parseBNFile.mockResolvedValue([{ sheet: "Sheet1", data: [] }]);
    rule1.mockReturnValue(null);
    rule2.mockReturnValue(null);

    render(<Probe file={makeFile()} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => expect(readState().status).toBe("valid"));
  });

  it("collects every rule's error verbatim when rules return them", async () => {
    parseBNFile.mockResolvedValue([{ sheet: "Sheet1", data: [] }]);
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
  });

  it("returns invalid with a PARSE_ERROR when the file cannot be parsed", async () => {
    parseBNFile.mockRejectedValue(new Error("bad xlsx"));

    render(<Probe file={makeFile("not-really.xlsx")} documentType={BN_WORKBOOK_DOCUMENT_TYPE} />);

    await waitFor(() => {
      const state = readState();
      expect(state.status).toBe("invalid");
      if (state.status === "invalid") {
        expect(state.errors[0]?.code).toBe("PARSE_ERROR");
      }
    });
  });

  it("survives a throwing rule and still surfaces other rules' results", async () => {
    parseBNFile.mockResolvedValue([{ sheet: "Sheet1", data: [] }]);
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
  });
});
