import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  ApprovalPackagePhase,
  getApprovalPackagePhase,
} from "./ApprovalPackagePhase";

import { ApplicationWorkflowDocument, ApplicationWorkflowDemonstration } from "components/application/ApplicationWorkflow";
import { DocumentType } from "demos-server";
import { ApprovalPackageTableRow } from "components/table/tables/ApprovalPackageTable";

// Mock the table component so we can inspect rows passed into it
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

// Mock formatDate to ensure stable output
vi.mock("util/formatDate", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatDate: (date: string | Date) => "FormattedDate",
}));

const doc = (overrides: Partial<ApplicationWorkflowDocument>): ApplicationWorkflowDocument => ({
  id: "doc-1",
  name: "Sample Name",
  description: "Sample Desc",
  documentType: "Approval Letter" as DocumentType,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  owner: { person: { fullName: "Alice" } },
  ...overrides,
});

describe("ApprovalPackagePhase", () => {
  it("renders the section headers", () => {
    render(
      <ApprovalPackagePhase demonstrationId="demo-1" documents={[]} />
    );

    expect(screen.getByText("APPROVAL")).toBeInTheDocument();
    expect(
      screen.getByText("List of all required documents/reviews needed for approval.")
    ).toBeInTheDocument();
    expect(screen.getByText("APPROVAL PACKAGE")).toBeInTheDocument();
    expect(
      screen.getByText("Each File Type Is Required Prior To Approval")
    ).toBeInTheDocument();
  });

  it("renders the table with all required types, even if documents missing", () => {
    render(
      <ApprovalPackagePhase demonstrationId="demo-1" documents={[]} />
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

  it("populates fields correctly when documents exist", () => {
    const d1 = doc({
      id: "doc-22",
      documentType: "Q&A",
      name: "Q&A Document",
      description: "Description of Q&A",
      owner: { person: { fullName: "Bob" } },
    });

    render(
      <ApprovalPackagePhase demonstrationId="demo-1" documents={[d1]} />
    );

    const rows = screen.getAllByTestId("table-row");
    const qaRow = rows.find((r) =>
      r.textContent?.includes("Q&A")
    );

    expect(qaRow).toBeTruthy();
    expect(qaRow!.textContent).toContain("Q&A Document");
  });

  it("sets missing fields to '-' when no document", () => {
    render(
      <ApprovalPackagePhase demonstrationId="demo-1" documents={[]} />
    );

    const rows = screen.getAllByTestId("table-row");
    const workbookRow = rows.find((r) =>
      r.textContent?.includes("Final Budget Neutrality Formulation Workbook")
    );

    expect(workbookRow!.textContent).toContain("-");
  });
});

describe("getApprovalPackagePhase", () => {
  it("extracts documents from demonstration and renders phase", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "demo-3",
      status: "Pre-Submission",
      currentPhaseName: "Approval Package",
      documents: [
        doc({ documentType: "Q&A", name: "Q&A Doc" as const }),
        doc({ documentType: "Approval Letter", name: "Approval Doc" as const }),
      ],
      phases: [],
    };

    render(getApprovalPackagePhase(demonstration));

    const rows = screen.getAllByTestId("table-row");
    expect(rows).toHaveLength(6);

    const text = rows.map((r) => r.textContent);

    expect(text.some((t) => t?.includes("Q&A Doc"))).toBe(true);
    expect(text.some((t) => t?.includes("Approval Doc"))).toBe(true);
  });
});
