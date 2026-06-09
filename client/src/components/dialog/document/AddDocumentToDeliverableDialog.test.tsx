import "@testing-library/jest-dom";

import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { DocumentType } from "demos-server";

import { AddDocumentToDeliverableDialog } from "./AddDocumentToDeliverableDialog";

const mockMutationFn = vi.fn();
const mockRefetchQueries = vi.fn();

beforeEach(() => {
  vi.mock("@apollo/client", async () => {
    const actual = await vi.importActual("@apollo/client");
    return {
      ...actual,
      useMutation: () => [mockMutationFn, { loading: false }],
      useLazyQuery: () => [vi.fn(), { loading: false }],
      useApolloClient: () => ({
        refetchQueries: mockRefetchQueries,
      }),
    };
  });
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

const renderDialog = (isCmsFile: boolean, documentTypeSubset?: DocumentType[]) =>
  render(
    <ToastProvider>
      <AddDocumentToDeliverableDialog
        onClose={vi.fn()}
        deliverableId="deliverable-1"
        applicationId="demo-1"
        isCmsFile={isCmsFile}
        documentTypeSubset={
          documentTypeSubset ?? (isCmsFile ? undefined : ["General File"])
        }
      />
    </ToastProvider>
  );

describe("AddDocumentToDeliverableDialog", () => {
  it("renders with the Upload Document title and the drop zone", () => {
    renderDialog(false);

    expect(screen.getByRole("heading", { name: "Upload Document" })).toBeInTheDocument();
    expect(screen.getByTestId("input-file")).toBeInTheDocument();
  });

  it("renders the File Type field on the State files variant", () => {
    renderDialog(false);

    expect(screen.getByTestId("input-autocomplete-select")).toBeInTheDocument();
  });

  it("renders the File Type field on the CMS files variant", () => {
    renderDialog(true);

    expect(screen.getByTestId("input-autocomplete-select")).toBeInTheDocument();
  });

  it("offers both BN Template and General File for Budget Neutrality deliverables on the CMS files variant", () => {
    renderDialog(true, ["General File", "BN Workbook", "BN Template"]);

    // Opening the filter reveals each selectable option as a button
    fireEvent.focus(screen.getByTestId("input-autocomplete-select"));

    expect(screen.getByRole("button", { name: "General File" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "BN Template" })).toBeInTheDocument();
    // BN Workbook is allowed for the deliverable but not offered on the CMS File tab
    expect(screen.queryByRole("button", { name: "BN Workbook" })).not.toBeInTheDocument();
  });

  it("offers only General File for non-Budget-Neutrality deliverables on the CMS files variant", () => {
    renderDialog(true, ["General File", "Monitoring Report"]);

    const fileTypeInput = screen.getByTestId("input-autocomplete-select");
    // A single option leaves the filter disabled and pinned to General File
    expect(fileTypeInput).toBeDisabled();
    expect(fileTypeInput).toHaveValue("General File");
  });
});
