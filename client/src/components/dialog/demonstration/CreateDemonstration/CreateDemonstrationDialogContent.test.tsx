import React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkFormHasChanges,
  checkFormIsValid,
  CreateDemonstrationDialogContent,
  getCreateDemonstrationInput,
} from "./CreateDemonstrationDialogContent";
import { CreateDemonstrationFormData, SUBMIT_BUTTON_NAME } from "./CreateDemonstrationForm";

type MockBaseDialogProps = {
  children: React.ReactNode;
  actionButton: React.ReactNode;
  onClose: () => void;
  title: string;
  dialogHasChanges: boolean;
};

type MockCreateDemonstrationFormProps = {
  demonstration: CreateDemonstrationFormData;
  setDemonstration: React.Dispatch<React.SetStateAction<CreateDemonstrationFormData>>;
};

const closeDialogMock = vi.fn();
const onSubmitMock = vi.fn();
const useCreateDemonstrationMock = vi.fn();
const baseDialogPropsMock = vi.fn();

let savingMock = false;

vi.mock("../../DialogContext", () => ({
  useDialog: () => ({
    closeDialog: closeDialogMock,
  }),
}));

vi.mock("./useCreateDemonstration", () => ({
  useCreateDemonstration: (args: { onSuccess: () => void }) => {
    useCreateDemonstrationMock(args);

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

vi.mock("./CreateDemonstrationForm", async () => {
  const actual = await vi.importActual<typeof import("./CreateDemonstrationForm")>(
    "./CreateDemonstrationForm"
  );

  return {
    ...actual,
    CreateDemonstrationForm: ({
      demonstration,
      setDemonstration,
    }: MockCreateDemonstrationFormProps) => (
      <div>
        <div data-testid="project-officer-value">{demonstration.projectOfficerUserId}</div>
        <button
          data-testid="set-description-only"
          onClick={() => setDemonstration({ ...demonstration, description: "Draft description" })}
        >
          Set Description Only
        </button>
        <button
          data-testid="set-required-fields"
          onClick={() =>
            setDemonstration({
              ...demonstration,
              name: "New Demonstration",
              stateId: "AL",
            })
          }
        >
          Set Required Fields
        </button>
      </div>
    ),
  };
});

const INITIAL_DEMONSTRATION: CreateDemonstrationFormData = {
  name: "",
  description: "",
  stateId: "",
  sdgDivision: undefined,
  projectOfficerUserId: "current-user-id",
};

describe("CreateDemonstrationDialogContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savingMock = false;
  });

  it("wires create success to closeDialog", () => {
    render(<CreateDemonstrationDialogContent initialDemonstration={INITIAL_DEMONSTRATION} />);

    expect(useCreateDemonstrationMock).toHaveBeenCalledWith({ onSuccess: closeDialogMock });
  });

  it("disables submit when the form has no changes", () => {
    render(<CreateDemonstrationDialogContent initialDemonstration={INITIAL_DEMONSTRATION} />);

    expect(screen.getByTestId(SUBMIT_BUTTON_NAME)).toBeDisabled();
    expect(baseDialogPropsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ dialogHasChanges: false })
    );
  });

  it("keeps submit disabled when only the description has been entered", () => {
    render(<CreateDemonstrationDialogContent initialDemonstration={INITIAL_DEMONSTRATION} />);

    fireEvent.click(screen.getByTestId("set-description-only"));

    expect(screen.getByTestId(SUBMIT_BUTTON_NAME)).toBeDisabled();
    expect(baseDialogPropsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ dialogHasChanges: true })
    );
  });

  it("enables submit when the required fields have been entered", () => {
    render(<CreateDemonstrationDialogContent initialDemonstration={INITIAL_DEMONSTRATION} />);

    fireEvent.click(screen.getByTestId("set-required-fields"));

    expect(screen.getByTestId(SUBMIT_BUTTON_NAME)).not.toBeDisabled();
  });

  it("submits mapped create input", () => {
    render(<CreateDemonstrationDialogContent initialDemonstration={INITIAL_DEMONSTRATION} />);

    fireEvent.click(screen.getByTestId("set-required-fields"));
    fireEvent.click(screen.getByTestId(SUBMIT_BUTTON_NAME));

    expect(onSubmitMock).toHaveBeenCalledWith({
      name: "New Demonstration",
      description: "",
      stateId: "AL",
      sdgDivision: undefined,
      projectOfficerUserId: "current-user-id",
    });
  });

  it("uses closeDialog for dialog dismissal", () => {
    render(<CreateDemonstrationDialogContent initialDemonstration={INITIAL_DEMONSTRATION} />);

    fireEvent.click(screen.getByTestId("base-dialog-close"));

    expect(closeDialogMock).toHaveBeenCalled();
  });

  it("shows loading state while saving", () => {
    savingMock = true;

    render(<CreateDemonstrationDialogContent initialDemonstration={INITIAL_DEMONSTRATION} />);

    fireEvent.click(screen.getByTestId("set-required-fields"));

    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByTestId(SUBMIT_BUTTON_NAME)).toBeDisabled();
  });
});

describe("getCreateDemonstrationInput", () => {
  it("maps form data to the create input shape", () => {
    expect(
      getCreateDemonstrationInput({
        name: "Test Demo",
        description: "Description",
        stateId: "AL",
        sdgDivision: "Division of System Reform Demonstrations",
        projectOfficerUserId: "user-1",
      })
    ).toEqual({
      name: "Test Demo",
      description: "Description",
      stateId: "AL",
      sdgDivision: "Division of System Reform Demonstrations",
      projectOfficerUserId: "user-1",
    });
  });
});

describe("checkFormHasChanges", () => {
  it("returns false when only the default project officer is present", () => {
    expect(checkFormHasChanges(INITIAL_DEMONSTRATION, INITIAL_DEMONSTRATION)).toBe(false);
  });

  it("returns true when the project officer changes", () => {
    expect(
      checkFormHasChanges(INITIAL_DEMONSTRATION, {
        ...INITIAL_DEMONSTRATION,
        projectOfficerUserId: "different-user",
      })
    ).toBe(true);
  });
});

describe("checkFormIsValid", () => {
  it("requires name, stateId, and projectOfficerUserId", () => {
    expect(checkFormIsValid(INITIAL_DEMONSTRATION)).toBe("");
    expect(
      checkFormIsValid({
        ...INITIAL_DEMONSTRATION,
        name: "Test Demo",
        stateId: "AL",
      })
    ).toBe("current-user-id");
  });
});
