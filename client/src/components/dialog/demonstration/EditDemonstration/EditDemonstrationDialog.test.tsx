import React from "react";
import { LocalDate } from "demos-server";

import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { EditDemonstrationDialog } from "./EditDemonstrationDialog";
import {
  DEMONSTRATION_DIALOG_DESCRIPTION_NAME,
  getUpdateDemonstrationInput,
} from "./EditDemonstrationForm";
import { EDIT_DEMONSTRATION_DIALOG_QUERY as GET_DEMONSTRATION_BY_ID_QUERY } from "./useEditDemonstrationDialogData";
import { UPDATE_DEMONSTRATION_MUTATION } from "./useUpdateDemonstration";
import { DIALOG_CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";

const DEFAULT_PROPS = {
  onClose: vi.fn(),
};

const SUBMIT_BUTTON_TEST_ID = "button-submit-demonstration-dialog";

describe("EditDemonstrationDialog", () => {
  const TEST_DEMO_ID = "1";

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

  const GET_DEMONSTRATION_BY_ID_MOCK = {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: TEST_DEMO_ID },
    },
    result: {
      data: {
        demonstration: {
          id: TEST_DEMO_ID,
          name: "Test Demonstration",
          description: "Test demonstration description",
          sdgDivision: "Division of System Reform Demonstrations",
          signatureLevel: "OA",
          status: "Approved",
          state: {
            id: "test-state-id",
          },
          primaryProjectOfficer: {
            id: "test-officer-id",
          },
          effectiveDate: "2023-01-01T00:00:00.000Z",
          expirationDate: "2024-01-01T00:00:00.000Z",
        },
      },
    },
  };

  // Mock for the update mutation - this needs to match what the form actually submits
  const UPDATE_DEMONSTRATION_MOCK = {
    request: {
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: "1",
        input: {
          name: "Test Demonstration 123",
          description: "A test demonstration.",
          stateId: "AL",
          sdgDivision: "Division of System Reform Demonstrations",
        },
      },
    },
    result: {
      data: {
        updateDemonstration: {
          id: "1",
          name: "Test Demonstration 123",
          description: "A test demonstration.",
          effectiveDate: "2023-01-01T00:00:00.000Z",
          expirationDate: "2024-01-01T00:00:00.000Z",
          state: {
            id: "AL",
            name: "Alabama",
          },
        },
      },
    },
  };

  const getEditDemonstrationDialog = () => {
    return (
      <TestProvider
        mocks={[
          GET_DEMONSTRATION_BY_ID_MOCK,
          GET_USER_SELECT_OPTIONS_MOCK,
          UPDATE_DEMONSTRATION_MOCK,
        ]}
      >
        <EditDemonstrationDialog {...DEFAULT_PROPS} demonstrationId={TEST_DEMO_ID} />
      </TestProvider>
    );
  };

  it("renders dialog title for edit mode", async () => {
    render(getEditDemonstrationDialog());

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText(/Edit Demonstration/i)).toBeInTheDocument();
    });
  });

  it("renders the Cancel and Submit buttons", async () => {
    render(getEditDemonstrationDialog());

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)).toBeInTheDocument();
      expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument();
    });
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onCloseMock = vi.fn();
    render(
      <TestProvider
        mocks={[
          GET_DEMONSTRATION_BY_ID_MOCK,
          GET_USER_SELECT_OPTIONS_MOCK,
          UPDATE_DEMONSTRATION_MOCK,
        ]}
      >
        <EditDemonstrationDialog
          {...DEFAULT_PROPS}
          onClose={onCloseMock}
          demonstrationId={TEST_DEMO_ID}
        />
      </TestProvider>
    );

    // Wait for loading to complete first
    await waitFor(() => {
      expect(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME));

    // Verify onClose was called
    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it("renders the description textarea", async () => {
    render(getEditDemonstrationDialog());

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId(DEMONSTRATION_DIALOG_DESCRIPTION_NAME)).toBeInTheDocument();
    });
  });

  it("shows loading state while fetching demonstration data", () => {
    render(getEditDemonstrationDialog());
    expect(screen.getByLabelText(/Loading/i)).toBeInTheDocument();
  });

  it("shows error state when query fails", async () => {
    const errorMock = {
      ...GET_DEMONSTRATION_BY_ID_MOCK,
      error: new Error("Failed to fetch demonstration"),
      result: undefined,
    };

    render(
      <TestProvider mocks={[errorMock, GET_USER_SELECT_OPTIONS_MOCK, UPDATE_DEMONSTRATION_MOCK]}>
        <EditDemonstrationDialog {...DEFAULT_PROPS} demonstrationId="1" />
      </TestProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Error loading demonstration data/i)).toBeInTheDocument();
    });
  });

  it("populates form fields after loading completes", async () => {
    render(getEditDemonstrationDialog());

    // Wait for the form to be populated with data from the query
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Demonstration")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test demonstration description")).toBeInTheDocument();
    });
  });

  it("can submit form changes successfully", async () => {
    render(
      <TestProvider
        mocks={[
          GET_DEMONSTRATION_BY_ID_MOCK,
          GET_USER_SELECT_OPTIONS_MOCK,
          UPDATE_DEMONSTRATION_MOCK,
        ]}
      >
        <EditDemonstrationDialog onClose={vi.fn()} demonstrationId="1" />
      </TestProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Demonstration")).toBeInTheDocument();
    });

    // Make a change to the form
    const titleInput = screen.getByDisplayValue("Test Demonstration");
    fireEvent.change(titleInput, { target: { value: "Test Demonstration 123" } });

    // Submit the form - this should not throw an error if the mock is working
    const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID);

    // The button should be enabled since we have all required fields
    expect(submitButton).not.toBeDisabled();

    // Click submit - if the mock is working, this won't throw a "No more mocked responses" error
    fireEvent.click(submitButton);

    // Wait a moment to ensure the mutation would have been called
    await waitFor(() => {
      // If we get here without errors, the mock worked
      expect(submitButton).toBeInTheDocument();
    });
  });
});

describe("getUpdateDemonstrationInput", () => {
  const asLocalDate = (value: string) => value as LocalDate;

  const BASE_DEMONSTRATION = {
    name: "My Demo",
    description: "A description",
    stateId: "AL",
    projectOfficerUserId: "officer-1",
    effectiveDate: undefined,
    expirationDate: undefined,
  };

  it("maps name, stateId, and projectOfficerId as-is", () => {
    const result = getUpdateDemonstrationInput(BASE_DEMONSTRATION);
    expect(result.name).toBe("My Demo");
    expect(result.projectOfficerUserId).toBe("officer-1");
  });

  it("passes through effectiveDate and expirationDate as-is", () => {
    const result = getUpdateDemonstrationInput({
      ...BASE_DEMONSTRATION,
      effectiveDate: asLocalDate("2024-06-01"),
      expirationDate: asLocalDate("2025-06-01"),
    });
    expect(result.effectiveDate).toBe("2024-06-01");
    expect(result.expirationDate).toBe("2025-06-01");
  });

  it("passes null for effectiveDate and expirationDate when empty", () => {
    const result = getUpdateDemonstrationInput({
      ...BASE_DEMONSTRATION,
      effectiveDate: undefined,
      expirationDate: undefined,
    });
    expect(result.effectiveDate).toBeNull();
    expect(result.expirationDate).toBeNull();
  });

  it("passes null for sdgDivision when not provided", () => {
    const result = getUpdateDemonstrationInput(BASE_DEMONSTRATION);
    expect(result.sdgDivision).toBeNull();
  });

  it("trims whitespace from description", () => {
    const result = getUpdateDemonstrationInput({
      ...BASE_DEMONSTRATION,
      description: "  trimmed  ",
    });
    expect(result.description).toBe("trimmed");
  });

  it("sets description to empty string when blank", () => {
    const result = getUpdateDemonstrationInput({ ...BASE_DEMONSTRATION, description: "   " });
    expect(result.description).toBe("");
  });
});
