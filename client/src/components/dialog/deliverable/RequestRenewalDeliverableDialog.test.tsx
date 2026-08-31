import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  RENEWAL_ELIGIBLE_STATUSES,
  INITIAL_FORM_DATA,
  REQUEST_RENEWAL_DATE_FIELD_NAME,
  REQUEST_RENEWAL_DETAILS_FIELD_NAME,
  REQUEST_RENEWAL_DIALOG_TITLE,
  REQUEST_RENEWAL_REASON_FIELD_NAME,
  REQUEST_RENEWAL_SUBMIT_BUTTON_NAME,
  RequestRenewalDeliverableDialog,
  RequestRenewalDeliverableDialogDeliverable,
  canRequestRenewal,
  formHasChanges,
  formIsValid,
  getRenewalDateValidationMessage,
} from "./RequestRenewalDeliverableDialog";
import { DIALOG_CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";
import { TestProvider } from "test-utils/TestProvider";
import { DELIVERABLE_DETAILS_QUERY } from "pages/deliverables/DeliverableDetailsManagementPage";
import { DELIVERABLE_RENEWAL_REQUESTED_MESSAGE } from "util/messages";

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

const TEST_DELIVERABLE: RequestRenewalDeliverableDialogDeliverable = {
  id: "deliverable-1",
  dueDate: new Date("2026-02-12"),
};

const setup = (overrides?: Partial<RequestRenewalDeliverableDialogDeliverable>) => {
  const onClose = vi.fn();
  const deliverable = { ...TEST_DELIVERABLE, ...overrides };

  render(
    <TestProvider>
      <RequestRenewalDeliverableDialog deliverable={deliverable} onClose={onClose} />
    </TestProvider>
  );

  return { onClose };
};

describe("RequestRenewalDeliverableDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutation.mockResolvedValue({});
  });

  it("renders with the correct title", () => {
    setup();
    expect(screen.getByText(REQUEST_RENEWAL_DIALOG_TITLE)).toBeInTheDocument();
  });

  it("renders the required Renewal Date, Request Reason, and Details fields", () => {
    setup();
    expect(screen.getByTestId(REQUEST_RENEWAL_DATE_FIELD_NAME)).toBeRequired();
    expect(screen.getByTestId(REQUEST_RENEWAL_REASON_FIELD_NAME)).toBeRequired();
    expect(screen.getByTestId(REQUEST_RENEWAL_DETAILS_FIELD_NAME)).toBeRequired();
  });

  it("renders the request reason options", () => {
    setup();
    expect(
      screen.getByTestId(`${REQUEST_RENEWAL_REASON_FIELD_NAME}-option-COVID-19`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${REQUEST_RENEWAL_REASON_FIELD_NAME}-option-Technical Difficulties`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${REQUEST_RENEWAL_REASON_FIELD_NAME}-option-Other`)
    ).toBeInTheDocument();
  });

  it("renders both Submit and Cancel buttons", () => {
    setup();
    expect(screen.getByTestId(REQUEST_RENEWAL_SUBMIT_BUTTON_NAME)).toBeInTheDocument();
    expect(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)).toBeInTheDocument();
  });

  it("disables Submit until all required fields are valid", async () => {
    const user = userEvent.setup();
    setup();
    const submit = screen.getByTestId(REQUEST_RENEWAL_SUBMIT_BUTTON_NAME);

    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId(REQUEST_RENEWAL_DATE_FIELD_NAME), {
      target: { value: "2026-03-15" },
    });
    expect(submit).toBeDisabled();

    await user.selectOptions(screen.getByTestId(REQUEST_RENEWAL_REASON_FIELD_NAME), "Other");
    expect(submit).toBeDisabled();

    await user.type(screen.getByTestId(REQUEST_RENEWAL_DETAILS_FIELD_NAME), "Need more time");
    await waitFor(() => expect(submit).not.toBeDisabled());
  });

  it("keeps Submit disabled when the renewal date is not after the current due date", async () => {
    const user = userEvent.setup();
    setup();

    fireEvent.change(screen.getByTestId(REQUEST_RENEWAL_DATE_FIELD_NAME), {
      target: { value: "2026-02-12" }, // equal to due date — invalid
    });
    await user.selectOptions(screen.getByTestId(REQUEST_RENEWAL_REASON_FIELD_NAME), "COVID-19");
    await user.type(screen.getByTestId(REQUEST_RENEWAL_DETAILS_FIELD_NAME), "Delayed");

    expect(screen.getByTestId(REQUEST_RENEWAL_SUBMIT_BUTTON_NAME)).toBeDisabled();
    expect(
      screen.getByText("Renewal Date must be after the current Due Date.")
    ).toBeInTheDocument();
  });

  it("allows renewal dates beyond the demonstration expiration", async () => {
    const user = userEvent.setup();
    setup();

    fireEvent.change(screen.getByTestId(REQUEST_RENEWAL_DATE_FIELD_NAME), {
      target: { value: "2027-01-15" },
    });
    await user.selectOptions(screen.getByTestId(REQUEST_RENEWAL_REASON_FIELD_NAME), "Other");
    await user.type(screen.getByTestId(REQUEST_RENEWAL_DETAILS_FIELD_NAME), "x");

    await waitFor(() =>
      expect(screen.getByTestId(REQUEST_RENEWAL_SUBMIT_BUTTON_NAME)).not.toBeDisabled()
    );
  });

  it("submits the mutation, shows a success toast, and closes the dialog", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    fireEvent.change(screen.getByTestId(REQUEST_RENEWAL_DATE_FIELD_NAME), {
      target: { value: "2026-03-15" },
    });
    await user.selectOptions(
      screen.getByTestId(REQUEST_RENEWAL_REASON_FIELD_NAME),
      "Technical Difficulties"
    );
    await user.type(
      screen.getByTestId(REQUEST_RENEWAL_DETAILS_FIELD_NAME),
      "  Vendor portal outage  "
    );

    await user.click(screen.getByTestId(REQUEST_RENEWAL_SUBMIT_BUTTON_NAME));

    await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
    expect(mockMutation).toHaveBeenCalledWith({
      variables: {
        deliverableId: "deliverable-1",
        input: {
          reason: "Technical Difficulties",
          details: "Vendor portal outage",
          requestedDueDate: "2026-03-15",
        },
      },
      refetchQueries: [{ query: DELIVERABLE_DETAILS_QUERY, variables: { id: "deliverable-1" } }],
      awaitRefetchQueries: true,
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(DELIVERABLE_RENEWAL_REQUESTED_MESSAGE);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast when the mutation fails", async () => {
    const user = userEvent.setup();
    mockMutation.mockRejectedValueOnce(new Error("boom"));
    const { onClose } = setup();

    fireEvent.change(screen.getByTestId(REQUEST_RENEWAL_DATE_FIELD_NAME), {
      target: { value: "2026-03-15" },
    });
    await user.selectOptions(screen.getByTestId(REQUEST_RENEWAL_REASON_FIELD_NAME), "Other");
    await user.type(screen.getByTestId(REQUEST_RENEWAL_DETAILS_FIELD_NAME), "Need more time");

    await user.click(screen.getByTestId(REQUEST_RENEWAL_SUBMIT_BUTTON_NAME));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith("Unable to submit renewal request.")
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("opens the cancellation confirmation when closing with unsaved changes", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.type(screen.getByTestId(REQUEST_RENEWAL_DETAILS_FIELD_NAME), "partial");
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

describe("canRequestRenewal", () => {
  it.each(["Upcoming", "Past Due"] as const)(
    "returns true for %s when there are no open renewal requests",
    (status) => {
      expect(canRequestRenewal(status, [])).toBe(true);
      expect(RENEWAL_ELIGIBLE_STATUSES.has(status)).toBe(true);
    }
  );

  it.each(["Submitted", "Under CMS Review", "Accepted", "Approved", "Received and Filed"] as const)(
    "returns false for %s",
    (status) => {
      expect(canRequestRenewal(status, [])).toBe(false);
    }
  );

  it("returns false when a renewal is already in Requested status", () => {
    expect(canRequestRenewal("Upcoming", [{ status: "Requested" }])).toBe(false);
    expect(canRequestRenewal("Past Due", [{ status: "Requested" }])).toBe(false);
  });

  it("returns true when prior renewals are no longer open", () => {
    expect(canRequestRenewal("Upcoming", [{ status: "Approved" }])).toBe(true);
    expect(canRequestRenewal("Past Due", [{ status: "Denied" }, { status: "Withdrawn" }])).toBe(
      true
    );
  });
});

describe("getRenewalDateValidationMessage", () => {
  const dueDate = new Date("2026-02-12");

  it("returns empty for an empty value", () => {
    expect(getRenewalDateValidationMessage("", dueDate)).toBe("");
  });

  it("flags dates not after the due date", () => {
    expect(getRenewalDateValidationMessage("2026-02-12", dueDate)).toBe(
      "Renewal Date must be after the current Due Date."
    );
    expect(getRenewalDateValidationMessage("2026-01-01", dueDate)).toBe(
      "Renewal Date must be after the current Due Date."
    );
  });

  it("accepts any valid date after the due date, regardless of demonstration expiration", () => {
    expect(getRenewalDateValidationMessage("2026-06-01", dueDate)).toBe("");
    expect(getRenewalDateValidationMessage("2099-01-01", dueDate)).toBe("");
  });
});

describe("formIsValid / formHasChanges", () => {
  const dueDate = new Date("2026-02-12");

  it("INITIAL_FORM_DATA has empty values", () => {
    expect(INITIAL_FORM_DATA).toEqual({
      renewalDate: "",
      requestReason: "",
      details: "",
    });
  });

  it("formHasChanges returns false for the initial state", () => {
    expect(formHasChanges(INITIAL_FORM_DATA)).toBe(false);
  });

  it("formHasChanges returns true when any field has been touched", () => {
    expect(formHasChanges({ ...INITIAL_FORM_DATA, renewalDate: "2026-03-01" })).toBe(true);
    expect(formHasChanges({ ...INITIAL_FORM_DATA, requestReason: "Other" })).toBe(true);
    expect(formHasChanges({ ...INITIAL_FORM_DATA, details: "x" })).toBe(true);
  });

  it("formIsValid requires all three fields", () => {
    expect(
      formIsValid({ renewalDate: "", requestReason: "Other", details: "reason" }, dueDate)
    ).toBe(false);
    expect(
      formIsValid({ renewalDate: "2026-03-01", requestReason: "", details: "reason" }, dueDate)
    ).toBe(false);
    expect(
      formIsValid({ renewalDate: "2026-03-01", requestReason: "Other", details: "   " }, dueDate)
    ).toBe(false);
    expect(
      formIsValid({ renewalDate: "2026-03-01", requestReason: "Other", details: "reason" }, dueDate)
    ).toBe(true);
  });
});
