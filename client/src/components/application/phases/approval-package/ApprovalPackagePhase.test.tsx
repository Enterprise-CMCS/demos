import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApprovalPackagePhase } from "./ApprovalPackagePhase";
import { ApplicationWorkflowDocument } from "components/application";
import { DocumentType } from "demos-server";
import { ApprovalPackageTableRow } from "components/table/tables/ApprovalPackageTable";

vi.mock("components/table/tables/ApprovalPackageTable", () => ({
  ApprovalPackageTable: ({ rows }: { rows: ApprovalPackageTableRow[] }) => (
    <div data-testid="approval-package-table">
      {rows.map((row) => (
        <div key={row.documentType} data-testid="table-row">
          {row.documentType} | {row.name}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("util/formatDate", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatDate: (date: string | Date) => "FormattedDate",
}));

const mockCompletePhase = vi.fn();
vi.mock("components/application/phase-status/phaseCompletionQueries", () => ({
  useCompletePhase: () => ({
    completePhase: mockCompletePhase,
  }),
}));

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ApprovalPackagePhase", () => {
  it("renders the section headers and subtext", () => {
    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={[]}
        allPreviousPhasesDone={true}
        isReadonly={false}
        onFinish={mockOnFinish}
      />
    );

    expect(screen.getByText("APPROVAL")).toBeInTheDocument();
    expect(
      screen.getByText("List of all required documents/reviews needed for approval.")
    ).toBeInTheDocument();
    expect(screen.getByText("APPROVAL PACKAGE")).toBeInTheDocument();
    expect(screen.getByText("Each file type is required prior to approval")).toBeInTheDocument();
  });

  it("renders the table with all 6 required document types, even when no documents provided", () => {
    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={[]}
        allPreviousPhasesDone={true}
        isReadonly={false}
        onFinish={mockOnFinish}
      />
    );

    const rows = screen.getAllByTestId("table-row");
    expect(rows).toHaveLength(6);

    const types = rows.map((r) => r.textContent?.split("|")[0].trim());
    expect(types).toEqual([
      "Final Budget Neutrality Formulation Workbook",
      "Q&A",
      "Special Terms & Conditions",
      "Formal OMB Policy Concurrence Email",
      "Approval Letter",
      "Signed Decision Memo",
    ]);
  });

  it("populates row fields correctly when documents exist", () => {
    const d1 = doc({
      id: "doc-22",
      documentType: "Q&A",
      name: "Q&A Document",
      description: "Description of Q&A",
      owner: { person: { fullName: "Bob" } },
    });

    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={[d1]}
        allPreviousPhasesDone={true}
        isReadonly={false}
        onFinish={mockOnFinish}
      />
    );

    const rows = screen.getAllByTestId("table-row");
    const qaRow = rows.find((r) => r.textContent?.includes("Q&A"));
    expect(qaRow).toBeTruthy();
    expect(qaRow!.textContent).toContain("Q&A Document");
  });

  it("sets missing fields to '-' when no document provided for a type", () => {
    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={[]}
        allPreviousPhasesDone={true}
        isReadonly={false}
        onFinish={mockOnFinish}
      />
    );

    const rows = screen.getAllByTestId("table-row");
    const workbookRow = rows.find((r) =>
      r.textContent?.includes("Final Budget Neutrality Formulation Workbook")
    );
    expect(workbookRow!.textContent).toContain("-");
  });

  it("disables Finish when previous phases are NOT done", () => {
    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={allRequiredDocs}
        allPreviousPhasesDone={false}
        isReadonly={false}
        onFinish={mockOnFinish}
      />
    );

    expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();
  });

  it("disables Finish when NOT all required documents are uploaded", () => {
    const partialDocs = [doc({ documentType: "Q&A" })];

    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={partialDocs}
        allPreviousPhasesDone={true}
        isReadonly={false}
        onFinish={mockOnFinish}
      />
    );

    expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();
  });

  it("disables Finish when phase is readonly (completed)", () => {
    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={allRequiredDocs}
        allPreviousPhasesDone={true}
        isReadonly={true}
        onFinish={mockOnFinish}
      />
    );

    expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();
  });

  it("enables Finish only when all previous phases done, all documents uploaded, and not readonly", () => {
    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={allRequiredDocs}
        allPreviousPhasesDone={true}
        isReadonly={false}
        onFinish={mockOnFinish}
      />
    );

    expect(screen.getByRole("button", { name: /finish/i })).toBeEnabled();
  });

  it("disables Finish with empty documents list", () => {
    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={[]}
        allPreviousPhasesDone={true}
        isReadonly={false}
        onFinish={mockOnFinish}
      />
    );

    expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();
  });

  it("calls completePhase and onFinish on successful Finish click", async () => {
    const user = userEvent.setup();
    mockCompletePhase.mockResolvedValueOnce(undefined);

    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={allRequiredDocs}
        allPreviousPhasesDone={true}
        isReadonly={false}
        onFinish={mockOnFinish}
      />
    );

    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(mockCompletePhase).toHaveBeenCalledWith({
      applicationId: "demo-1",
      phaseName: "Approval Package",
    });
    expect(mockOnFinish).toHaveBeenCalled();
    expect(mockShowSuccess).toHaveBeenCalled();
  });

  it("shows error toast when completePhase fails", async () => {
    const user = userEvent.setup();
    mockCompletePhase.mockRejectedValueOnce(new Error("Network error"));

    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={allRequiredDocs}
        allPreviousPhasesDone={true}
        isReadonly={false}
        onFinish={mockOnFinish}
      />
    );

    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(mockShowError).toHaveBeenCalled();
    expect(mockOnFinish).not.toHaveBeenCalled();
  });

  it("renders the approval package table component", () => {
    render(
      <ApprovalPackagePhase
        applicationId="demo-1"
        documents={[]}
        allPreviousPhasesDone={true}
        isReadonly={false}
        onFinish={mockOnFinish}
      />
    );

    expect(screen.getByTestId("approval-package-table")).toBeInTheDocument();
  });
});
