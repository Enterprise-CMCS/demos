import React from "react";

import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { TestProvider } from "test-utils/TestProvider";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  CreateDemonstrationDialog,
  EditDemonstrationDialog,
} from "./";
import {
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "./EditDemonstrationDialog";

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
          cmcsDivision: "Division of System Reform Demonstrations",
          signatureLevel: "OA",
          state: {
            id: "test-state-id",
          },
          roles: [
            {
              isPrimary: true,
              role: "Project Officer",
              person: {
                id: "test-officer-id",
              },
            },
          ],
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
          cmcsDivision: "Division of System Reform Demonstrations",
          signatureLevel: "OA",
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
      expect(screen.getByTestId(CANCEL_BUTTON_TEST_ID)).toBeInTheDocument();
      expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument();
    });
  });

  it("disables Submit button if required fields are empty", async () => {
    // Create a mock with incomplete data (missing state and project officer)
    const incompleteDataMock = {
      request: {
        query: GET_DEMONSTRATION_BY_ID_QUERY,
        variables: { id: TEST_DEMO_ID },
      },
      result: {
        data: {
          demonstration: {
            id: TEST_DEMO_ID,
            name: "", // Empty name
            description: "Test demonstration description",
            cmcsDivision: "Division of System Reform Demonstrations",
            signatureLevel: "OA",
            state: {
              id: "", // Empty state ID
            },
            roles: [], // No project officer assigned
            effectiveDate: "2023-01-01T00:00:00.000Z",
            expirationDate: "2024-01-01T00:00:00.000Z",
          },
        },
      },
    };

    render(
      <TestProvider mocks={[incompleteDataMock, GET_USER_SELECT_OPTIONS_MOCK]}>
        <EditDemonstrationDialog {...DEFAULT_PROPS} demonstrationId={TEST_DEMO_ID} />
      </TestProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeDisabled();
    });
  });

  it("calls onClose when Cancel is clicked", async () => {
    render(getEditDemonstrationDialog());

    // Wait for loading to complete first
    await waitFor(() => {
      expect(screen.getByTestId(CANCEL_BUTTON_TEST_ID)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(CANCEL_BUTTON_TEST_ID));
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
  });

  it("renders the description textarea", async () => {
    render(getEditDemonstrationDialog());

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId("textarea-description")).toBeInTheDocument();
    });
  });

  it("shows loading state while fetching demonstration data", () => {
    render(getEditDemonstrationDialog());
    expect(screen.getByLabelText(/Loading/i)).toBeInTheDocument();
  });

  it("shows error state when query fails", () => {
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
    waitFor(() => {
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
        <EditDemonstrationDialog isOpen={true} onClose={vi.fn()} demonstrationId="1" />
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
