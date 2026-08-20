import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApprovalPackagePhase, ApprovalPackagePhaseProps } from "./ApprovalPackagePhase";
import { ApplicationWorkflowDocument } from "components/application";
import { DocumentType } from "demos-server";
import { cmsMockUser, MockUser, readonlyMockUser } from "mock-data/userMocks";
import { DialogProvider } from "components/dialog/DialogContext";
import { TestProvider } from "test-utils/TestProvider";
import { ToastContainer } from "components/toast";

const mockCompletePhase = vi.fn();
vi.mock("components/application/phase-status/phaseCompletionQueries", () => ({
  useCompletePhase: () => ({
    completePhase: mockCompletePhase,
  }),
}));

const doc = (overrides: Partial<ApplicationWorkflowDocument>): ApplicationWorkflowDocument => ({
  id: "doc-1",
  name: "Sample Name",
  description: "Sample Desc",
  documentType: "Approval Letter" as DocumentType,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  phaseName: "Approval Package",
  owner: { person: { fullName: "Alice" } },
  ...overrides,
});

const allRequiredDocs = [
  doc({ documentType: "Final Budget Neutrality Formulation Workbook" }),
  doc({ documentType: "Q&A" }),
  doc({ documentType: "Special Terms & Conditions" }),
  doc({ documentType: "Formal OMB Policy Concurrence Email" }),
  doc({ documentType: "Approval Letter" }),
  doc({ documentType: "Signed Decision Memo" }),
];

const mockOnFinish = vi.fn();

const defaultProps: ApprovalPackagePhaseProps = {
  applicationId: "demo-1",
  documents: [],
  allPreviousPhasesDone: true,
  isPhaseCompleted: false,
  onFinish: mockOnFinish,
};

const setup = (
  props: Partial<ApprovalPackagePhaseProps> = {},
  currentUser: MockUser = cmsMockUser
) =>
  render(
    <TestProvider currentUser={currentUser}>
      <DialogProvider>
        <ApprovalPackagePhase {...defaultProps} {...props} />
      </DialogProvider>
      <ToastContainer />
    </TestProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ApprovalPackagePhase", () => {
  it("renders the section headers and subtext", () => {
    setup();

    expect(screen.getByText("APPROVAL")).toBeInTheDocument();
    expect(
      screen.getByText("List of all required documents/reviews needed for approval.")
    ).toBeInTheDocument();
    expect(screen.getByText("APPROVAL PACKAGE")).toBeInTheDocument();
    expect(screen.getByText("Each file type is required prior to approval")).toBeInTheDocument();
  });

  it("renders the table with all 6 required document types, even when no documents provided", () => {
    setup();

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    // Subtract 1 for header row
    expect(rows.length - 1).toEqual(6);

    // Check for document types in the table
    expect(screen.getByText("Final Budget Neutrality Formulation Workbook")).toBeInTheDocument();
    expect(screen.getByText("Q&A")).toBeInTheDocument();
    expect(screen.getByText("Special Terms & Conditions")).toBeInTheDocument();
    expect(screen.getByText("Formal OMB Policy Concurrence Email")).toBeInTheDocument();
    expect(screen.getByText("Approval Letter")).toBeInTheDocument();
    expect(screen.getByText("Signed Decision Memo")).toBeInTheDocument();
  });

  it("populates row fields correctly when documents exist", () => {
    const d1 = doc({
      id: "doc-22",
      documentType: "Q&A",
      name: "Q&A Document",
      description: "Description of Q&A",
      owner: { person: { fullName: "Bob" } },
    });

    setup({ documents: [d1] });

    expect(screen.getByText("Q&A")).toBeInTheDocument();
    expect(screen.getByText("Q&A Document")).toBeInTheDocument();
    expect(screen.getByText("Description of Q&A")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("sets missing fields to '-' when no document provided for a type", () => {
    setup();

    expect(screen.getByText("Final Budget Neutrality Formulation Workbook")).toBeInTheDocument();
    // Table rows with no documents should show "-" for file name
    const table = screen.getByRole("table");
    const tableText = table.textContent || "";
    expect(tableText).toContain("-");
  });

  it("disables Finish when previous phases are NOT done", () => {
    setup({ documents: allRequiredDocs, allPreviousPhasesDone: false });

    expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();
  });

  it("disables Finish when NOT all required documents are uploaded", () => {
    const partialDocs = [doc({ documentType: "Q&A" })];

    setup({ documents: partialDocs });

    expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();
  });

  it("disables Finish when phase is completed", () => {
    setup({ documents: allRequiredDocs, isPhaseCompleted: true });

    expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();
  });

  it("hides Finish when user is readonly", () => {
    setup({ documents: allRequiredDocs }, readonlyMockUser);

    expect(screen.queryByRole("button", { name: /finish/i })).not.toBeInTheDocument();
  });

  it("enables Finish only when all previous phases done, all documents uploaded, and not readonly", () => {
    setup({ documents: allRequiredDocs });

    expect(screen.getByRole("button", { name: /finish/i })).toBeEnabled();
  });

  it("disables Finish with empty documents list", () => {
    setup();

    expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();
  });

  it("calls completePhase and onFinish on successful Finish click", async () => {
    const user = userEvent.setup();
    mockCompletePhase.mockResolvedValueOnce(undefined);

    setup({ documents: allRequiredDocs });

    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(mockCompletePhase).toHaveBeenCalledWith({
      applicationId: "demo-1",
      phaseName: "Approval Package",
    });
    expect(mockOnFinish).toHaveBeenCalled();
    expect(screen.getByText("Approval Package has been completed")).toBeInTheDocument();
  });

  it("shows error toast when completePhase fails", async () => {
    const user = userEvent.setup();
    mockCompletePhase.mockRejectedValueOnce(new Error("Network error"));

    setup({ documents: allRequiredDocs });

    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(screen.getByText("Failed to save updates.")).toBeInTheDocument();
    expect(mockOnFinish).not.toHaveBeenCalled();
  });

  it("renders the approval package table component", () => {
    setup();

    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
