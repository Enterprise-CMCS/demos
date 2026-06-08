import "@testing-library/jest-dom";

import React from "react";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ToastProvider } from "components/toast/ToastContext";
import { DocumentType } from "demos-server";
import {
  checkFormHasChanges,
  documentTypeRequiresAttestation,
  DocumentDialog,
} from "./DocumentDialog";
import type { DocumentDialogFields, DocumentUploadResult } from "./DocumentDialog";

const parseBNFile = vi.fn();
const rule = vi.fn();

vi.mock("demos-shared-library/dist/src/BN/index.js", () => ({
  parseBNFile: (...args: unknown[]) => parseBNFile(...args),
}));
vi.mock("demos-shared-library/dist/src/BN/rulesets/v1/index.js", () => ({
  validations: [rule],
}));

describe("checkFormHasChanges", () => {
  const base: DocumentDialogFields = {
    id: "1",
    name: "Test",
    description: "Desc",
    documentType: "General File",
    file: null,
  };

  it("returns false when fields are identical", () => {
    expect(checkFormHasChanges(base, base)).toBe(false);
  });

  it("returns true when name changes", () => {
    expect(checkFormHasChanges(base, { ...base, name: "Updated" })).toBe(true);
  });

  it("returns true when description changes", () => {
    expect(checkFormHasChanges(base, { ...base, description: "Updated" })).toBe(true);
  });

  it("returns true when documentType changes", () => {
    expect(checkFormHasChanges(base, { ...base, documentType: "Approval Letter" })).toBe(true);
  });

  it("returns true when file changes", () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    expect(checkFormHasChanges(base, { ...base, file })).toBe(true);
  });

  it("ignores id changes", () => {
    expect(checkFormHasChanges(base, { ...base, id: "2" })).toBe(false);
  });
});

describe("documentTypeRequiresAttestation", () => {
  it("requires attestation for BN notebook document types", () => {
    expect(documentTypeRequiresAttestation("Final Budget Neutrality Formulation Workbook")).toBe(
      true
    );
    expect(documentTypeRequiresAttestation("BN Workbook")).toBe(true);
  });

  it("does not require attestation for other document types", () => {
    expect(documentTypeRequiresAttestation("General File")).toBe(false);
    expect(documentTypeRequiresAttestation("Approval Letter")).toBe(false);
  });
});

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const renderAddDialog = (documentType: DocumentType, onSubmit: () => Promise<DocumentUploadResult>) =>
  render(
    <ToastProvider>
      <DocumentDialog mode="add" documentTypeSubset={[documentType]} onSubmit={onSubmit} />
    </ToastProvider>
  );

const selectFile = (fileName: string) => {
  const file = new File(["content"], fileName, { type: DOCX_MIME });
  fireEvent.change(screen.getByTestId("input-file"), { target: { files: [file] } });
};

describe("DocumentDialog attestation gating", () => {
  it("shows the attestation dialog and defers upload for a BN notebook", async () => {
    const onSubmit = vi.fn(() => Promise.resolve<DocumentUploadResult>("succeeded"));
    renderAddDialog("Final Budget Neutrality Formulation Workbook", onSubmit);

    selectFile("bn-notebook.docx");
    fireEvent.click(screen.getByTestId("button-confirm-upload-document"));

    expect(
      await screen.findByRole("heading", { name: "Attestation Required" })
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("proceeds with the upload after the attestation is confirmed", async () => {
    const onSubmit = vi.fn(() => Promise.resolve<DocumentUploadResult>("succeeded"));
    renderAddDialog("Final Budget Neutrality Formulation Workbook", onSubmit);

    selectFile("bn-notebook.docx");
    fireEvent.click(screen.getByTestId("button-confirm-upload-document"));

    fireEvent.click(await screen.findByTestId("attestation-acknowledge"));
    fireEvent.click(screen.getByTestId("button-attestation-confirm"));

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("cancels the upload without submitting when the attestation is dismissed", async () => {
    const onSubmit = vi.fn(() => Promise.resolve<DocumentUploadResult>("succeeded"));
    renderAddDialog("Final Budget Neutrality Formulation Workbook", onSubmit);

    selectFile("bn-notebook.docx");
    fireEvent.click(screen.getByTestId("button-confirm-upload-document"));

    const cancelButtons = await screen.findAllByTestId("button-dialog-cancel");
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("uploads non-BN documents directly without an attestation", async () => {
    const onSubmit = vi.fn(() => Promise.resolve<DocumentUploadResult>("succeeded"));
    renderAddDialog("General File", onSubmit);

    selectFile("general.docx");
    fireEvent.click(screen.getByTestId("button-confirm-upload-document"));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(screen.queryByRole("heading", { name: "Attestation Required" })).not.toBeInTheDocument();
  });
});

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const selectWorkbook = (fileName = "wb.xlsx") => {
  const file = new File(["xlsx-bytes"], fileName, { type: XLSX_MIME });
  fireEvent.change(screen.getByTestId("input-file"), { target: { files: [file] } });
};

describe("DocumentDialog BN Workbook pre-validation", () => {
  beforeEach(() => {
    parseBNFile.mockReset();
    rule.mockReset();
  });

  it("blocks upload and surfaces the rule errors when validation fails", async () => {
    const onSubmit = vi.fn(() => Promise.resolve<DocumentUploadResult>("succeeded"));
    parseBNFile.mockResolvedValue([{ sheet: "Sheet1", data: [] }]);
    rule.mockReturnValue({ code: "1", message: "Error: C Report Tab - missing data." });

    renderAddDialog("BN Workbook", onSubmit);
    selectWorkbook();

    await waitFor(() => {
      expect(screen.getByTestId("bn-prevalidation-errors")).toBeInTheDocument();
    });
    expect(screen.getByText(/missing data/)).toBeInTheDocument();
    expect(screen.getByTestId("button-confirm-upload-document")).toBeDisabled();

    fireEvent.click(screen.getByTestId("button-confirm-upload-document"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows the success notice and unblocks upload when every rule passes", async () => {
    const onSubmit = vi.fn(() => Promise.resolve<DocumentUploadResult>("succeeded"));
    parseBNFile.mockResolvedValue([{ sheet: "Sheet1", data: [] }]);
    rule.mockReturnValue(null);

    renderAddDialog("BN Workbook", onSubmit);
    selectWorkbook();

    await waitFor(() => {
      expect(screen.getByText("File Validated Successfully")).toBeInTheDocument();
    });
    expect(screen.getByTestId("button-confirm-upload-document")).not.toBeDisabled();
  });

  it("does not run validation for non-BN-Workbook document types", async () => {
    const onSubmit = vi.fn(() => Promise.resolve<DocumentUploadResult>("succeeded"));

    renderAddDialog("General File", onSubmit);
    selectWorkbook();

    expect(parseBNFile).not.toHaveBeenCalled();
    expect(rule).not.toHaveBeenCalled();
    expect(screen.queryByTestId("bn-prevalidation-errors")).not.toBeInTheDocument();
    expect(screen.queryByText("File Validated Successfully")).not.toBeInTheDocument();
    expect(screen.getByTestId("button-confirm-upload-document")).not.toBeDisabled();
  });
});
