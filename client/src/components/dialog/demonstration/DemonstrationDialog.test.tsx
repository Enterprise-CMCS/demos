import React from "react";

import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";

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

// Test ID constants
const SUBMIT_BUTTON_TEST_ID = "button-submit-demonstration-dialog";
const CANCEL_BUTTON_TEST_ID = "button-cancel-demonstration-dialog";
const DESCRIPTION_TEXTAREA_TEST_ID = "textarea-description";
const TITLE_INPUT_TEST_ID = "input-demonstration-title";
const STATE_SELECT_TEST_ID = "select-us-state";
const SELECT_USERS_TEST_ID = "select-users";
const EFFECTIVE_DATE_INPUT_TEST_ID = "input-effective-date";
const EXPIRATION_DATE_INPUT_TEST_ID = "input-expiration-date";
const SDG_DIVISION_SELECT_TEST_ID = "sdg-division-select";
const SIGNATURE_LEVEL_SELECT_TEST_ID = "signature-level-select";

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
    expect(screen.getByTestId(DESCRIPTION_TEXTAREA_TEST_ID)).toBeInTheDocument();
  });

  it("renders title input field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(TITLE_INPUT_TEST_ID)).toBeInTheDocument();
  });

  it("renders state select field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(STATE_SELECT_TEST_ID)).toBeInTheDocument();
  });

  it("renders project officer select field", async () => {
    render(getDemonstrationDialog());

    await waitFor(() => {
      expect(screen.getByTestId(SELECT_USERS_TEST_ID)).toBeInTheDocument();
    });
  });

  it("renders SDG division select field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(SDG_DIVISION_SELECT_TEST_ID)).toBeInTheDocument();
  });

  it("renders signature level select field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(SIGNATURE_LEVEL_SELECT_TEST_ID)).toBeInTheDocument();
  });

  it("renders effective date field in edit mode", () => {
    render(getDemonstrationDialog("edit"));
    expect(screen.getByTestId(EFFECTIVE_DATE_INPUT_TEST_ID)).toBeInTheDocument();
  });

  it("renders expiration date field in edit mode", () => {
    render(getDemonstrationDialog("edit"));
    expect(screen.getByTestId(EXPIRATION_DATE_INPUT_TEST_ID)).toBeInTheDocument();
  });

  it("renders the description textarea", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId("textarea-description")).toBeInTheDocument();
  });
});
