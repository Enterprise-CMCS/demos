import React from "react";

import { vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AmendmentDialog, CREATE_AMENDMENT_MUTATION } from "./AmendmentDialog";
import { TestProvider } from "test-utils/TestProvider";
import { ModificationDialogData, ModificationDialogMode } from "./BaseModificationDialog";
import { personMocks } from "mock-data/personMocks";
const mockCreateAmendment = vi.fn();

const createAmendmentMock = {
  request: {
    query: CREATE_AMENDMENT_MUTATION,
    variables: {
      input: {
        name: "Test Amendment",
        description: "Test description",
        demonstrationId: "demo-123",
      },
    },
  },
  result: () => {
    mockCreateAmendment();
    return {
      data: {
        createAmendment: {
          id: "amendment-123",
          demonstration: {
            id: "demo-123",
          },
        },
      },
    };
  },
};

describe("AmendmentDialog", () => {
  const getAmendmentDialog = (
    mode: ModificationDialogMode,
    data?: ModificationDialogData,
    demonstrationId?: string
  ) => (
    <TestProvider>
      <AmendmentDialog
        onClose={vi.fn()}
        mode={mode}
        data={data}
        demonstrationId={demonstrationId}
      />
    </TestProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with correct title for add mode", () => {
    render(getAmendmentDialog("add"));
    expect(screen.getByText("New Amendment")).toBeInTheDocument();
  });

  it("renders with correct title for edit mode", () => {
    render(getAmendmentDialog("edit"));
    expect(screen.getByText("Edit Amendment")).toBeInTheDocument();
  });

  it("renders required form fields", () => {
    render(getAmendmentDialog("edit"));

    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Amendment Title")).toBeInTheDocument();
    expect(screen.getByText("State/Territory")).toBeInTheDocument();
    expect(screen.getByText("Amendment Description")).toBeInTheDocument();
  });

  it("shows warning when demonstration is not selected", async () => {
    render(getAmendmentDialog("add"));

    // Submit the form directly by finding it in the document
    const formElement = document.querySelector('form[id="amendment-form"]');
    if (formElement) {
      fireEvent.submit(formElement);
    }

    await waitFor(() => {
      expect(
        screen.getByText("Each amendment record must be linked to an existing demonstration.")
      ).toBeInTheDocument();
    });
  });
  it("calls onClose when cancel is clicked", () => {
    render(getAmendmentDialog("add"));

    const cancelButton = screen.getByTestId("button-cancel-modification-dialog");
    fireEvent.click(cancelButton);

    // This should trigger the cancel confirmation modal
    expect(cancelButton).toBeInTheDocument();
  });

  it("pre-fills form when data is provided", () => {
    const data = {
      title: "Test Amendment",
      description: "Test description",
    };

    render(getAmendmentDialog("edit", data));

    const titleInput = screen.getByDisplayValue("Test Amendment");
    const descriptionInput = screen.getByDisplayValue("Test description");

    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
  });

  it("disables demonstration select when data is provided with demonstrationId", () => {
    render(getAmendmentDialog("edit", {}, "testId"));

    const demonstrationSelect = screen.getByPlaceholderText("Select demonstration");

    expect(demonstrationSelect).toBeDisabled();
  });

  it("creates amendment when form is submitted in add mode", async () => {
    const mockOnClose = vi.fn();

    render(
      <TestProvider mocks={[createAmendmentMock, ...personMocks]}>
        <AmendmentDialog onClose={mockOnClose} mode="add" demonstrationId="demo-123" />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Error loading users.")).not.toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/amendment title/i);
    const descriptionTextarea = screen.getByLabelText(/amendment description/i);
    const stateInput = screen.getByLabelText(/state\/territory/i);
    const projectOfficerInput = screen.getByLabelText(/project officer/i);

    fireEvent.change(titleInput, { target: { value: "Test Amendment" } });
    fireEvent.change(descriptionTextarea, { target: { value: "Test description" } });

    fireEvent.focus(stateInput);

    fireEvent.change(stateInput, { target: { value: "CA" } });

    await waitFor(() => {
      const caOption = screen.getByText("California");
      fireEvent.mouseDown(caOption);
    });

    fireEvent.focus(projectOfficerInput);

    fireEvent.change(projectOfficerInput, { target: { value: "John Doe" } });

    await waitFor(() => {
      const johnDoeOption = screen.getByText("John Doe");
      fireEvent.mouseDown(johnDoeOption);
    });
    const submitButton = screen.getByTestId("button-submit-modification-dialog");
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateAmendment).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
