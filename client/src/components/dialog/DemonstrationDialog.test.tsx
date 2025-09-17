import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CreateDemonstrationDialog, EditDemonstrationDialog } from "./DemonstrationDialog";
import { TestProvider } from "test-utils/TestProvider";

const DEFAULT_DEMONSTRATION = {
  name: "",
  effectiveDate: "",
  expirationDate: "",
  description: "",
  stateId: "",
  projectOfficerId: "",
};

const DEFAULT_PROPS = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  initialDemonstration: DEFAULT_DEMONSTRATION,
};

const SUBMIT_BUTTON_TEST_ID = "button-submit-demonstration-dialog";
const CANCEL_BUTTON_TEST_ID = "button-cancel-demonstration-dialog";

const getCreateDemonstrationDialog = () => {
  return (
    <TestProvider>
      <CreateDemonstrationDialog {...DEFAULT_PROPS} />
    </TestProvider>
  );
};

const getEditDemonstrationDialog = () => {
  return (
    <TestProvider>
      <EditDemonstrationDialog {...DEFAULT_PROPS} demonstrationId="" />
    </TestProvider>
  );
};

describe("CreateDemonstrationDialog", () => {
  it("renders dialog title for create mode", () => {
    render(getCreateDemonstrationDialog());
    expect(screen.getByText(/New Demonstration/i)).toBeInTheDocument();
  });

  it("renders the Cancel and Submit buttons", () => {
    render(getCreateDemonstrationDialog());
    expect(screen.getByTestId(CANCEL_BUTTON_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument();
  });

  it("disables Submit button if required fields are empty", () => {
    render(getCreateDemonstrationDialog());
    expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeDisabled();
  });

  it("calls onClose when Cancel is clicked", () => {
    render(getCreateDemonstrationDialog());
    fireEvent.click(screen.getByTestId(CANCEL_BUTTON_TEST_ID));
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
  });

  it("renders the description textarea", () => {
    render(getCreateDemonstrationDialog());
    expect(screen.getByTestId("textarea-description")).toBeInTheDocument();
  });
});

describe("EditDemonstrationDialog", () => {
  it("renders dialog title for edit mode", () => {
    render(getEditDemonstrationDialog());
    expect(screen.getByText(/Edit Demonstration/i)).toBeInTheDocument();
  });

  it("renders the Cancel and Submit buttons", () => {
    render(getEditDemonstrationDialog());
    expect(screen.getByTestId(CANCEL_BUTTON_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument();
  });

  it("disables Submit button if required fields are empty", () => {
    render(getEditDemonstrationDialog());
    expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeDisabled();
  });

  it("calls onClose when Cancel is clicked", () => {
    render(getEditDemonstrationDialog());
    fireEvent.click(screen.getByTestId(CANCEL_BUTTON_TEST_ID));
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
  });

  it("renders the description textarea", () => {
    render(getEditDemonstrationDialog());
    expect(screen.getByTestId("textarea-description")).toBeInTheDocument();
  });
});
