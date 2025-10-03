import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CreateDemonstrationDialog, EditDemonstrationDialog } from "./";
import { TestProvider } from "test-utils/TestProvider";
import { GET_DEMONSTRATION_BY_ID_QUERY } from "./EditDemonstrationDialog";

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
  const getCreateDemonstrationDialog = () => {
    return (
      <TestProvider>
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
  const TEST_DEMO_ID = "test-demo-id";
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
          sdgDivision: "Test Division",
          signatureLevel: "Test Level",
          state: {
            id: "test-state-id",
          },
          projectOfficer: {
            id: "test-officer-id",
          },
          effectiveDate: "2023-01-01",
          expirationDate: "2024-01-01",
        },
      },
    },
  };

  const getEditDemonstrationDialog = () => {
    return (
      <TestProvider mocks={[GET_DEMONSTRATION_BY_ID_MOCK]}>
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
    render(getEditDemonstrationDialog());

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
      <TestProvider mocks={[errorMock]}>
        <EditDemonstrationDialog {...DEFAULT_PROPS} demonstrationId="test-demo-id" />
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
});
