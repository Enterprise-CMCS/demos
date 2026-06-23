import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  COMPLETE_REVIEW_DIALOG_TITLE,
  COMPLETE_REVIEW_ELIGIBLE_STATUSES,
  COMPLETE_REVIEW_STATUS_FIELD_NAME,
  COMPLETE_REVIEW_SUBMIT_BUTTON_NAME,
  CompleteReviewDeliverableDialog,
  CompleteReviewDeliverableDialogDeliverable,
  FINALIZE_REVIEW_ERROR_NOTICE,
  INITIAL_FORM_DATA,
  canCompleteReview,
  formHasChanges,
  formIsValid,
} from "./CompleteReviewDeliverableDialog";

import { DIALOG_CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";
import { TestProvider } from "test-utils/TestProvider";
import { DialogProvider } from "../DialogContext";
import { DELIVERABLE_DETAILS_QUERY } from "pages/deliverables/DeliverableDetailsManagementPage";
import { DELIVERABLE_REVIEW_COMPLETED_MESSAGE } from "util/messages";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const mockMutation = vi.fn();

vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");

  return {
    ...actual,
    useMutation: () => [mockMutation],
  };
});

const TEST_DELIVERABLE: CompleteReviewDeliverableDialogDeliverable = {
  id: "deliverable-1",
  stateDocuments: [
    {
      deliverableSubmissionAction: {},
    },
    {
      deliverableSubmissionAction: {},
    },
  ],
};

const setup = (overrides?: Partial<CompleteReviewDeliverableDialogDeliverable>) => {
  const onClose = vi.fn();

  render(
    <TestProvider>
      <DialogProvider>
        <CompleteReviewDeliverableDialog
          deliverable={{ ...TEST_DELIVERABLE, ...overrides }}
          onClose={onClose}
        />
      </DialogProvider>
    </TestProvider>
  );

  return { onClose };
};

describe("CompleteReviewDeliverableDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutation.mockResolvedValue({});
  });

  it("renders with the correct title", () => {
    setup();
    expect(screen.getByText(COMPLETE_REVIEW_DIALOG_TITLE)).toBeInTheDocument();
  });

  it("renders the required Status field", () => {
    setup();
    expect(screen.getByTestId(COMPLETE_REVIEW_STATUS_FIELD_NAME)).toBeRequired();
  });

  it("renders all three final status options", () => {
    setup();
    expect(
      screen.getByTestId(`${COMPLETE_REVIEW_STATUS_FIELD_NAME}-option-Accepted`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${COMPLETE_REVIEW_STATUS_FIELD_NAME}-option-Approved`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${COMPLETE_REVIEW_STATUS_FIELD_NAME}-option-Received and Filed`)
    ).toBeInTheDocument();
  });

  it("renders both Submit and Cancel buttons", () => {
    setup();
    expect(screen.getByTestId(COMPLETE_REVIEW_SUBMIT_BUTTON_NAME)).toBeInTheDocument();
    expect(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)).toBeInTheDocument();
  });

  it("disables Submit until a status is selected", async () => {
    const user = userEvent.setup();
    setup();
    const submit = screen.getByTestId(COMPLETE_REVIEW_SUBMIT_BUTTON_NAME);

    expect(submit).toBeDisabled();

    await user.selectOptions(screen.getByTestId(COMPLETE_REVIEW_STATUS_FIELD_NAME), "Approved");

    await waitFor(() => expect(submit).not.toBeDisabled());
  });

  it("submits the mutation, shows a success toast, and closes the dialog", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.selectOptions(screen.getByTestId(COMPLETE_REVIEW_STATUS_FIELD_NAME), "Accepted");

    await user.click(screen.getByTestId(COMPLETE_REVIEW_SUBMIT_BUTTON_NAME));

    await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));

    expect(mockMutation).toHaveBeenCalledWith({
      variables: {
        id: "deliverable-1",
        finalStatus: "Accepted",
      },
      refetchQueries: [{ query: DELIVERABLE_DETAILS_QUERY, variables: { id: "deliverable-1" } }],
      awaitRefetchQueries: true,
    });

    expect(mockShowSuccess).toHaveBeenCalledWith(DELIVERABLE_REVIEW_COMPLETED_MESSAGE);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast when the mutation fails", async () => {
    const user = userEvent.setup();
    mockMutation.mockRejectedValueOnce(new Error("boom"));

    const { onClose } = setup();

    await user.selectOptions(screen.getByTestId(COMPLETE_REVIEW_STATUS_FIELD_NAME), "Approved");
    await user.click(screen.getByTestId(COMPLETE_REVIEW_SUBMIT_BUTTON_NAME));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith("Unable to complete deliverable review.")
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it("opens the cancellation confirmation when closing with a selection", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.selectOptions(
      screen.getByTestId(COMPLETE_REVIEW_STATUS_FIELD_NAME),
      "Received and Filed"
    );
    await user.click(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME));

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes without confirmation when there are no changes", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.click(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("canCompleteReview", () => {
  const noExtensions: { status: "Requested" | "Approved" | "Denied" }[] = [];
  const openExtensions = [{ status: "Requested" as const }];
  const resolvedExtensions = [{ status: "Approved" as const }];

  it("returns true for Under CMS Review with no open extensions", () => {
    expect(canCompleteReview("Under CMS Review", noExtensions)).toBe(true);
    expect(canCompleteReview("Under CMS Review", resolvedExtensions)).toBe(true);
    expect(COMPLETE_REVIEW_ELIGIBLE_STATUSES.has("Under CMS Review")).toBe(true);
  });

  it("returns false when an extension is still Requested", () => {
    expect(canCompleteReview("Under CMS Review", openExtensions)).toBe(false);
  });

  it.each([
    "Upcoming",
    "Past Due",
    "Submitted",
    "Accepted",
    "Approved",
    "Received and Filed",
  ] as const)("returns false for %s", (status) => {
    expect(canCompleteReview(status, noExtensions)).toBe(false);
  });
});

describe("formIsValid / formHasChanges", () => {
  it("INITIAL_FORM_DATA has empty status", () => {
    expect(INITIAL_FORM_DATA).toEqual({ finalStatus: "" });
  });

  it("formHasChanges returns false for the initial state", () => {
    expect(formHasChanges(INITIAL_FORM_DATA)).toBe(false);
  });

  it("formHasChanges returns true once a status is chosen", () => {
    expect(formHasChanges({ finalStatus: "Approved" })).toBe(true);
  });

  it("formIsValid requires a final status", () => {
    expect(formIsValid({ finalStatus: "" })).toBe(false);
    expect(formIsValid({ finalStatus: "Accepted" })).toBe(true);
    expect(formIsValid({ finalStatus: "Approved" })).toBe(true);
    expect(formIsValid({ finalStatus: "Received and Filed" })).toBe(true);
  });

  describe("unsubmitted state documents", () => {
    it("displays an error notice when there are unsubmitted state documents", () => {
      setup({
        stateDocuments: [
          {
            deliverableSubmissionAction: {},
          },
          {
            deliverableSubmissionAction: null,
          },
        ],
      });

      const notice = screen.getByTestId(FINALIZE_REVIEW_ERROR_NOTICE.testId);
      expect(notice).toBeInTheDocument();
      expect(notice).toHaveTextContent(FINALIZE_REVIEW_ERROR_NOTICE.title);
      expect(notice).toHaveTextContent(FINALIZE_REVIEW_ERROR_NOTICE.description);
      expect(screen.queryByTestId(COMPLETE_REVIEW_STATUS_FIELD_NAME)).not.toBeInTheDocument();
    });

    it("does not display an error notice when all state documents have been submitted", () => {
      setup({
        stateDocuments: [
          {
            deliverableSubmissionAction: {},
          },
          {
            deliverableSubmissionAction: {},
          },
        ],
      });

      expect(screen.queryByTestId(FINALIZE_REVIEW_ERROR_NOTICE.testId)).not.toBeInTheDocument();
      expect(screen.getByTestId(COMPLETE_REVIEW_SUBMIT_BUTTON_NAME)).toBeInTheDocument();
      expect(screen.getByTestId(COMPLETE_REVIEW_STATUS_FIELD_NAME)).toBeInTheDocument();
    });
  });
});
