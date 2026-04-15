import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  EDIT_DELIVERABLE_DIALOG_TITLE,
  EDIT_DELIVERABLE_REASON_FIELD_NAME,
  EDIT_DELIVERABLE_SAVE_BUTTON_NAME,
  EditDeliverableDialog,
  EditDeliverableDialogDeliverable,
  EditDeliverableInput,
  buildInitialFormData,
  formHasChanges,
  formIsValid,
  isDeliverableEditable,
  NON_EDITABLE_DELIVERABLE_STATUSES,
} from "./EditDeliverableDialog";
import { DELIVERABLE_NAME_FIELD_ID } from "./fields/DeliverableNameField";
import { SINGLE_DELIVERABLE_DUE_DATE_NAME } from "./fields/schedule-type/SingleDeliverableScheduleType";
import { DELIVERABLE_TYPE_SELECT_NAME } from "./fields/DeliverableTypeField";
import { TestProvider } from "test-utils/TestProvider";
import { personMocks } from "mock-data/personMocks";
import { Tag } from "demos-server";
import { DELIVERABLE_UPDATED_MESSAGE } from "util/messages";

const mockShowSuccess = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
  }),
}));

const TEST_DELIVERABLE: EditDeliverableDialogDeliverable = {
  id: "deliverable-1",
  name: "Quarterly Report",
  deliverableType: "Annual Budget Neutrality Report",
  dueDate: new Date(2026, 5, 15),
  cmsOwner: { id: "ashokatano" },
  demonstration: { id: "demo-1" },
};

const MOCK_TAGS: Tag[] = [
  { tagName: "Aggregate Cap", approvalStatus: "Approved" },
  { tagName: "Annual Limits", approvalStatus: "Approved" },
];

type OnSaveFn = (input: EditDeliverableInput, reasonForChange?: string) => Promise<void> | void;

const setup = (overrides?: {
  deliverable?: Partial<EditDeliverableDialogDeliverable>;
  onSave?: OnSaveFn;
}) => {
  const onClose = vi.fn();
  const onSave = overrides?.onSave;
  const deliverable = { ...TEST_DELIVERABLE, ...overrides?.deliverable };

  render(
    <TestProvider mocks={personMocks}>
      <EditDeliverableDialog
        deliverable={deliverable}
        demonstrationTypeTags={MOCK_TAGS}
        onClose={onClose}
        onSave={onSave}
      />
    </TestProvider>
  );

  return { onClose, onSave };
};

describe("EditDeliverableDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with the correct title", () => {
    setup();
    expect(screen.getByText(EDIT_DELIVERABLE_DIALOG_TITLE)).toBeInTheDocument();
  });

  it("disables the deliverable type field", () => {
    setup();
    expect(screen.getByTestId(DELIVERABLE_TYPE_SELECT_NAME)).toBeDisabled();
  });

  it("pre-fills the existing deliverable name and due date", () => {
    setup();
    expect(screen.getByTestId(DELIVERABLE_NAME_FIELD_ID)).toHaveValue("Quarterly Report");
    expect(screen.getByTestId(SINGLE_DELIVERABLE_DUE_DATE_NAME)).toHaveValue("2026-06-15");
  });

  it("does not show the Reason for Change field by default", () => {
    setup();
    expect(screen.queryByTestId(EDIT_DELIVERABLE_REASON_FIELD_NAME)).not.toBeInTheDocument();
  });

  it("shows the Reason for Change field when due date is modified", () => {
    setup();
    fireEvent.change(screen.getByTestId(SINGLE_DELIVERABLE_DUE_DATE_NAME), {
      target: { value: "2026-07-20" },
    });
    expect(screen.getByTestId(EDIT_DELIVERABLE_REASON_FIELD_NAME)).toBeInTheDocument();
  });

  it("disables Save until required fields are present", async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByTestId(EDIT_DELIVERABLE_SAVE_BUTTON_NAME)).toBeDisabled();

    await waitFor(() =>
      expect(screen.getByTestId("select-demonstration-type")).toBeInTheDocument()
    );
    await user.click(screen.getByTestId("select-demonstration-type"));
    await user.click(screen.getByText("Aggregate Cap"));

    await waitFor(() =>
      expect(screen.getByTestId(EDIT_DELIVERABLE_SAVE_BUTTON_NAME)).not.toBeDisabled()
    );
  });

  it("requires Reason for Change to enable Save when due date is modified", async () => {
    const user = userEvent.setup();
    setup();

    await waitFor(() =>
      expect(screen.getByTestId("select-demonstration-type")).toBeInTheDocument()
    );
    await user.click(screen.getByTestId("select-demonstration-type"));
    await user.click(screen.getByText("Aggregate Cap"));

    fireEvent.change(screen.getByTestId(SINGLE_DELIVERABLE_DUE_DATE_NAME), {
      target: { value: "2026-07-20" },
    });

    expect(screen.getByTestId(EDIT_DELIVERABLE_SAVE_BUTTON_NAME)).toBeDisabled();

    await user.type(
      screen.getByTestId(EDIT_DELIVERABLE_REASON_FIELD_NAME),
      "Schedule slip due to vendor delay"
    );

    await waitFor(() =>
      expect(screen.getByTestId(EDIT_DELIVERABLE_SAVE_BUTTON_NAME)).not.toBeDisabled()
    );
  });

  it("calls onSave with the reason and shows a success toast", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { onClose } = setup({ onSave });

    await waitFor(() =>
      expect(screen.getByTestId("select-demonstration-type")).toBeInTheDocument()
    );
    await user.click(screen.getByTestId("select-demonstration-type"));
    await user.click(screen.getByText("Aggregate Cap"));

    fireEvent.change(screen.getByTestId(SINGLE_DELIVERABLE_DUE_DATE_NAME), {
      target: { value: "2026-07-20" },
    });

    await user.type(screen.getByTestId(EDIT_DELIVERABLE_REASON_FIELD_NAME), "Schedule slip");

    await user.click(screen.getByTestId(EDIT_DELIVERABLE_SAVE_BUTTON_NAME));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "deliverable-1",
        dueDate: "2026-07-20",
        demonstrationTypes: ["Aggregate Cap"],
      }),
      "Schedule slip"
    );
    expect(mockShowSuccess).toHaveBeenCalledWith(DELIVERABLE_UPDATED_MESSAGE);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not pass a reason to onSave when the due date was not modified", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    setup({ onSave });

    await waitFor(() =>
      expect(screen.getByTestId("select-demonstration-type")).toBeInTheDocument()
    );
    await user.click(screen.getByTestId("select-demonstration-type"));
    await user.click(screen.getByText("Aggregate Cap"));

    await user.click(screen.getByTestId(EDIT_DELIVERABLE_SAVE_BUTTON_NAME));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(expect.any(Object), undefined);
  });
});

describe("isDeliverableEditable", () => {
  it.each(["Upcoming", "Past Due", "Submitted", "Under CMS Review"] as const)(
    "returns true for %s",
    (status) => {
      expect(isDeliverableEditable(status)).toBe(true);
    }
  );

  it.each(["Accepted", "Approved", "Received and Filed"] as const)(
    "returns false for %s",
    (status) => {
      expect(isDeliverableEditable(status)).toBe(false);
      expect(NON_EDITABLE_DELIVERABLE_STATUSES.has(status)).toBe(true);
    }
  );
});

describe("formIsValid / formHasChanges / buildInitialFormData", () => {
  const initial = buildInitialFormData(TEST_DELIVERABLE);

  it("buildInitialFormData converts the due date to ISO YYYY-MM-DD", () => {
    expect(initial.dueDate).toBe("2026-06-15");
    expect(initial.name).toBe("Quarterly Report");
    expect(initial.cmsOwnerUserId).toBe("ashokatano");
  });

  it("formIsValid is false when name is blank", () => {
    expect(formIsValid(initial, { ...initial, name: "  ", demonstrationTypes: ["x"] })).toBe(false);
  });

  it("formIsValid is false when no demonstration types are selected", () => {
    expect(formIsValid(initial, { ...initial, demonstrationTypes: [] })).toBe(false);
  });

  it("formIsValid requires reason when due date changes", () => {
    expect(
      formIsValid(initial, {
        ...initial,
        dueDate: "2026-08-01",
        demonstrationTypes: ["x"],
        reasonForChange: "",
      })
    ).toBe(false);
    expect(
      formIsValid(initial, {
        ...initial,
        dueDate: "2026-08-01",
        demonstrationTypes: ["x"],
        reasonForChange: "valid reason",
      })
    ).toBe(true);
  });

  it("formHasChanges detects modifications", () => {
    expect(formHasChanges(initial, initial)).toBe(false);
    expect(formHasChanges(initial, { ...initial, name: "Renamed" })).toBe(true);
    expect(formHasChanges(initial, { ...initial, demonstrationTypes: ["x"] })).toBe(true);
  });
});
