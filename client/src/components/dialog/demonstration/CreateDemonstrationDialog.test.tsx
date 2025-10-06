import React from "react";

import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

import { CreateDemonstrationDialog } from "./CreateDemonstrationDialog";

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

describe("CreateDemonstrationDialog", () => {
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

  const getCreateDemonstrationDialog = () => {
    return (
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
        <CreateDemonstrationDialog {...DEFAULT_PROPS} />
      </TestProvider>
    );
  };

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
