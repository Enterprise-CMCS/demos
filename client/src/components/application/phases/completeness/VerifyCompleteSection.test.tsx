import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const showDeclareIncompleteDialog = vi.fn((callback) => {
  callback();
});
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showDeclareIncompleteDialog,
  }),
}));

const mockSetApplicationDates = vi.fn(() => Promise.resolve());
vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDates: () => ({ setApplicationDates: mockSetApplicationDates }),
}));

const mockCompletePhase = vi.fn();
const mockDeclareCompletenessPhaseIncomplete = vi.fn();
vi.mock("../../phase-status/phaseCompletionQueries", () => ({
  useCompletePhase: vi.fn(() => ({ completePhase: mockCompletePhase })),
  useDeclareCompletenessPhaseIncomplete: vi.fn(() => ({
    declareCompletenessPhaseIncomplete: mockDeclareCompletenessPhaseIncomplete,
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
  const mockSetSelectedPhase = vi.fn();
  const defaultProps = {
    applicationId: "app-123",
    stateDeemedCompleteDate: "",
    completenessPhaseStatus: "Started" as PhaseStatus,
    completenessDocuments: [] as ApplicationWorkflowDocument[],
    applicationIntakeComplete: true,
    setSelectedPhase: mockSetSelectedPhase,
  };

  const setup = (props: Partial<typeof defaultProps> = {}) => {
    return render(
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

  describe("Finish button", () => {
    it("is disabled when required docs are missing", () => {
      setup({ completenessDocuments: [] });
      expect(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME)).toBeDisabled();
    });

    it("is enabled when required docs and dates exist", () => {
      setup({
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "2026-02-05",
      });
      expect(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME)).toBeEnabled();
    });

    it("becomes enabled when required documents are added via props", () => {
      const { rerender } = setup({
        stateDeemedCompleteDate: "2026-02-05",
        completenessDocuments: [],
      });
      expect(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME)).toBeDisabled();

      rerender(
        <TestProvider>
          <VerifyCompleteSection
            {...defaultProps}
            stateDeemedCompleteDate="2026-02-05"
            completenessDocuments={[mockCompletenessDoc, mockInternalDoc]}
          />
        </TestProvider>
      );
      expect(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME)).toBeEnabled();
    });

    it("calls completePhase and selects next phase when clicked", async () => {
      const user = userEvent.setup();
      setup({
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "2026-02-05",
      });
      await user.click(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME));
      expect(mockCompletePhase).toHaveBeenCalledWith({
        applicationId: "app-123",
        phaseName: "Completeness",
      });
      expect(mockSetSelectedPhase).toHaveBeenCalledWith("Federal Comment");
    });

    it("saves exact date values without timezone shift when clicked", async () => {
      mockSetApplicationDates.mockClear();
      const user = userEvent.setup();
      setup({
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "2026-03-05",
      });
      await user.click(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME));
      expect(mockSetApplicationDates).toHaveBeenCalledWith({
        applicationId: "app-123",
        applicationDates: [
          { dateType: "State Application Deemed Complete", dateValue: "2026-03-05" },
          { dateType: "Federal Comment Period Start Date", dateValue: "2026-03-06" },
          { dateType: "Federal Comment Period End Date", dateValue: "2026-04-05" },
        ],
      });
    });
  });

  describe("Declare Incomplete button", () => {
    it("is disabled when completeness is Completed", () => {
      setup({ completenessPhaseStatus: "Completed" });
      expect(screen.getByTestId(COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME)).toBeDisabled();
    });

    it("calls declareCompletenessPhaseIncomplete via dialog when clicked", async () => {
      const user = userEvent.setup();
      setup({
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "2026-02-05",
      });
      await user.click(screen.getByTestId(COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME));
      expect(mockDeclareCompletenessPhaseIncomplete).toHaveBeenCalledWith("app-123");
    });
  });

  describe("Date pickers", () => {
    it("clears all date pickers when phase is Incomplete even if a Completeness Letter exists", () => {
      setup({
        completenessPhaseStatus: "Incomplete",
        completenessDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "",
      });
      expect(screen.getByTestId(STATE_DEEMED_COMPLETE_DATEPICKER_NAME)).toHaveValue("");
      expect(screen.getByTestId(FEDERAL_COMMENT_START_DATEPICKER_NAME)).toHaveValue("");
      expect(screen.getByTestId(FEDERAL_COMMENT_END_DATEPICKER_NAME)).toHaveValue("");
    });

    it("clears a user-typed date when Declare Incomplete is clicked and phase becomes Incomplete", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TestProvider>
          <VerifyCompleteSection
            {...defaultProps}
            completenessDocuments={[mockCompletenessDoc, mockInternalDoc]}
          />
        </TestProvider>
      );

      const dateInput = screen.getByTestId(STATE_DEEMED_COMPLETE_DATEPICKER_NAME);
      fireEvent.change(dateInput, { target: { value: "2026-03-15" } });
      expect(dateInput).toHaveValue("2026-03-15");

      await user.click(screen.getByTestId(COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME));

      // Apollo refetches after the mutation and the server sets status to Incomplete +
      // clears DB dates. Simulate that prop update here.
      rerender(
        <TestProvider>
          <VerifyCompleteSection
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
  });
});
