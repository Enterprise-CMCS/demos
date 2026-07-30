import React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkFormHasChanges,
  checkFormIsValid,
  EditDemonstrationDialogContent,
} from "./EditDemonstrationDialogContent";
import { EditDemonstrationFormData, SUBMIT_BUTTON_NAME } from "./EditDemonstrationForm";
import { LocalDate } from "demos-server";

type MockBaseDialogProps = {
  children: React.ReactNode;
  actionButton: React.ReactNode;
  onClose: () => void;
  title: string;
  dialogHasChanges: boolean;
};

type MockEditDemonstrationFormProps = {
  demonstration: EditDemonstrationFormData;
  setDemonstration: React.Dispatch<React.SetStateAction<EditDemonstrationFormData>>;
  isApproved: boolean;
};

const closeDialogMock = vi.fn();
const onSubmitMock = vi.fn();
const useUpdateDemonstrationMock = vi.fn();
const baseDialogPropsMock = vi.fn();

let savingMock = false;

vi.mock("../../DialogContext", () => ({
  useDialog: () => ({
    closeDialog: closeDialogMock,
  }),
}));

vi.mock("./useUpdateDemonstration", () => ({
  useUpdateDemonstration: (args: { onSuccess: () => void }) => {
    useUpdateDemonstrationMock(args);

    return {
      onSubmit: onSubmitMock,
      saving: savingMock,
    };
  },
}));

vi.mock("components/dialog/BaseDialog", () => ({
  BaseDialog: ({
    children,
    actionButton,
    onClose,
    title,
    dialogHasChanges,
  }: MockBaseDialogProps) => {
    baseDialogPropsMock({ title, onClose, dialogHasChanges });

    return (
      <div>
        <div>{title}</div>
        <button data-testid="base-dialog-close" onClick={onClose}>
          Close
        </button>
        {actionButton}
        {children}
      </div>
    );
  },
}));

vi.mock("./EditDemonstrationForm", async () => {
  const actual =
    await vi.importActual<typeof import("./EditDemonstrationForm")>("./EditDemonstrationForm");

  return {
    ...actual,
    EditDemonstrationForm: ({
      demonstration,
      setDemonstration,
      isApproved,
    }: MockEditDemonstrationFormProps) => (
      <div>
        <div data-testid="approved-flag">{isApproved ? "approved" : "draft"}</div>
        <button
          data-testid="set-description-only"
          onClick={() => setDemonstration({ ...demonstration, description: "Updated description" })}
        >
          Set Description Only
        </button>
        <button
          data-testid="set-invalid-date-range"
          onClick={() =>
            setDemonstration({
              ...demonstration,
              effectiveDate: "2025-06-01" as LocalDate,
              expirationDate: "2024-06-01" as LocalDate,
            })
          }
        >
          Set Invalid Date Range
        </button>
      </div>
    ),
  };
});

const INITIAL_DEMONSTRATION: EditDemonstrationFormData = {
  name: "Existing Demo",
  description: "Existing description",
  stateId: "AL",
  sdgDivision: "Division of System Reform Demonstrations",
  signatureLevel: "OA",
  projectOfficerUserId: "current-user-id",
  effectiveDate: "2024-06-01" as LocalDate,
  expirationDate: "2025-06-01" as LocalDate,
};

describe("EditDemonstrationDialogContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savingMock = false;
  });

  it("wires update success to closeDialog", () => {
    render(
      <EditDemonstrationDialogContent
        demonstrationId="demo-1"
        initialDemonstration={INITIAL_DEMONSTRATION}
        isApproved
      />
    );

    expect(useUpdateDemonstrationMock).toHaveBeenCalledWith({ onSuccess: closeDialogMock });
  });

  it("disables submit when the form has no changes", () => {
    render(
      <EditDemonstrationDialogContent
        demonstrationId="demo-1"
        initialDemonstration={INITIAL_DEMONSTRATION}
        isApproved
      />
    );

    expect(screen.getByTestId(SUBMIT_BUTTON_NAME)).toBeDisabled();
    expect(baseDialogPropsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ dialogHasChanges: false })
    );
  });

  it("enables submit when the form has valid changes", () => {
    render(
      <EditDemonstrationDialogContent
        demonstrationId="demo-1"
        initialDemonstration={INITIAL_DEMONSTRATION}
        isApproved
      />
    );

    fireEvent.click(screen.getByTestId("set-description-only"));

    expect(screen.getByTestId(SUBMIT_BUTTON_NAME)).not.toBeDisabled();
    expect(baseDialogPropsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ dialogHasChanges: true })
    );
  });

  it("keeps submit disabled when the form becomes invalid", () => {
    render(
      <EditDemonstrationDialogContent
        demonstrationId="demo-1"
        initialDemonstration={INITIAL_DEMONSTRATION}
        isApproved
      />
    );

    fireEvent.click(screen.getByTestId("set-invalid-date-range"));

    expect(screen.getByTestId(SUBMIT_BUTTON_NAME)).toBeDisabled();
  });

  it("submits the demonstration id and mapped update input", () => {
    render(
      <EditDemonstrationDialogContent
        demonstrationId="demo-1"
        initialDemonstration={INITIAL_DEMONSTRATION}
        isApproved
      />
    );

    fireEvent.click(screen.getByTestId("set-description-only"));
    fireEvent.click(screen.getByTestId(SUBMIT_BUTTON_NAME));

    expect(onSubmitMock).toHaveBeenCalledWith("demo-1", {
      name: "Existing Demo",
      projectOfficerUserId: "current-user-id",
      description: "Updated description",
      effectiveDate: "2024-06-01",
      expirationDate: "2025-06-01",
      sdgDivision: "Division of System Reform Demonstrations",
    });
  });

  it("uses closeDialog for dialog dismissal", () => {
    render(
      <EditDemonstrationDialogContent
        demonstrationId="demo-1"
        initialDemonstration={INITIAL_DEMONSTRATION}
        isApproved
      />
    );

    fireEvent.click(screen.getByTestId("base-dialog-close"));

    expect(closeDialogMock).toHaveBeenCalled();
  });

  it("shows loading state while saving", () => {
    savingMock = true;

    render(
      <EditDemonstrationDialogContent
        demonstrationId="demo-1"
        initialDemonstration={INITIAL_DEMONSTRATION}
        isApproved
      />
    );

    fireEvent.click(screen.getByTestId("set-description-only"));

    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByTestId(SUBMIT_BUTTON_NAME)).toBeDisabled();
  });
});

describe("checkFormHasChanges", () => {
  it("returns false when the form matches the initial demonstration", () => {
    expect(checkFormHasChanges(INITIAL_DEMONSTRATION, INITIAL_DEMONSTRATION)).toBe(false);
  });

  it("returns true when the description changes", () => {
    expect(
      checkFormHasChanges(INITIAL_DEMONSTRATION, {
        ...INITIAL_DEMONSTRATION,
        description: "Updated description",
      })
    ).toBe(true);
  });
});

describe("checkFormIsValid", () => {
  it("requires name, stateId, and projectOfficerUserId", () => {
    expect(
      checkFormIsValid(
        {
          ...INITIAL_DEMONSTRATION,
          name: "",
        },
        false
      )
    ).toBe(false);
  });

  it("requires approved-only fields when the demonstration is approved", () => {
    expect(
      checkFormIsValid(
        {
          ...INITIAL_DEMONSTRATION,
          sdgDivision: undefined,
        },
        true
      )
    ).toBe(false);
  });

  it("rejects an expiration date before the effective date", () => {
    expect(
      checkFormIsValid(
        {
          ...INITIAL_DEMONSTRATION,
          effectiveDate: "2025-06-01" as LocalDate,
          expirationDate: "2024-06-01" as LocalDate,
        },
        true
      )
    ).toBe(false);
  });

  it("accepts a valid approved demonstration", () => {
    expect(checkFormIsValid(INITIAL_DEMONSTRATION, true)).toBe(true);
  });
});
