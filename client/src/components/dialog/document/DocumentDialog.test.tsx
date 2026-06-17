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
  it("requires attestation for the BN Workbook document type", () => {
    expect(documentTypeRequiresAttestation("BN Workbook")).toBe(true);
  });

  it("does not require attestation for other document types", () => {
    expect(documentTypeRequiresAttestation("Final Budget Neutrality Formulation Workbook")).toBe(
      false
    );
    expect(documentTypeRequiresAttestation("General File")).toBe(false);
    expect(documentTypeRequiresAttestation("Approval Letter")).toBe(false);
  });
});

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const renderAddDialog = (
  documentType: DocumentType,
  onSubmit: () => Promise<DocumentUploadResult>,
  onClose: () => void = vi.fn()
) =>
  render(
    <ToastProvider>
      <DocumentDialog
        mode="add"
        documentTypeSubset={[documentType]}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </ToastProvider>
  );

const selectFile = (fileName: string) => {
  const file = new File(["content"], fileName, { type: DOCX_MIME });
  fireEvent.change(screen.getByTestId("input-file"), { target: { files: [file] } });
};

const selectWorkbook = (fileName = "wb.xlsx") => {
  const file = new File(["xlsx-bytes"], fileName, { type: XLSX_MIME });
  fireEvent.change(screen.getByTestId("input-file"), { target: { files: [file] } });
};

// BN Workbook uploads run async pre-validation that disables the upload button until it settles.
const waitForUploadEnabled = () =>
  waitFor(() => expect(screen.getByTestId("button-confirm-upload-document")).not.toBeDisabled());

describe("DocumentDialog attestation gating", () => {
  // BN Workbook pre-validation passes by default since parseBNFile/rule mocks return undefined.
  beforeEach(() => {
    parseBNFile.mockReset();
    rule.mockReset();
  });

  it("shows the attestation dialog and defers upload for a BN Workbook", async () => {
    const onSubmit = vi.fn(() => Promise.resolve<DocumentUploadResult>("succeeded"));
    renderAddDialog("BN Workbook", onSubmit);

    selectWorkbook();
    await waitForUploadEnabled();
    fireEvent.click(screen.getByTestId("button-confirm-upload-document"));

    expect(
      await screen.findByRole("heading", { name: "Attestation Required" })
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("proceeds with the upload after the attestation is confirmed", async () => {
    const onSubmit = vi.fn(() => Promise.resolve<DocumentUploadResult>("succeeded"));
    renderAddDialog("BN Workbook", onSubmit);

    selectWorkbook();
    await waitForUploadEnabled();
    fireEvent.click(screen.getByTestId("button-confirm-upload-document"));

    fireEvent.click(await screen.findByTestId("attestation-acknowledge"));
    fireEvent.click(screen.getByTestId("button-attestation-confirm"));

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("confirms before cancelling the upload when the attestation is dismissed", async () => {
    const onSubmit = vi.fn(() => Promise.resolve<DocumentUploadResult>("succeeded"));
    const onClose = vi.fn();
    renderAddDialog("BN Workbook", onSubmit, onClose);

    selectWorkbook();
    await waitForUploadEnabled();
    fireEvent.click(screen.getByTestId("button-confirm-upload-document"));

    const cancelButtons = await screen.findAllByTestId("button-dialog-cancel");
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);

    // Standard unsaved-changes confirmation must appear before anything is discarded.
    expect(screen.getByText(/You will lose any unsaved changes/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("button-cc-dialog-discard"));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("uploads a Final Budget Neutrality Formulation Workbook directly without an attestation", async () => {
    const onSubmit = vi.fn(() => Promise.resolve<DocumentUploadResult>("succeeded"));
    renderAddDialog("Final Budget Neutrality Formulation Workbook", onSubmit);

    selectFile("bn-formulation-workbook.docx");
    fireEvent.click(screen.getByTestId("button-confirm-upload-document"));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(screen.queryByRole("heading", { name: "Attestation Required" })).not.toBeInTheDocument();
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
