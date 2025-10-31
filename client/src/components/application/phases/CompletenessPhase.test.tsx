import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CompletenessPhase, CompletenessPhaseProps } from "./CompletenessPhase";
import { TestProvider } from "test-utils/TestProvider";

const mockMutate = vi.fn();
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const COMPLETENESS_SUBMIT_DATE = "2025-10-15";
const START_FED_COMMENT_DATE = "2025-10-01";
const END_FED_COMMENT_DATE = "2025-10-30";

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual<typeof import("@apollo/client")>("@apollo/client");
  return {
    ...actual,
    useApolloClient: () => ({ mutate: mockMutate }),
  };
});

vi.mock("components/toast", () => {
  return {
    useToast: () => ({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
      showInfo: vi.fn(),
      showWarning: vi.fn(),
      addToast: vi.fn(),
      removeToast: vi.fn(),
      toasts: [],
    }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("components/input/select/Select", () => {
  return {
    Select: ({
      id,
      label,
      options,
      value,
      onSelect,
    }: {
      id: string;
      label: string;
      options: { value: string; label: string }[];
      value: string;
      onSelect: (value: string) => void;
    }) => (
      <label htmlFor={id}>
        {label}
        <select
          id={id}
          aria-label={label}
          value={value}
          onChange={(event) => onSelect(event.target.value)}
        >
          <option value="">Select</option>
          {options.map((option: { value: string; label: string }) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    ),
  };
});

const renderWithProviders = (ui: React.ReactElement) =>
  render(<TestProvider>{ui}</TestProvider>);

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
const DATE_TOAST = "Dates saved successfully.";
const STATUS_TOAST = "Dates and status saved successfully.";

beforeEach(() => {
  mockMutate.mockReset().mockResolvedValue({});
  mockShowSuccess.mockReset();
  mockShowError.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

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
    const declareIncompleteOpenDialogButton = await screen.findByRole("button", { name: /declare-incomplete/i });
    await user.click(declareIncompleteOpenDialogButton);
    const prepopulatedCommonIncompleteSelectReasons = await screen.findByLabelText(/Reason/i);
    await user.selectOptions(prepopulatedCommonIncompleteSelectReasons, "missing-documentation");
    const submitDeclareCompleteAfterSelectingReason = await screen.findByRole("button", { name: /declare-incomplete-confirm/i });
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
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              phaseStatus: "Incomplete",
            }),
          }),
        })
      );
    });
  });

  it("emits the save toast when the user saves for later", async () => {
    renderWithProviders(buildComponent());
    fireEvent.change(screen.getByLabelText(/State Application Deemed Complete/i), {
      target: { value: COMPLETENESS_SUBMIT_DATE },
    });

    fireEvent.click(screen.getByRole("button", { name: "save-for-later" }));

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(DATE_TOAST);
    });
    expect(mockShowSuccess).toHaveBeenCalledTimes(1);
  });

  it("only emits the status toast when finishing the completeness phase", async () => {
    renderWithProviders(buildComponent());

    fireEvent.change(screen.getByLabelText(/State Application Deemed Complete/i), {
      target: { value: COMPLETENESS_SUBMIT_DATE },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Finish/i })).toBeEnabled();
    });

    mockShowSuccess.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "finish-completeness" }));

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(STATUS_TOAST);
    });

    expect(mockShowSuccess).toHaveBeenCalledTimes(1);
    expect(mockShowSuccess).not.toHaveBeenCalledWith(DATE_TOAST);
  });
});
