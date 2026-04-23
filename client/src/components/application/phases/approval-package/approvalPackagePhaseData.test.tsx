import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  getApprovalPackagePhaseFromApplication,
  getDocumentsForPhase,
  REQUIRED_DOCUMENT_TYPES,
} from "./approvalPackagePhaseData";
import {
  ApplicationWorkflowDocument,
  ApplicationWorkflowDemonstration,
} from "components/application";
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

const mockSetSelectedPhase = vi.fn();

const baseDemonstration: ApplicationWorkflowDemonstration = {
  id: "demo-1",
  name: "Test Demo",
  state: { id: "CA", name: "California" },
  primaryProjectOfficer: mockPO,
  status: "Under Review",
  currentPhaseName: "Approval Package",
  clearanceLevel: "CMS (OSORA)",
  documents: [],
  phases: [
    { phaseName: "Application Intake", phaseStatus: "Completed", phaseDates: [], phaseNotes: [] },
    { phaseName: "Completeness", phaseStatus: "Completed", phaseDates: [], phaseNotes: [] },
    { phaseName: "Federal Comment", phaseStatus: "Completed", phaseDates: [], phaseNotes: [] },
    { phaseName: "SDG Preparation", phaseStatus: "Completed", phaseDates: [], phaseNotes: [] },
    { phaseName: "Review", phaseStatus: "Completed", phaseDates: [], phaseNotes: [] },
    { phaseName: "Approval Package", phaseStatus: "Started", phaseDates: [], phaseNotes: [] },
  ],
  demonstrationTypes: [],
  tags: [],
};

describe("REQUIRED_DOCUMENT_TYPES", () => {
  it("contains all 6 required document types", () => {
    expect(REQUIRED_DOCUMENT_TYPES).toHaveLength(6);
    expect(REQUIRED_DOCUMENT_TYPES).toContain("Final Budget Neutrality Formulation Workbook");
    expect(REQUIRED_DOCUMENT_TYPES).toContain("Q&A");
    expect(REQUIRED_DOCUMENT_TYPES).toContain("Special Terms & Conditions");
    expect(REQUIRED_DOCUMENT_TYPES).toContain("Formal OMB Policy Concurrence Email");
    expect(REQUIRED_DOCUMENT_TYPES).toContain("Approval Letter");
    expect(REQUIRED_DOCUMENT_TYPES).toContain("Signed Decision Memo");
  });
});

describe("getDocumentsForPhase", () => {
  it("returns documents matching Approval Package phase", () => {
    const application = {
      ...baseDemonstration,
      documents: [
        doc({ documentType: "Q&A", phaseName: "Approval Package" }),
        doc({ documentType: "Approval Letter", phaseName: "Approval Package" }),
      ],
    };

    const result = getDocumentsForPhase(application);
    expect(result).toHaveLength(6);
    expect(result[1]).toBeDefined(); // Q&A
    expect(result[4]).toBeDefined(); // Approval Letter
  });

  it("excludes documents not belonging to Approval Package phase", () => {
    const application = {
      ...baseDemonstration,
      documents: [
        doc({ documentType: "Q&A", phaseName: "Concept" }),
        doc({ documentType: "Approval Letter", phaseName: "Review" }),
      ],
    };

    const result = getDocumentsForPhase(application);
    expect(result.filter(Boolean)).toHaveLength(0);
  });

  it("returns undefined for each missing document type", () => {
    const application = { ...baseDemonstration, documents: [] };
    const result = getDocumentsForPhase(application);
    expect(result).toHaveLength(6);
    result.forEach((d) => expect(d).toBeUndefined());
  });
});

describe("getApprovalPackagePhaseFromApplication", () => {
  it("returns null when Approval Package phase is not found", () => {
    const application = {
      ...baseDemonstration,
      phases: [
        { phaseName: "Completeness" as const, phaseStatus: "Completed" as const, phaseDates: [], phaseNotes: [] },
      ],
    };

    const result = getApprovalPackagePhaseFromApplication(application, mockSetSelectedPhase);
    expect(result).toBeNull();
  });

  it("renders the phase component when Approval Package phase exists", () => {
    render(getApprovalPackagePhaseFromApplication(baseDemonstration, mockSetSelectedPhase)!);

    expect(screen.getByText("APPROVAL")).toBeInTheDocument();
    expect(screen.getByText("APPROVAL PACKAGE")).toBeInTheDocument();
  });

  it("extracts documents from application and renders in table", () => {
    const application = {
      ...baseDemonstration,
      documents: [
        doc({ documentType: "Q&A", name: "Q&A Doc", phaseName: "Approval Package" }),
        doc({ documentType: "Approval Letter", name: "Approval Doc", phaseName: "Approval Package" }),
        doc({ documentType: "Special Terms & Conditions", name: "STCs", phaseName: "Concept" }), // wrong phase
      ],
    };

    render(getApprovalPackagePhaseFromApplication(application, mockSetSelectedPhase)!);

    const rows = screen.getAllByTestId("table-row");
    expect(rows).toHaveLength(6);

    const text = rows.map((r) => r.textContent);
    expect(text.some((t) => t?.includes("Q&A Doc"))).toBe(true);
    expect(text.some((t) => t?.includes("Approval Doc"))).toBe(true);
    expect(text.some((t) => t?.includes("STCs"))).toBe(false); // excluded: wrong phase
  });

  it("sets isReadonly when phase is Completed", () => {
    const application = {
      ...baseDemonstration,
      phases: baseDemonstration.phases.map((p) =>
        p.phaseName === "Approval Package"
          ? { ...p, phaseStatus: "Completed" as const }
          : p
      ),
      documents: REQUIRED_DOCUMENT_TYPES.map((type) => doc({ documentType: type })),
    };

    render(getApprovalPackagePhaseFromApplication(application, mockSetSelectedPhase)!);

    // When readonly, Finish should be disabled even with all docs
    expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();
  });

  it("computes allPreviousPhasesDone correctly when all prior phases are completed", () => {
    const application = {
      ...baseDemonstration,
      documents: REQUIRED_DOCUMENT_TYPES.map((type) => doc({ documentType: type })),
    };

    render(getApprovalPackagePhaseFromApplication(application, mockSetSelectedPhase)!);
    expect(screen.getByRole("button", { name: /finish/i })).toBeEnabled();
  });

  it("computes allPreviousPhasesDone correctly when some prior phases are NOT completed", () => {
    const application = {
      ...baseDemonstration,
      phases: baseDemonstration.phases.map((p) =>
        p.phaseName === "Review"
          ? { ...p, phaseStatus: "Started" as const }
          : p
      ),
      documents: REQUIRED_DOCUMENT_TYPES.map((type) => doc({ documentType: type })),
    };

    render(getApprovalPackagePhaseFromApplication(application, mockSetSelectedPhase)!);
    expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();
  });

  it("excludes Concept phase from allPreviousPhasesDone check", () => {
    const application = {
      ...baseDemonstration,
      phases: [
        { phaseName: "Concept" as const, phaseStatus: "Started" as const, phaseDates: [], phaseNotes: [] },
        ...baseDemonstration.phases.filter((p) => p.phaseName !== "Concept"),
      ],
      documents: REQUIRED_DOCUMENT_TYPES.map((type) => doc({ documentType: type })),
    };

    render(getApprovalPackagePhaseFromApplication(application, mockSetSelectedPhase)!);

    // Concept being Started should not affect the result
    expect(screen.getByRole("button", { name: /finish/i })).toBeEnabled();
  });

  it("treats Skipped phases as done for allPreviousPhasesDone", () => {
    const application = {
      ...baseDemonstration,
      phases: baseDemonstration.phases.map((p) =>
        p.phaseName === "Application Intake"
          ? { ...p, phaseStatus: "Skipped" as const }
          : p
      ),
      documents: REQUIRED_DOCUMENT_TYPES.map((type) => doc({ documentType: type })),
    };

    render(getApprovalPackagePhaseFromApplication(application, mockSetSelectedPhase)!);
    expect(screen.getByRole("button", { name: /finish/i })).toBeEnabled();
  });

  it("handles missing documents gracefully with dash placeholders", () => {
    render(getApprovalPackagePhaseFromApplication(baseDemonstration, mockSetSelectedPhase)!);

    const rows = screen.getAllByTestId("table-row");
    expect(rows).toHaveLength(6);
    rows.forEach((row) => {
      expect(row.textContent).toContain("-");
    });
  });
});
