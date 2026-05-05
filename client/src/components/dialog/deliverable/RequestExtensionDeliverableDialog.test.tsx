import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  EXTENSION_ELIGIBLE_STATUSES,
  INITIAL_FORM_DATA,
  REQUEST_EXTENSION_DATE_FIELD_NAME,
  REQUEST_EXTENSION_DETAILS_FIELD_NAME,
  REQUEST_EXTENSION_DIALOG_TITLE,
  REQUEST_EXTENSION_REASON_FIELD_NAME,
  REQUEST_EXTENSION_SUBMIT_BUTTON_NAME,
  RequestExtensionDeliverableDialog,
  RequestExtensionDeliverableDialogDeliverable,
  canRequestExtension,
  formHasChanges,
  formIsValid,
  getExtensionDateValidationMessage,
} from "./RequestExtensionDeliverableDialog";
import { DIALOG_CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";
import { TestProvider } from "test-utils/TestProvider";
import { DELIVERABLE_EXTENSION_REQUESTED_MESSAGE } from "util/messages";

const mockShowSuccess = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
  }),
}));

const TEST_DELIVERABLE: RequestExtensionDeliverableDialogDeliverable = {
  id: "deliverable-1",
  dueDate: new Date("2026-02-12"),
  demonstration: { expirationDate: new Date("2026-12-31") },
};

type OnSubmitFn = NonNullable<
  React.ComponentProps<typeof RequestExtensionDeliverableDialog>["onSubmit"]
>;

const setup = (
  overrides?: Partial<RequestExtensionDeliverableDialogDeliverable>,
  onSubmit?: OnSubmitFn
) => {
  const onClose = vi.fn();
  const deliverable = { ...TEST_DELIVERABLE, ...overrides };

  render(
    <TestProvider>
      <RequestExtensionDeliverableDialog
        deliverable={deliverable}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </TestProvider>
  );

  return { onClose };
};

describe("RequestExtensionDeliverableDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with the correct title", () => {
    setup();
    expect(screen.getByText(REQUEST_EXTENSION_DIALOG_TITLE)).toBeInTheDocument();
  });

  it("renders the required Extension Date, Request Reason, and Details fields", () => {
    setup();
    expect(screen.getByTestId(REQUEST_EXTENSION_DATE_FIELD_NAME)).toBeRequired();
    expect(screen.getByTestId(REQUEST_EXTENSION_REASON_FIELD_NAME)).toBeRequired();
    expect(screen.getByTestId(REQUEST_EXTENSION_DETAILS_FIELD_NAME)).toBeRequired();
  });

  it("renders the request reason options", () => {
    setup();
    expect(
      screen.getByTestId(`${REQUEST_EXTENSION_REASON_FIELD_NAME}-option-COVID-19`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${REQUEST_EXTENSION_REASON_FIELD_NAME}-option-Technical Difficulties`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${REQUEST_EXTENSION_REASON_FIELD_NAME}-option-Other`)
    ).toBeInTheDocument();
  });

  it("renders both Submit and Cancel buttons", () => {
    setup();
    expect(screen.getByTestId(REQUEST_EXTENSION_SUBMIT_BUTTON_NAME)).toBeInTheDocument();
    expect(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)).toBeInTheDocument();
  });

  it("disables Submit until all required fields are valid", async () => {
    const user = userEvent.setup();
    setup();
    const submit = screen.getByTestId(REQUEST_EXTENSION_SUBMIT_BUTTON_NAME);

    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId(REQUEST_EXTENSION_DATE_FIELD_NAME), {
      target: { value: "2026-03-15" },
    });
    expect(submit).toBeDisabled();

    await user.selectOptions(screen.getByTestId(REQUEST_EXTENSION_REASON_FIELD_NAME), "Other");
    expect(submit).toBeDisabled();

    await user.type(screen.getByTestId(REQUEST_EXTENSION_DETAILS_FIELD_NAME), "Need more time");
    await waitFor(() => expect(submit).not.toBeDisabled());
  });

  it("keeps Submit disabled when the extension date is not after the current due date", async () => {
    const user = userEvent.setup();
    setup();

    fireEvent.change(screen.getByTestId(REQUEST_EXTENSION_DATE_FIELD_NAME), {
      target: { value: "2026-02-12" }, // equal to due date — invalid
    });
    await user.selectOptions(screen.getByTestId(REQUEST_EXTENSION_REASON_FIELD_NAME), "COVID-19");
    await user.type(screen.getByTestId(REQUEST_EXTENSION_DETAILS_FIELD_NAME), "Delayed");

    expect(screen.getByTestId(REQUEST_EXTENSION_SUBMIT_BUTTON_NAME)).toBeDisabled();
    expect(
      screen.getByText("Extension Date must be after the current Due Date.")
    ).toBeInTheDocument();
  });

  it("keeps Submit disabled when the extension date is after the demonstration expiration", async () => {
    const user = userEvent.setup();
    setup();

    fireEvent.change(screen.getByTestId(REQUEST_EXTENSION_DATE_FIELD_NAME), {
      target: { value: "2027-01-15" }, // past expiration
    });
    await user.selectOptions(screen.getByTestId(REQUEST_EXTENSION_REASON_FIELD_NAME), "Other");
    await user.type(screen.getByTestId(REQUEST_EXTENSION_DETAILS_FIELD_NAME), "x");

    expect(screen.getByTestId(REQUEST_EXTENSION_SUBMIT_BUTTON_NAME)).toBeDisabled();
    expect(
      screen.getByText("Extension Date cannot be after the Demonstration Expiration Date.")
    ).toBeInTheDocument();
  });

  it("submits the form, shows a success toast, and closes the dialog", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { onClose } = setup(undefined, onSubmit);

    fireEvent.change(screen.getByTestId(REQUEST_EXTENSION_DATE_FIELD_NAME), {
      target: { value: "2026-03-15" },
    });
    await user.selectOptions(
      screen.getByTestId(REQUEST_EXTENSION_REASON_FIELD_NAME),
      "Technical Difficulties"
    );
    await user.type(
      screen.getByTestId(REQUEST_EXTENSION_DETAILS_FIELD_NAME),
      "  Vendor portal outage  "
    );

    await user.click(screen.getByTestId(REQUEST_EXTENSION_SUBMIT_BUTTON_NAME));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      deliverableId: "deliverable-1",
      extensionDate: "2026-03-15",
      requestReason: "Technical Difficulties",
      details: "Vendor portal outage",
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(DELIVERABLE_EXTENSION_REQUESTED_MESSAGE);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens the cancellation confirmation when closing with unsaved changes", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.type(screen.getByTestId(REQUEST_EXTENSION_DETAILS_FIELD_NAME), "partial");
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

describe("canRequestExtension", () => {
  it.each(["Upcoming", "Past Due"] as const)("returns true for %s", (status) => {
    expect(canRequestExtension(status)).toBe(true);
    expect(EXTENSION_ELIGIBLE_STATUSES.has(status)).toBe(true);
  });

  it.each(["Submitted", "Under CMS Review", "Accepted", "Approved", "Received and Filed"] as const)(
    "returns false for %s",
    (status) => {
      expect(canRequestExtension(status)).toBe(false);
    }
  );
});

describe("getExtensionDateValidationMessage", () => {
  const dueDate = new Date("2026-02-12");
  const expirationDate = new Date("2026-12-31");

  it("returns empty for an empty value", () => {
    expect(getExtensionDateValidationMessage("", dueDate, expirationDate)).toBe("");
  });

  it("flags dates not after the due date", () => {
    expect(getExtensionDateValidationMessage("2026-02-12", dueDate, expirationDate)).toBe(
      "Extension Date must be after the current Due Date."
    );
    expect(getExtensionDateValidationMessage("2026-01-01", dueDate, expirationDate)).toBe(
      "Extension Date must be after the current Due Date."
    );
  });

  it("flags dates beyond the demonstration expiration", () => {
    expect(getExtensionDateValidationMessage("2027-01-15", dueDate, expirationDate)).toBe(
      "Extension Date cannot be after the Demonstration Expiration Date."
    );
  });

  it("skips the expiration check when no expiration date is known", () => {
    expect(getExtensionDateValidationMessage("2099-01-01", dueDate, null)).toBe("");
    expect(getExtensionDateValidationMessage("2099-01-01", dueDate, undefined)).toBe("");
  });

  it("accepts a valid date between due date and expiration", () => {
    expect(getExtensionDateValidationMessage("2026-06-01", dueDate, expirationDate)).toBe("");
  });
});

describe("formIsValid / formHasChanges", () => {
  const dueDate = new Date("2026-02-12");

  it("INITIAL_FORM_DATA has empty values", () => {
    expect(INITIAL_FORM_DATA).toEqual({
      extensionDate: "",
      requestReason: "",
      details: "",
    });
  });

  it("formHasChanges returns false for the initial state", () => {
    expect(formHasChanges(INITIAL_FORM_DATA)).toBe(false);
  });

  it("formHasChanges returns true when any field has been touched", () => {
    expect(formHasChanges({ ...INITIAL_FORM_DATA, extensionDate: "2026-03-01" })).toBe(true);
    expect(formHasChanges({ ...INITIAL_FORM_DATA, requestReason: "Other" })).toBe(true);
    expect(formHasChanges({ ...INITIAL_FORM_DATA, details: "x" })).toBe(true);
  });

  it("formIsValid requires all three fields", () => {
    expect(
      formIsValid({ extensionDate: "", requestReason: "Other", details: "reason" }, dueDate, null)
    ).toBe(false);
    expect(
      formIsValid(
        { extensionDate: "2026-03-01", requestReason: "", details: "reason" },
        dueDate,
        null
      )
    ).toBe(false);
    expect(
      formIsValid(
        { extensionDate: "2026-03-01", requestReason: "Other", details: "   " },
        dueDate,
        null
      )
    ).toBe(false);
    expect(
      formIsValid(
        { extensionDate: "2026-03-01", requestReason: "Other", details: "reason" },
        dueDate,
        null
      )
    ).toBe(true);
  });
});
