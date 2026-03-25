import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import {
  CompletenessPhase,
  CompletenessPhaseProps,
  COMPLETENESS_UPLOAD_BUTTON_NAME,
  COMPLETENESS_FINISH_BUTTON_NAME,
  COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME,
  STATE_DEEMED_COMPLETE_DATEPICKER_NAME,
  FEDERAL_COMMENT_START_DATEPICKER_NAME,
  FEDERAL_COMMENT_END_DATEPICKER_NAME,
  getApplicationCompletenessFromApplication,
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
vi.mock("../phase-status/phaseCompletionQueries", () => ({
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
    completenessComplete: false,
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
      const header = screen.getByText("COMPLETENESS");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("text-brand");
    });

    it("renders description with link to Medicaid.gov", () => {
      setup();
      expect(
        screen.getByText(/Completeness Checklist - Find completeness guidelines online at/i)
      ).toBeInTheDocument();
      const link = screen.getByRole("link", { name: "Medicaid.gov" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://www.medicaid.gov");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    });
  });

  describe("Step 1 - Upload Section", () => {
    it("renders upload button and helper text", () => {
      setup();
      expect(screen.getByText("STEP 1 - UPLOAD")).toBeInTheDocument();
      expect(screen.getByTestId(COMPLETENESS_UPLOAD_BUTTON_NAME)).toBeInTheDocument();
    });

    it("renders uploaded documents", () => {
      setup({ completenessDocuments: [mockCompletenessDoc, mockInternalDoc] });
      expect(screen.getByText("Completeness Letter")).toBeInTheDocument();
      expect(screen.getByText("Internal Form")).toBeInTheDocument();
    });
  });

  describe("Step 2 - Verify/Complete Section", () => {
    it("renders date picker for State Application Deemed Complete", () => {
      setup();
      const dateInput = screen.getByTestId(STATE_DEEMED_COMPLETE_DATEPICKER_NAME);
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute("type", "date");
    });

    it("renders disabled date pickers for Federal Comment Period", () => {
      setup();
      const startInput = screen.getByTestId(FEDERAL_COMMENT_START_DATEPICKER_NAME);
      const endInput = screen.getByTestId(FEDERAL_COMMENT_END_DATEPICKER_NAME);
      expect(startInput).toBeDisabled();
      expect(endInput).toBeDisabled();
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

    it("disables Declare Incomplete button when completeness is complete", () => {
      setup({
        completenessComplete: true,
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "2026-02-05",
      });

      const declareIncompleteButton = screen.getByTestId(
        COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME
      );
      expect(declareIncompleteButton).toBeDisabled();
    });
  });

  describe("Upload Modal", () => {
    it("calls dialog function when upload clicked", async () => {
      setup();

      const uploadButton = screen.getByTestId(COMPLETENESS_UPLOAD_BUTTON_NAME);
      await userEvent.click(uploadButton);

      expect(showCompletenessDocumentUploadDialog).toHaveBeenCalledWith("app-123");
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

  describe("Completeness Notice Banner", () => {
    it("renders the banner with correct content and dismisses on click", async () => {
      const today = new TZDate("2026-02-08T00:00:00Z", EST_TIMEZONE);
      vi.setSystemTime(today);

      const reviewDate = "2026-02-10"; // 2 days from today

      render(
        <TestProvider>
          <CompletenessPhase
            applicationId="app-123"
            applicationIntakeComplete={true}
            completenessReviewDate={reviewDate}
            completenessComplete={false}
            stateDeemedCompleteDate=""
            completenessDocuments={[]}
            setSelectedPhase={mockSetSelectedPhase}
          />
        </TestProvider>
      );

      // banner shows 2 days left
      const title = screen.getByText("2 days left");
      const description = screen.getByText(/This Demonstration must be declared complete by/);
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();

      // dismiss the banner
      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      await userEvent.click(dismissButton);

      expect(title).not.toBeInTheDocument();
    });

    it("does not render the banner if completenessReviewDate is missing or phase is complete", () => {
      render(
        <TestProvider>
          <CompletenessPhase
            applicationId="app-123"
            applicationIntakeComplete={true}
            completenessReviewDate={undefined}
            completenessComplete={true}
            stateDeemedCompleteDate=""
            completenessDocuments={[]}
            setSelectedPhase={mockSetSelectedPhase}
          />
        </TestProvider>
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
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
    expect(screen.getByText("COMPLETENESS")).toBeInTheDocument();
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
              dateValue: new TZDate("2026-03-01", EST_TIMEZONE),
            },
            {
              dateType: "Federal Comment Period Start Date",
              dateValue: new TZDate("2026-03-02", EST_TIMEZONE),
            },
            {
              dateType: "Federal Comment Period End Date",
              dateValue: new TZDate("2026-04-01", EST_TIMEZONE),
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
});
