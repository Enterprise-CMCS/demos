import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ApprovalPackagePhase, getApprovalPackagePhase } from "./ApprovalPackagePhase";

import {
  ApplicationWorkflowDocument,
  ApplicationWorkflowDemonstration,
} from "components/application/ApplicationWorkflow";
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

vi.mock("components/application/phase-status/phaseStatusQueries", () => ({
  useSetPhaseStatus: () => ({
    setPhaseStatus: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
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

const mockPO = {
  id: "po-1",
  fullName: "Jane Doe",
};

describe("ApprovalPackagePhase", () => {
  it("renders the section headers", () => {
    render(
      <ApprovalPackagePhase demonstrationId="demo-1" documents={[]} allPreviousPhasesDone={true} />
    );

    expect(screen.getByText("APPROVAL")).toBeInTheDocument();
    expect(
      screen.getByText("List of all required documents/reviews needed for approval.")
    ).toBeInTheDocument();
    expect(screen.getByText("APPROVAL PACKAGE")).toBeInTheDocument();
    expect(screen.getByText("Each File Type Is Required Prior To Approval")).toBeInTheDocument();
  });

  it("renders the table with all required types, even if documents missing", () => {
    render(
      <ApprovalPackagePhase demonstrationId="demo-1" documents={[]} allPreviousPhasesDone={true} />
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
      <ApprovalPackagePhase
        demonstrationId="demo-1"
        documents={[d1]}
        allPreviousPhasesDone={true}
      />
    );

    const rows = screen.getAllByTestId("table-row");
    const qaRow = rows.find((r) => r.textContent?.includes("Q&A"));

    expect(qaRow).toBeTruthy();
    expect(qaRow!.textContent).toContain("Q&A Document");
  });

  it("sets missing fields to '-' when no document", () => {
    render(
      <ApprovalPackagePhase demonstrationId="demo-1" documents={[]} allPreviousPhasesDone={true} />
    );

    const rows = screen.getAllByTestId("table-row");
    const workbookRow = rows.find((r) =>
      r.textContent?.includes("Final Budget Neutrality Formulation Workbook")
    );

    expect(workbookRow!.textContent).toContain("-");
  });

  it("disables Finish when previous phases are NOT done", () => {
    const d1 = doc({ documentType: "Q&A" });
    const d2 = doc({ documentType: "Approval Letter" });

    render(
      <ApprovalPackagePhase
        demonstrationId="demo-1"
        documents={[d1, d2]}
        allPreviousPhasesDone={false}
      />
    );

    const finishButton = screen.getByRole("button", { name: /finish/i });
    expect(finishButton).toBeDisabled();
  });

  it("disables Finish when NOT all required documents are uploaded", () => {
    // Provide only one doc even though many required
    const d1 = doc({ documentType: "Q&A" });

    render(
      <ApprovalPackagePhase
        demonstrationId="demo-1"
        documents={[d1]}
        allPreviousPhasesDone={true}
      />
    );

    const finishButton = screen.getByRole("button", { name: /finish/i });
    expect(finishButton).toBeDisabled();
  });

  it("enables Finish ONLY when all previous phases are done AND all required documents uploaded", () => {
    const completeDocs = [
      doc({ documentType: "Final Budget Neutrality Formulation Workbook" }),
      doc({ documentType: "Q&A" }),
      doc({ documentType: "Special Terms & Conditions" }),
      doc({ documentType: "Formal OMB Policy Concurrence Email" }),
      doc({ documentType: "Approval Letter" }),
      doc({ documentType: "Signed Decision Memo" }),
    ];

    render(
      <ApprovalPackagePhase
        demonstrationId="demo-1"
        documents={completeDocs}
        allPreviousPhasesDone={true}
      />
    );

    const finishButton = screen.getByRole("button", { name: /finish/i });
    expect(finishButton).toBeEnabled();
  });

  it("handles empty documents list by disabling Finish", () => {
    render(
      <ApprovalPackagePhase demonstrationId="demo-1" documents={[]} allPreviousPhasesDone={true} />
    );

    const finishButton = screen.getByRole("button", { name: /finish/i });
    expect(finishButton).toBeDisabled();
  });
});

describe("getApprovalPackagePhase", () => {
  it("extracts documents from demonstration and renders phase", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "demo-3",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Pre-Submission",
      currentPhaseName: "Approval Package",
      clearanceLevel: "CMS (OSORA)",
      documents: [
        doc({ documentType: "Q&A", name: "Q&A Doc" }),
        doc({ documentType: "Approval Letter", name: "Approval Doc" }),
      ],
      phases: [
        {
          phaseName: "Completeness",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Approval Package",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        },
      ],
      demonstrationTypes: [],
      tags: [],
    };

    render(getApprovalPackagePhase(demonstration));

    const rows = screen.getAllByTestId("table-row");
    expect(rows).toHaveLength(6);

    const text = rows.map((r) => r.textContent);

    expect(text.some((t) => t?.includes("Q&A Doc"))).toBe(true);
    expect(text.some((t) => t?.includes("Approval Doc"))).toBe(true);
  });

  it("handles missing documents gracefully", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "demo-4",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Pre-Submission",
      currentPhaseName: "Approval Package",
      clearanceLevel: "CMS (OSORA)",
      documents: [],
      phases: [
        {
          phaseName: "Completeness",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Approval Package",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        },
      ],
      demonstrationTypes: [],
      tags: [],
    };

    render(getApprovalPackagePhase(demonstration));

    const rows = screen.getAllByTestId("table-row");
    expect(rows).toHaveLength(6);

    rows.forEach((row) => {
      expect(row.textContent).toContain("-");
    });
  });

  it("correctly computes allPreviousPhasesDone when all previous phases are completed", () => {
    const completeDocs = [
      doc({ documentType: "Final Budget Neutrality Formulation Workbook" }),
      doc({ documentType: "Q&A" }),
      doc({ documentType: "Special Terms & Conditions" }),
      doc({ documentType: "Formal OMB Policy Concurrence Email" }),
      doc({ documentType: "Approval Letter" }),
      doc({ documentType: "Signed Decision Memo" }),
    ];

    const demo: ApplicationWorkflowDemonstration = {
      id: "demo-all",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Approval Package",
      documents: completeDocs,
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Application Intake",
          phaseStatus: "Skipped",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Completeness",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Approval Package",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        },
      ],
      demonstrationTypes: [],
      tags: [],
    };

    render(getApprovalPackagePhase(demo));

    const finishButton = screen.getByRole("button", { name: /finish/i });
    expect(finishButton).toBeEnabled();
  });

  it("correctly computes allPreviousPhasesDone when some previous phases are NOT completed", () => {
    const completeDocs = [
      doc({ documentType: "Final Budget Neutrality Formulation Workbook" }),
      doc({ documentType: "Q&A" }),
      doc({ documentType: "Special Terms & Conditions" }),
      doc({ documentType: "Formal OMB Policy Concurrence Email" }),
      doc({ documentType: "Approval Letter" }),
      doc({ documentType: "Signed Decision Memo" }),
    ];

    const demo: ApplicationWorkflowDemonstration = {
      id: "demo-not",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Approval Package",
      documents: completeDocs,
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Application Intake",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        }, // Not Completed
        {
          phaseName: "Completeness",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Approval Package",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        },
      ],
      demonstrationTypes: [],
      tags: [],
    };

    render(getApprovalPackagePhase(demo));

    const finishButton = screen.getByRole("button", { name: /finish/i });
    expect(finishButton).toBeDisabled();
  });
});
