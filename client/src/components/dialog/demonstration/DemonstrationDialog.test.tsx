import React from "react";

import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

import { DemonstrationDialog } from "./DemonstrationDialog";

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
  mode: "create" as const,
};

const SUBMIT_BUTTON_TEST_ID = "button-submit-demonstration-dialog";
const CANCEL_BUTTON_TEST_ID = "button-cancel-demonstration-dialog";

describe("DemonstrationDialog", () => {
  const GET_USER_SELECT_OPTIONS_MOCK = {
    request: {
      query: GET_USER_SELECT_OPTIONS_QUERY,
    },
    result: {
      data: {
        people: [
          {
            id: "test-officer-id",
            fullName: "Test Officer",
            personType: "demos-cms-user",
          },
        ],
      },
    },
  };

  const getDemonstrationDialog = (mode: "create" | "edit" = "create") => {
    return (
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
        <DemonstrationDialog {...DEFAULT_PROPS} mode={mode} />
      </TestProvider>
    );
  };

  it("renders dialog title for create mode", () => {
    render(getDemonstrationDialog("create"));
    expect(screen.getByText(/New Demonstration/i)).toBeInTheDocument();
  });

  it("renders dialog title for edit mode", () => {
    render(getDemonstrationDialog("edit"));
    expect(screen.getByText(/Edit Demonstration/i)).toBeInTheDocument();
  });

  it("renders the Cancel and Submit buttons", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(CANCEL_BUTTON_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument();
  });

  it("disables Submit button if required fields are empty", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeDisabled();
  });

  it("renders the description textarea", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId("textarea-description")).toBeInTheDocument();
  });

  it("renders name input field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByLabelText(/Demonstration Name/i)).toBeInTheDocument();
  });

  it("renders state select field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByLabelText(/State/i)).toBeInTheDocument();
  });

  it("renders project officer select field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByLabelText(/Project Officer/i)).toBeInTheDocument();
  });

  it("renders effective date field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByLabelText(/Effective Date/i)).toBeInTheDocument();
  });

  it("renders expiration date field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByLabelText(/Expiration Date/i)).toBeInTheDocument();
  });
});
