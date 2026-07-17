import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import {
  CompletenessPhase,
  CompletenessPhaseProps,
  getApplicationCompletenessFromApplication,
  COMPLETENESS_PHASE_DESCRIPTION,
  STATE_DEEMED_COMPLETE_DATEPICKER_NAME,
  FEDERAL_COMMENT_START_DATEPICKER_NAME,
  FEDERAL_COMMENT_END_DATEPICKER_NAME,
} from "./CompletenessPhase";
import { ApplicationWorkflowDocument, WorkflowApplication } from "components/application";
import { TZDate } from "@date-fns/tz";
import { EST_TIMEZONE } from "util/formatDate";

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCompletenessDocumentUploadDialog: vi.fn(),
    showDeclareIncompleteDialog: vi.fn(),
  }),
}));

vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDates: () => ({ setApplicationDates: vi.fn() }),
}));

vi.mock("../../phase-status/phaseCompletionQueries", () => ({
  useCompletePhase: vi.fn(() => ({ completePhase: vi.fn() })),
  useDeclareCompletenessPhaseIncomplete: vi.fn(() => ({
    declareCompletenessPhaseIncomplete: vi.fn(),
  })),
}));

const makeApplication = (overrides: Partial<WorkflowApplication> = {}): WorkflowApplication => ({
  id: "app-456",
  currentPhaseName: "Completeness",
  status: "Under Review",
  tags: [],
  clearanceLevel: "CMS (OSORA)",
  phases: [
    { phaseName: "Application Intake", phaseStatus: "Completed", phaseDates: [], phaseNotes: [] },
    { phaseName: "Completeness", phaseStatus: "Started", phaseDates: [], phaseNotes: [] },
  ],
  documents: [],
  ...overrides,
});

const mockCompletenessDoc: ApplicationWorkflowDocument = {
  id: "doc-1",
  name: "Completeness Letter",
  description: "Test letter",
  documentType: "Application Completeness Letter",
  phaseName: "Completeness",
  owner: { person: { fullName: "Jane Doe" } },
  createdAt: new TZDate("2026-02-01", EST_TIMEZONE),
};

const mockInternalDoc: ApplicationWorkflowDocument = {
  id: "doc-2",
  name: "Internal Form",
  description: "Internal form",
  documentType: "Internal Completeness Review Form",
  phaseName: "Completeness",
  owner: { person: { fullName: "John Smith" } },
  createdAt: new TZDate("2026-02-02", EST_TIMEZONE),
};

describe("CompletenessPhase", () => {
  const mockSetSelectedPhase = vi.fn();
  const defaultProps: CompletenessPhaseProps = {
    applicationId: "app-123",
    applicationIntakeComplete: true,
    completenessPhaseStatus: "Started",
    completenessReviewDate: "2026-02-28",
    stateDeemedCompleteDate: "",
    completenessDocuments: [],
    setSelectedPhase: mockSetSelectedPhase,
  };

  const setup = (props: Partial<CompletenessPhaseProps> = {}) => {
    const finalProps = { ...defaultProps, ...props };
    render(
      <TestProvider>
        <CompletenessPhase {...finalProps} />
      </TestProvider>
    );
    return finalProps;
  };

  describe("Phase Header", () => {
    it("renders COMPLETENESS header", () => {
      setup();
      const header = screen.getByText("Completeness");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("text-brand");
    });

    it("renders description", () => {
      setup();
      expect(screen.getByTestId(COMPLETENESS_PHASE_DESCRIPTION.testId)).toHaveTextContent(
        COMPLETENESS_PHASE_DESCRIPTION.text
      );
    });
  });
});

describe("getApplicationCompletenessFromApplication", () => {
  const mockSetSelectedPhase = vi.fn();

  const setup = (overrides: Partial<WorkflowApplication> = {}) => {
    const application = makeApplication(overrides);
    render(
      <TestProvider>
        {getApplicationCompletenessFromApplication(application, mockSetSelectedPhase)}
      </TestProvider>
    );
  };

  it("renders the completeness phase component", () => {
    setup();
    expect(screen.getByText("Completeness")).toBeInTheDocument();
  });

  it("populates date pickers from phaseDates", () => {
    setup({
      phases: [
        {
          phaseName: "Application Intake",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Completeness",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "State Application Deemed Complete",
              dateValue: new TZDate("2026-03-01T05:00:00.000Z", EST_TIMEZONE),
            },
            {
              dateType: "Federal Comment Period Start Date",
              dateValue: new TZDate("2026-03-02T05:00:00.000Z", EST_TIMEZONE),
            },
            {
              dateType: "Federal Comment Period End Date",
              dateValue: new TZDate("2026-04-01T04:00:00.000Z", EST_TIMEZONE),
            },
          ],
          phaseNotes: [],
        },
      ],
    });
    expect(screen.getByTestId(STATE_DEEMED_COMPLETE_DATEPICKER_NAME)).toHaveValue("2026-03-01");
    expect(screen.getByTestId(FEDERAL_COMMENT_START_DATEPICKER_NAME)).toHaveValue("2026-03-02");
    expect(screen.getByTestId(FEDERAL_COMMENT_END_DATEPICKER_NAME)).toHaveValue("2026-04-01");
  });

  it("filters documents to only those in the Completeness phase", () => {
    setup({
      documents: [mockCompletenessDoc, { ...mockInternalDoc, phaseName: "Federal Comment" }],
    });
    expect(screen.getByText("Completeness Letter")).toBeInTheDocument();
    expect(screen.queryByText("Internal Form")).not.toBeInTheDocument();
  });

  it("does not auto-fill dates from a Completeness Letter document when phase is Incomplete", () => {
    setup({
      phases: [
        {
          phaseName: "Application Intake",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Completeness",
          phaseStatus: "Incomplete",
          phaseDates: [],
          phaseNotes: [],
        },
      ],
      documents: [mockCompletenessDoc, mockInternalDoc],
    });
    expect(screen.getByTestId(STATE_DEEMED_COMPLETE_DATEPICKER_NAME)).toHaveValue("");
    expect(screen.getByTestId(FEDERAL_COMMENT_START_DATEPICKER_NAME)).toHaveValue("");
    expect(screen.getByTestId(FEDERAL_COMMENT_END_DATEPICKER_NAME)).toHaveValue("");
  });
});
