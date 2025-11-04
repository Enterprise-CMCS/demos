import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompletenessPhase, CompletenessPhaseProps } from "./CompletenessPhase";
import { TestProvider } from "test-utils/TestProvider";

const COMPLETENESS_SUBMIT_DATE = "2025-10-15";
const START_FED_COMMENT_DATE = "2025-10-01";
const END_FED_COMMENT_DATE = "2025-10-30";

const mockSetPhaseStatus = vi.fn(() => Promise.resolve({ data: {} }));
const mockMutate = vi.fn(() => Promise.resolve({ data: {} }));

vi.mock("../phase-status/phaseStatusQueries", () => ({
  useSetPhaseStatus: vi.fn(() => ({
    setPhaseStatus: mockSetPhaseStatus,
    data: null,
    loading: false,
    error: null,
  })),
}));

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useMutation: vi.fn(() => [mockMutate, { loading: false, error: null }]),
  };
});

const renderWithProviders = (ui: React.ReactElement) => render(<TestProvider>{ui}</TestProvider>);

const buildComponent = (override: Partial<CompletenessPhaseProps> = {}) => {
  const defaultProps: CompletenessPhaseProps = {
    applicationId: "app-123",
    fedCommentStartDate: START_FED_COMMENT_DATE,
    fedCommentEndDate: END_FED_COMMENT_DATE,
    stateDeemedCompleteDate: "",
    applicationCompletenessDocument: [
      {
        id: "8675309B",
        name: "Completed Completeness letter of Completeness",
        description: "YOLO FLIM-FLAM FOMO slabba-labba-ding-dong-do 🚀",
        documentType: "Application Completeness Letter",
        createdAt: new Date(END_FED_COMMENT_DATE),
      },
    ],
  };

  return <CompletenessPhase {...defaultProps} {...override} />;
};

const NOTICE_TEXT = /must be declared complete/i;

describe("CompletenessPhase", () => {
  it("hides the alert when a completion date already exists", () => {
    renderWithProviders(
      buildComponent({
        stateDeemedCompleteDate: COMPLETENESS_SUBMIT_DATE,
      })
    );

    expect(screen.queryByText(NOTICE_TEXT)).not.toBeInTheDocument();
  });

  it("dismisses the alert after the user sets the completion date", async () => {
    renderWithProviders(buildComponent());

    expect(screen.getByText(NOTICE_TEXT)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/State Application Deemed Complete/i), {
      target: { value: COMPLETENESS_SUBMIT_DATE },
    });

    await waitFor(() => {
      expect(screen.queryByText(NOTICE_TEXT)).not.toBeInTheDocument();
    });
  });

  it("declares the phase incomplete and the buttons work right plus requesting the mutation", async () => {
    renderWithProviders(buildComponent());
    const user = userEvent.setup();
    const declareIncompleteOpenDialogButton = await screen.findByRole("button", {
      name: /declare-incomplete/i,
    });
    await user.click(declareIncompleteOpenDialogButton);
    const prepopulatedCommonIncompleteSelectReasons = await screen.findByLabelText(/Reason/i);
    await user.selectOptions(prepopulatedCommonIncompleteSelectReasons, "missing-documentation");
    const submitDeclareCompleteAfterSelectingReason = await screen.findByRole("button", {
      name: /declare-incomplete-confirm/i,
    });
    expect(submitDeclareCompleteAfterSelectingReason).not.toBeDisabled();
    await user.click(submitDeclareCompleteAfterSelectingReason);

    await user.selectOptions(prepopulatedCommonIncompleteSelectReasons, "other");
    const otherReasonInput = await screen.findByLabelText(/Other/i);
    expect(otherReasonInput).toBeInTheDocument();
    expect(submitDeclareCompleteAfterSelectingReason).to.toBeDisabled();
    await user.type(otherReasonInput, "Additional reason text");
    expect(submitDeclareCompleteAfterSelectingReason).not.toBeDisabled();
    await user.click(submitDeclareCompleteAfterSelectingReason);

    await waitFor(() => {
      expect(mockSetPhaseStatus).toHaveBeenCalled();
    });
  });
});
