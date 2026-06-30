import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { VerifyCompleteSection } from "./VerifyCompleteSection";
import {
  COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME,
  COMPLETENESS_FINISH_BUTTON_NAME,
  COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION,
  FEDERAL_COMMENT_END_DATEPICKER_NAME,
  FEDERAL_COMMENT_START_DATEPICKER_NAME,
  STATE_DEEMED_COMPLETE_DATEPICKER_NAME,
} from "./CompletenessPhase";
import { ApplicationWorkflowDocument } from "components/application";
import { TZDate } from "@date-fns/tz";
import { EST_TIMEZONE } from "util/formatDate";
import { PhaseStatus } from "demos-server";

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
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

describe("VerifyCompleteSection", () => {
  const defaultProps = {
    applicationId: "app-123",
    stateDeemedCompleteDate: "",
    completenessPhaseStatus: "Started" as PhaseStatus,
    completenessDocuments: [] as ApplicationWorkflowDocument[],
    applicationIntakeComplete: true,
    setSelectedPhase: vi.fn(),
  };

  const setup = (props: Partial<typeof defaultProps> = {}) => {
    render(
      <TestProvider>
        <VerifyCompleteSection {...defaultProps} {...props} />
      </TestProvider>
    );
  };

  it("renders section title and description", () => {
    setup();
    expect(screen.getByText("Step 2 - Verify/Complete")).toBeInTheDocument();
    expect(screen.getByTestId(COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION.testId)).toHaveTextContent(
      COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION.text
    );
  });

  it("renders date picker for State Application Deemed Complete", () => {
    setup();
    const dateInput = screen.getByTestId(STATE_DEEMED_COMPLETE_DATEPICKER_NAME);
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute("type", "date");
  });

  it("renders disabled date pickers for Federal Comment Period", () => {
    setup();
    expect(screen.getByTestId(FEDERAL_COMMENT_START_DATEPICKER_NAME)).toBeDisabled();
    expect(screen.getByTestId(FEDERAL_COMMENT_END_DATEPICKER_NAME)).toBeDisabled();
  });

  it("disables Declare Incomplete button when completeness is Completed", () => {
    setup({ completenessPhaseStatus: "Completed" });
    expect(screen.getByTestId(COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME)).toBeDisabled();
  });

  it("disables Finish button when required documents are missing", () => {
    setup({ completenessDocuments: [], stateDeemedCompleteDate: "2026-02-05" });
    expect(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME)).toBeDisabled();
  });

  it("enables Finish button when required documents and dates are present", () => {
    setup({
      completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
      stateDeemedCompleteDate: "2026-02-05",
    });
    expect(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME)).toBeEnabled();
  });
});
