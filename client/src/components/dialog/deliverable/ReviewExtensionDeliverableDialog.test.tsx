import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  INITIAL_FORM_DATA,
  REVIEW_EXTENSION_DETAILS_FIELD_NAME,
  REVIEW_EXTENSION_DIALOG_TITLE,
  REVIEW_EXTENSION_EXPIRED_NOTICE_NAME,
  REVIEW_EXTENSION_NEW_DATE_FIELD_NAME,
  REVIEW_EXTENSION_STATUS_FIELD_NAME,
  REVIEW_EXTENSION_SUBMIT_BUTTON_NAME,
  ReviewExtensionDeliverableDialog,
  ReviewExtensionDeliverableDialogDeliverable,
  STATE_REQUESTED_DATE_EXPIRED_MESSAGE,
  formHasChanges,
  formIsValid,
  getNewDateValidationMessage,
  isStateRequestedDateExpired,
} from "./ReviewExtensionDeliverableDialog";
import { DIALOG_CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";
import { TestProvider } from "test-utils/TestProvider";
import { DELIVERABLE_DETAILS_QUERY } from "pages/deliverables/DeliverableDetailsManagementPage";
import { DELIVERABLE_EXTENSION_REVIEW_SUBMITTED_MESSAGE } from "util/messages";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const mockApproveMutation = vi.fn();
const mockDenyMutation = vi.fn();

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
    useMutation: vi.fn((document: { definitions: { name?: { value: string } }[] }) => {
      const opName = document.definitions[0]?.name?.value ?? "";
      if (opName === "ApproveDeliverableExtension") return [mockApproveMutation];
      if (opName === "DenyDeliverableExtension") return [mockDenyMutation];
      return [vi.fn()];
    }),
  };
});

const FUTURE_REQUESTED_DATE = new Date("2099-04-02");
const PAST_REQUESTED_DATE = new Date("2020-01-02");

const buildDeliverable = (
  overrides?: Partial<ReviewExtensionDeliverableDialogDeliverable["extensionRequest"]>
): ReviewExtensionDeliverableDialogDeliverable => ({
  id: "deliverable-1",
  extensionRequest: {
    id: "extension-1",
    reasonCode: "Technical Difficulties",
    reasonDetails: "Our state is experiencing a delay in data collection.",
    initialDueDateAtRequest: new Date("2099-03-17"),
    originalDateRequested: FUTURE_REQUESTED_DATE,
    ...overrides,
  },
});

const setup = (
  overrides?: Partial<ReviewExtensionDeliverableDialogDeliverable["extensionRequest"]>
) => {
  const onClose = vi.fn();
  const deliverable = buildDeliverable(overrides);
  render(
    <TestProvider>
      <ReviewExtensionDeliverableDialog deliverable={deliverable} onClose={onClose} />
    </TestProvider>
  );
  return { onClose, deliverable };
};

describe("ReviewExtensionDeliverableDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApproveMutation.mockResolvedValue({});
    mockDenyMutation.mockResolvedValue({});
  });

  it("renders the dialog title", () => {
    setup();
    expect(screen.getByText(REVIEW_EXTENSION_DIALOG_TITLE)).toBeInTheDocument();
  });

  it("renders the extension request details", () => {
    setup();
    expect(screen.getByText("Technical Difficulties")).toBeInTheDocument();
    expect(
      screen.getByText("Our state is experiencing a delay in data collection.")
    ).toBeInTheDocument();
  });

  it("renders Submit and Cancel buttons", () => {
    setup();
    expect(screen.getByTestId(REVIEW_EXTENSION_SUBMIT_BUTTON_NAME)).toBeInTheDocument();
    expect(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)).toBeInTheDocument();
  });

  it("disables Submit until a decision is selected", () => {
    setup();
    expect(screen.getByTestId(REVIEW_EXTENSION_SUBMIT_BUTTON_NAME)).toBeDisabled();
  });

  it("does not show the expired notice when the requested date is in the future", () => {
    setup();
    expect(screen.queryByTestId(REVIEW_EXTENSION_EXPIRED_NOTICE_NAME)).not.toBeInTheDocument();
  });

  it("shows the expired notice when the requested date has passed", () => {
    setup({ originalDateRequested: PAST_REQUESTED_DATE });
    expect(screen.getByTestId(REVIEW_EXTENSION_EXPIRED_NOTICE_NAME)).toHaveTextContent(
      STATE_REQUESTED_DATE_EXPIRED_MESSAGE
    );
  });

  it("blocks submission when 'Approved' is selected but the requested date is expired", async () => {
    const user = userEvent.setup();
    setup({ originalDateRequested: PAST_REQUESTED_DATE });
    await user.selectOptions(
      screen.getByTestId(REVIEW_EXTENSION_STATUS_FIELD_NAME),
      "Approved"
    );
    expect(screen.getByTestId(REVIEW_EXTENSION_SUBMIT_BUTTON_NAME)).toBeDisabled();
  });

  it("submits an approval without a new date", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.selectOptions(
      screen.getByTestId(REVIEW_EXTENSION_STATUS_FIELD_NAME),
      "Approved"
    );
    await user.click(screen.getByTestId(REVIEW_EXTENSION_SUBMIT_BUTTON_NAME));

    await waitFor(() => expect(mockApproveMutation).toHaveBeenCalledTimes(1));
    expect(mockApproveMutation).toHaveBeenCalledWith({
      variables: {
        deliverableId: "deliverable-1",
        input: { deliverableExtensionId: "extension-1" },
      },
      refetchQueries: [
        { query: DELIVERABLE_DETAILS_QUERY, variables: { id: "deliverable-1" } },
      ],
      awaitRefetchQueries: true,
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(DELIVERABLE_EXTENSION_REVIEW_SUBMITTED_MESSAGE);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("requires a New Date when 'Approve With New Date' is selected", async () => {
    const user = userEvent.setup();
    setup();
    await user.selectOptions(
      screen.getByTestId(REVIEW_EXTENSION_STATUS_FIELD_NAME),
      "Approve With New Date"
    );
    expect(screen.getByTestId(REVIEW_EXTENSION_SUBMIT_BUTTON_NAME)).toBeDisabled();
    expect(screen.getByTestId(REVIEW_EXTENSION_NEW_DATE_FIELD_NAME)).toBeInTheDocument();
  });

  it("submits 'Approve With New Date' with a future date", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.selectOptions(
      screen.getByTestId(REVIEW_EXTENSION_STATUS_FIELD_NAME),
      "Approve With New Date"
    );
    fireEvent.change(screen.getByTestId(REVIEW_EXTENSION_NEW_DATE_FIELD_NAME), {
      target: { value: "2099-03-25" },
    });
    fireEvent.blur(screen.getByTestId(REVIEW_EXTENSION_NEW_DATE_FIELD_NAME));
    await user.click(screen.getByTestId(REVIEW_EXTENSION_SUBMIT_BUTTON_NAME));

    await waitFor(() => expect(mockApproveMutation).toHaveBeenCalledTimes(1));
    expect(mockApproveMutation).toHaveBeenCalledWith({
      variables: {
        deliverableId: "deliverable-1",
        input: { deliverableExtensionId: "extension-1", newDueDate: "2099-03-25" },
      },
      refetchQueries: [
        { query: DELIVERABLE_DETAILS_QUERY, variables: { id: "deliverable-1" } },
      ],
      awaitRefetchQueries: true,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("requires denial details when 'Denied' is selected", async () => {
    const user = userEvent.setup();
    setup();
    await user.selectOptions(
      screen.getByTestId(REVIEW_EXTENSION_STATUS_FIELD_NAME),
      "Denied"
    );
    expect(screen.getByTestId(REVIEW_EXTENSION_SUBMIT_BUTTON_NAME)).toBeDisabled();
    expect(screen.getByTestId(REVIEW_EXTENSION_DETAILS_FIELD_NAME)).toBeRequired();
  });

  it("submits a denial with details", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.selectOptions(
      screen.getByTestId(REVIEW_EXTENSION_STATUS_FIELD_NAME),
      "Denied"
    );
    await user.type(
      screen.getByTestId(REVIEW_EXTENSION_DETAILS_FIELD_NAME),
      "  Here is a reason.  "
    );
    await user.click(screen.getByTestId(REVIEW_EXTENSION_SUBMIT_BUTTON_NAME));

    await waitFor(() => expect(mockDenyMutation).toHaveBeenCalledTimes(1));
    expect(mockDenyMutation).toHaveBeenCalledWith({
      variables: {
        deliverableId: "deliverable-1",
        input: { deliverableExtensionId: "extension-1", details: "Here is a reason." },
      },
      refetchQueries: [
        { query: DELIVERABLE_DETAILS_QUERY, variables: { id: "deliverable-1" } },
      ],
      awaitRefetchQueries: true,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast when the approval mutation fails", async () => {
    const user = userEvent.setup();
    mockApproveMutation.mockRejectedValueOnce(new Error("boom"));
    const { onClose } = setup();
    await user.selectOptions(
      screen.getByTestId(REVIEW_EXTENSION_STATUS_FIELD_NAME),
      "Approved"
    );
    await user.click(screen.getByTestId(REVIEW_EXTENSION_SUBMIT_BUTTON_NAME));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith("Unable to submit extension review.")
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("prompts the cancellation confirmation when closing with unsaved changes", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.selectOptions(
      screen.getByTestId(REVIEW_EXTENSION_STATUS_FIELD_NAME),
      "Denied"
    );
    await user.click(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME));

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes without confirmation when there are no unsaved changes", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.click(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("isStateRequestedDateExpired", () => {
  it("returns true when the requested date is in the past", () => {
    expect(isStateRequestedDateExpired(new Date("2020-01-01"))).toBe(true);
  });

  it("returns false when the requested date is in the future", () => {
    expect(isStateRequestedDateExpired(new Date("2099-01-01"))).toBe(false);
  });
});

describe("getNewDateValidationMessage", () => {
  it("returns empty for an empty value", () => {
    expect(getNewDateValidationMessage("")).toBe("");
  });

  it("flags dates not after today", () => {
    expect(getNewDateValidationMessage("2020-01-01")).toBe("New Date must be after today.");
  });

  it("accepts a future date", () => {
    expect(getNewDateValidationMessage("2099-01-01")).toBe("");
  });
});

describe("formIsValid / formHasChanges", () => {
  it("INITIAL_FORM_DATA has empty fields", () => {
    expect(INITIAL_FORM_DATA).toEqual({ decision: "", newDate: "", denialDetails: "" });
  });

  it("formHasChanges returns false when initial", () => {
    expect(formHasChanges(INITIAL_FORM_DATA)).toBe(false);
  });

  it("formHasChanges returns true when any field has been touched", () => {
    expect(formHasChanges({ ...INITIAL_FORM_DATA, decision: "Denied" })).toBe(true);
    expect(formHasChanges({ ...INITIAL_FORM_DATA, newDate: "2099-01-01" })).toBe(true);
    expect(formHasChanges({ ...INITIAL_FORM_DATA, denialDetails: "x" })).toBe(true);
  });

  it("formIsValid requires a decision", () => {
    expect(formIsValid(INITIAL_FORM_DATA, false)).toBe(false);
  });

  it("formIsValid rejects 'Approved' when expired", () => {
    expect(
      formIsValid({ decision: "Approved", newDate: "", denialDetails: "" }, true)
    ).toBe(false);
    expect(
      formIsValid({ decision: "Approved", newDate: "", denialDetails: "" }, false)
    ).toBe(true);
  });

  it("formIsValid requires a valid future date for 'Approve With New Date'", () => {
    expect(
      formIsValid(
        { decision: "Approve With New Date", newDate: "", denialDetails: "" },
        false
      )
    ).toBe(false);
    expect(
      formIsValid(
        { decision: "Approve With New Date", newDate: "2020-01-01", denialDetails: "" },
        false
      )
    ).toBe(false);
    expect(
      formIsValid(
        { decision: "Approve With New Date", newDate: "2099-01-01", denialDetails: "" },
        false
      )
    ).toBe(true);
  });

  it("formIsValid requires non-empty details for 'Denied'", () => {
    expect(
      formIsValid({ decision: "Denied", newDate: "", denialDetails: "   " }, false)
    ).toBe(false);
    expect(
      formIsValid({ decision: "Denied", newDate: "", denialDetails: "reason" }, false)
    ).toBe(true);
  });
});
