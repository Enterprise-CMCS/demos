import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  INITIAL_FORM_DATA,
  REQUEST_RESUBMISSION_DATE_FIELD_NAME,
  REQUEST_RESUBMISSION_DETAILS_FIELD_NAME,
  REQUEST_RESUBMISSION_DIALOG_TITLE,
  REQUEST_RESUBMISSION_SUBMIT_BUTTON_NAME,
  RESUBMISSION_ELIGIBLE_STATUSES,
  RESUBMISSION_REQUESTED_MESSAGE,
  RequestResubmissionDeliverableDialog,
  RequestResubmissionDeliverableDialogDeliverable,
  canRequestResubmission,
  formHasChanges,
  formIsValid,
  getNewDueDateValidationMessage,
} from "./RequestResubmissionDeliverableDialog";

import { DIALOG_CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";
import { TestProvider } from "test-utils/TestProvider";
import { DialogProvider } from "../DialogContext";
import { DELIVERABLE_DETAILS_QUERY } from "pages/deliverables/DeliverableDetailsManagementPage";

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

const TEST_DELIVERABLE: RequestResubmissionDeliverableDialogDeliverable = {
  id: "deliverable-1",
  dueDate: new Date("2026-02-12"),
};

const setup = (
  overrides?: Partial<RequestResubmissionDeliverableDialogDeliverable>
) => {
  const onClose = vi.fn();

  render(
    <TestProvider>
      <DialogProvider>
        <RequestResubmissionDeliverableDialog
          deliverable={{ ...TEST_DELIVERABLE, ...overrides }}
          onClose={onClose}
        />
      </DialogProvider>
    </TestProvider>
  );

  return { onClose };
};

describe("RequestResubmissionDeliverableDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutation.mockResolvedValue({});
  });

  it("renders with correct title", () => {
    setup();

    expect(
      screen.getByText(REQUEST_RESUBMISSION_DIALOG_TITLE)
    ).toBeInTheDocument();
  });

  it("renders required fields", () => {
    setup();

    expect(
      screen.getByTestId(REQUEST_RESUBMISSION_DATE_FIELD_NAME)
    ).toBeRequired();

    expect(
      screen.getByTestId(REQUEST_RESUBMISSION_DETAILS_FIELD_NAME)
    ).toBeRequired();
  });

  it("renders Submit and Cancel buttons", () => {
    setup();

    expect(
      screen.getByTestId(REQUEST_RESUBMISSION_SUBMIT_BUTTON_NAME)
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)
    ).toBeInTheDocument();
  });

  it("disables Submit until required fields are valid", async () => {
    const user = userEvent.setup();

    setup();

    const submit = screen.getByTestId(
      REQUEST_RESUBMISSION_SUBMIT_BUTTON_NAME
    );

    expect(submit).toBeDisabled();

    fireEvent.change(
      screen.getByTestId(REQUEST_RESUBMISSION_DATE_FIELD_NAME),
      {
        target: { value: "2026-03-01" },
      }
    );
    fireEvent.blur(screen.getByTestId(REQUEST_RESUBMISSION_DATE_FIELD_NAME));

    expect(submit).toBeDisabled();

    await user.type(
      screen.getByTestId(REQUEST_RESUBMISSION_DETAILS_FIELD_NAME),
      "Need new due date"
    );

    await waitFor(() => expect(submit).not.toBeDisabled());
  });

  it("keeps Submit disabled when date is before current due date", async () => {
    const user = userEvent.setup();

    setup();

    fireEvent.change(
      screen.getByTestId(REQUEST_RESUBMISSION_DATE_FIELD_NAME),
      {
        target: { value: "2026-01-01" },
      }
    );
    fireEvent.blur(screen.getByTestId(REQUEST_RESUBMISSION_DATE_FIELD_NAME));

    await user.type(
      screen.getByTestId(REQUEST_RESUBMISSION_DETAILS_FIELD_NAME),
      "Need time"
    );

    expect(
      screen.getByTestId(REQUEST_RESUBMISSION_SUBMIT_BUTTON_NAME)
    ).toBeDisabled();

    expect(
      screen.getByText(
        "New Due Date must be greater than or equal to Current Due Date."
      )
    ).toBeInTheDocument();
  });

  it("submits mutation, shows success toast, and closes dialog", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    fireEvent.change(
      screen.getByTestId(REQUEST_RESUBMISSION_DATE_FIELD_NAME),
      {
        target: { value: "2026-03-15" },
      }
    );
    fireEvent.blur(screen.getByTestId(REQUEST_RESUBMISSION_DATE_FIELD_NAME));

    await user.type(
      screen.getByTestId(REQUEST_RESUBMISSION_DETAILS_FIELD_NAME),
      "  Missing documentation  "
    );

    await user.click(
      screen.getByTestId(REQUEST_RESUBMISSION_SUBMIT_BUTTON_NAME)
    );

    await waitFor(() =>
      expect(mockMutation).toHaveBeenCalledTimes(1)
    );

    expect(mockMutation).toHaveBeenCalledWith({
      variables: {
        id: "deliverable-1",
        input: {
          newDueDate: "2026-03-15",
          details: "Missing documentation",
        },
      },
      refetchQueries: [{
        query: DELIVERABLE_DETAILS_QUERY,
        variables: { id: "deliverable-1" },
      }],
      awaitRefetchQueries: true,
    });

    expect(mockShowSuccess).toHaveBeenCalledWith(
      RESUBMISSION_REQUESTED_MESSAGE
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows error toast when mutation fails", async () => {
    const user = userEvent.setup();

    mockMutation.mockRejectedValueOnce(new Error("boom"));

    const { onClose } = setup();

    fireEvent.change(
      screen.getByTestId(REQUEST_RESUBMISSION_DATE_FIELD_NAME),
      {
        target: { value: "2026-03-15" },
      }
    );
    fireEvent.blur(screen.getByTestId(REQUEST_RESUBMISSION_DATE_FIELD_NAME));

    await user.type(
      screen.getByTestId(REQUEST_RESUBMISSION_DETAILS_FIELD_NAME),
      "Need resubmission"
    );

    await user.click(
      screen.getByTestId(REQUEST_RESUBMISSION_SUBMIT_BUTTON_NAME)
    );

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        "Unable to submit resubmission request."
      )
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it("opens cancellation confirmation when closing with unsaved changes", async () => {
    const user = userEvent.setup();

    const { onClose } = setup();

    await user.type(
      screen.getByTestId(REQUEST_RESUBMISSION_DETAILS_FIELD_NAME),
      "partial"
    );

    await user.click(
      screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)
    );

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes without confirmation when no changes exist", async () => {
    const user = userEvent.setup();

    const { onClose } = setup();

    await user.click(
      screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("canRequestResubmission", () => {
  it.each(["Past Due"] as const)(
    "returns true for %s",
    (status) => {
      expect(canRequestResubmission(status)).toBe(true);
      expect(RESUBMISSION_ELIGIBLE_STATUSES.has(status)).toBe(true);
    }
  );

  it.each(
    [
      "Upcoming",
      "Submitted",
      "Under CMS Review",
      "Accepted",
      "Approved",
      "Received and Filed",
    ] as const
  )("returns false for %s", (status) => {
    expect(canRequestResubmission(status)).toBe(false);
  });
});

describe("getNewDueDateValidationMessage", () => {
  const dueDate = new Date("2026-02-12");

  it("returns empty for blank", () => {
    expect(
      getNewDueDateValidationMessage("", dueDate)
    ).toBe("");
  });

  it("flags earlier dates", () => {
    expect(
      getNewDueDateValidationMessage("2026-01-01", dueDate)
    ).toBe(
      "New Due Date must be greater than or equal to Current Due Date."
    );
  });

  it("accepts equal date", () => {
    expect(
      getNewDueDateValidationMessage("2026-02-12", dueDate)
    ).toBe("");
  });

  it("accepts later date", () => {
    expect(
      getNewDueDateValidationMessage("2026-03-01", dueDate)
    ).toBe("");
  });
});

describe("formIsValid / formHasChanges", () => {
  const dueDate = new Date("2026-02-12");

  it("INITIAL_FORM_DATA is empty", () => {
    expect(INITIAL_FORM_DATA).toEqual({
      newDueDate: "",
      details: "",
    });
  });

  it("formHasChanges false initially", () => {
    expect(formHasChanges(INITIAL_FORM_DATA)).toBe(false);
  });

  it("formHasChanges true when touched", () => {
    expect(
      formHasChanges({
        ...INITIAL_FORM_DATA,
        newDueDate: "2026-03-01",
      })
    ).toBe(true);

    expect(
      formHasChanges({
        ...INITIAL_FORM_DATA,
        details: "x",
      })
    ).toBe(true);
  });

  it("formIsValid requires both fields", () => {
    expect(
      formIsValid(
        { newDueDate: "", details: "reason" },
        dueDate
      )
    ).toBe(false);

    expect(
      formIsValid(
        { newDueDate: "2026-03-01", details: "   " },
        dueDate
      )
    ).toBe(false);

    expect(
      formIsValid(
        { newDueDate: "2026-03-01", details: "reason" },
        dueDate
      )
    ).toBe(true);
  });
});
