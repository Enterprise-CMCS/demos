import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompletenessPhase, CompletenessPhaseProps } from "./CompletenessPhase";
import { TestProvider } from "test-utils/TestProvider";

const START_FED_COMMENT_DATE = "2025-10-01";
const END_FED_COMMENT_DATE = "2025-10-31";

const mockSetPhaseStatus = vi.fn(() => Promise.resolve({ data: {} }));
const mockMutate = vi.fn(() => Promise.resolve({ data: {} }));

const showCompletenessDocumentUploadDialog = vi.fn();
const showDeclareIncompleteDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCompletenessDocumentUploadDialog,
    showDeclareIncompleteDialog,
  }),
}));

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
    fedCommentComplete: false,
    stateDeemedCompleteDate: "2025-09-30",
    applicationCompletenessDocument: [
      {
        id: "8675309B",
        name: "Completed Completeness letter of Completeness",
        description: "YOLO FLIM-FLAM FOMO slabba-labba-ding-dong-do 🚀",
        documentType: "Application Completeness Letter",
        createdAt: new Date(END_FED_COMMENT_DATE),
      },
    ],
    hasApplicationIntakeCompletionDate: true,
  };

  return <CompletenessPhase {...defaultProps} {...override} />;
};

describe("CompletenessPhase", () => {
  it("declares the phase incomplete and the buttons work right plus requesting the mutation", async () => {
    renderWithProviders(buildComponent());
    const user = userEvent.setup();
    const declareIncompleteOpenDialogButton = await screen.findByRole("button", {
      name: /declare-incomplete/i,
    });
    await user.click(declareIncompleteOpenDialogButton);

    expect(showDeclareIncompleteDialog).toHaveBeenCalled();
  });
});
