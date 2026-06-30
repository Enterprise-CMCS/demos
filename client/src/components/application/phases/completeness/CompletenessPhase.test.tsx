import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import {
  CompletenessPhase,
  CompletenessPhaseProps,
  COMPLETENESS_FINISH_BUTTON_NAME,
  COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME,
  STATE_DEEMED_COMPLETE_DATEPICKER_NAME,
  FEDERAL_COMMENT_START_DATEPICKER_NAME,
  FEDERAL_COMMENT_END_DATEPICKER_NAME,
  getApplicationCompletenessFromApplication,
  COMPLETENESS_PHASE_DESCRIPTION,
} from "./CompletenessPhase";
import { ApplicationWorkflowDocument, WorkflowApplication } from "components/application";
import { TZDate } from "@date-fns/tz";
import { EST_TIMEZONE } from "util/formatDate";

const showCompletenessDocumentUploadDialog = vi.fn();
const showDeclareIncompleteDialog = vi.fn((callback) => {
  callback();
});

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCompletenessDocumentUploadDialog,
    showDeclareIncompleteDialog,
  }),
}));

const mockSetApplicationDates = vi.fn(() => Promise.resolve());
vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDates: () => ({
    setApplicationDates: mockSetApplicationDates,
  }),
}));

const mockCompletePhase = vi.fn();
const mockDeclareCompletenessPhaseIncomplete = vi.fn();
vi.mock("../../phase-status/phaseCompletionQueries", () => ({
  useCompletePhase: vi.fn(() => ({
    completePhase: mockCompletePhase,
  })),
  useDeclareCompletenessPhaseIncomplete: vi.fn(() => ({
    declareCompletenessPhaseIncomplete: mockDeclareCompletenessPhaseIncomplete,
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

  describe("Button Logic", () => {
    it("Finish button is disabled if required docs are missing", () => {
      setup({ completenessDocuments: [] });
      const finishButton = screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME);
      expect(finishButton).toBeDisabled();
    });

    it("Finish button is enabled when required docs and dates exist", () => {
      setup({
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "2026-02-05",
      });
      const finishButton = screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME);
      expect(finishButton).toBeEnabled();
    });

    it("calls completePhase and selects next phase when finish button is clicked", async () => {
      const user = userEvent.setup();
      setup({
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "2026-02-05",
      });
      const finishButton = screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME);
      await user.click(finishButton);
      expect(mockCompletePhase).toHaveBeenCalledWith({
        applicationId: "app-123",
        phaseName: "Completeness",
      });
      expect(mockSetSelectedPhase).toHaveBeenCalledWith("Federal Comment");
    });

    it("saves exact date values without timezone shift when finish button is clicked", async () => {
      mockSetApplicationDates.mockClear();
      const user = userEvent.setup();
      setup({
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "2026-03-05",
      });

      const finishButton = screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME);
      await user.click(finishButton);

      expect(mockSetApplicationDates).toHaveBeenCalledWith({
        applicationId: "app-123",
        applicationDates: [
          {
            dateType: "State Application Deemed Complete",
            dateValue: "2026-03-05",
          },
          {
            dateType: "Federal Comment Period Start Date",
            dateValue: "2026-03-06",
          },
          {
            dateType: "Federal Comment Period End Date",
            dateValue: "2026-04-05",
          },
        ],
      });
    });

    it("passes declareCompletenessPhaseIncomplete to dialog when button is clicked", async () => {
      const user = userEvent.setup();
      setup({
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "2026-02-05",
      });

      const declareIncompleteButton = screen.getByTestId(
        COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME
      );
      await user.click(declareIncompleteButton);

      expect(mockDeclareCompletenessPhaseIncomplete).toHaveBeenCalledWith("app-123");
    });

    it("clears all date pickers when phase is Incomplete even if a Completeness Letter document exists", () => {
      setup({
        completenessPhaseStatus: "Incomplete",
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "",
      });

      expect(screen.getByTestId(STATE_DEEMED_COMPLETE_DATEPICKER_NAME)).toHaveValue("");
      expect(screen.getByTestId(FEDERAL_COMMENT_START_DATEPICKER_NAME)).toHaveValue("");
      expect(screen.getByTestId(FEDERAL_COMMENT_END_DATEPICKER_NAME)).toHaveValue("");
    });

    it("clears a user-typed date when the Declare Incomplete button is clicked and the refetch sets phase to Incomplete", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TestProvider>
          <CompletenessPhase
            {...defaultProps}
            completenessDocuments={[mockCompletenessDoc, mockInternalDoc]}
          />
        </TestProvider>
      );

      const dateInput = screen.getByTestId(STATE_DEEMED_COMPLETE_DATEPICKER_NAME);
      fireEvent.change(dateInput, { target: { value: "2026-03-15" } });
      expect(dateInput).toHaveValue("2026-03-15");

      const declareIncompleteButton = screen.getByTestId(
        COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME
      );
      await user.click(declareIncompleteButton);

      // Apollo refetches after the mutation and the server sets status to Incomplete +
      // clears DB dates. Simulate that prop update here.
      rerender(
        <TestProvider>
          <CompletenessPhase
            {...defaultProps}
            completenessPhaseStatus="Incomplete"
            stateDeemedCompleteDate=""
            completenessDocuments={[mockCompletenessDoc, mockInternalDoc]}
          />
        </TestProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId(STATE_DEEMED_COMPLETE_DATEPICKER_NAME)).toHaveValue("");
      });
      expect(screen.getByTestId(FEDERAL_COMMENT_START_DATEPICKER_NAME)).toHaveValue("");
      expect(screen.getByTestId(FEDERAL_COMMENT_END_DATEPICKER_NAME)).toHaveValue("");
    });

    it("allows the user to enter a new date while phase is Incomplete", () => {
      setup({
        completenessPhaseStatus: "Incomplete",
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "",
      });

      const dateInput = screen.getByTestId(
        STATE_DEEMED_COMPLETE_DATEPICKER_NAME
      ) as HTMLInputElement;
      expect(dateInput.value).toBe("");

      fireEvent.change(dateInput, { target: { value: "2026-04-10" } });

      expect(dateInput.value).toBe("2026-04-10");
      expect(screen.getByTestId(FEDERAL_COMMENT_START_DATEPICKER_NAME)).toHaveValue("2026-04-11");
      expect(screen.getByTestId(FEDERAL_COMMENT_END_DATEPICKER_NAME)).toHaveValue("2026-05-11");
    });

    it("disables Declare Incomplete button when completeness is complete", () => {
      setup({
        completenessPhaseStatus: "Completed",
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "2026-02-05",
      });

      const declareIncompleteButton = screen.getByTestId(
        COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME
      );
      expect(declareIncompleteButton).toBeDisabled();
    });
  });

  describe("Document Reactivity", () => {
    it("reflects updated documents when props change (no refresh needed)", () => {
      const { rerender } = render(
        <TestProvider>
          <CompletenessPhase {...defaultProps} completenessDocuments={[]} />
        </TestProvider>
      );

      expect(screen.queryByText("Completeness Letter")).not.toBeInTheDocument();

      rerender(
        <TestProvider>
          <CompletenessPhase {...defaultProps} completenessDocuments={[mockCompletenessDoc]} />
        </TestProvider>
      );

      expect(screen.getByText("Completeness Letter")).toBeInTheDocument();
    });

    it("reflects document removal when props change (no refresh needed)", () => {
      const { rerender } = render(
        <TestProvider>
          <CompletenessPhase
            {...defaultProps}
            completenessDocuments={[mockCompletenessDoc, mockInternalDoc]}
          />
        </TestProvider>
      );

      expect(screen.getByText("Completeness Letter")).toBeInTheDocument();
      expect(screen.getByText("Internal Form")).toBeInTheDocument();

      rerender(
        <TestProvider>
          <CompletenessPhase {...defaultProps} completenessDocuments={[]} />
        </TestProvider>
      );

      expect(screen.queryByText("Completeness Letter")).not.toBeInTheDocument();
      expect(screen.queryByText("Internal Form")).not.toBeInTheDocument();
    });

    it("updates Finish button when required documents are added via props", () => {
      const propsWithDates = {
        ...defaultProps,
        stateDeemedCompleteDate: "2026-02-05",
        fedCommentStartDate: "2026-02-06",
        fedCommentEndDate: "2026-03-07",
      };

      const { rerender } = render(
        <TestProvider>
          <CompletenessPhase {...propsWithDates} completenessDocuments={[]} />
        </TestProvider>
      );

      expect(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME)).toBeDisabled();

      rerender(
        <TestProvider>
          <CompletenessPhase
            {...propsWithDates}
            completenessDocuments={[mockCompletenessDoc, mockInternalDoc]}
          />
        </TestProvider>
      );

      expect(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME)).toBeEnabled();
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
