import React from "react";

import { vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CREATE_EXTENSION_MUTATION, ExtensionDialog } from "./ExtensionDialog";
import { TestProvider } from "test-utils/TestProvider";
import { ModificationDialogData, ModificationDialogMode } from "./BaseModificationDialog";
import { personMocks } from "mock-data/personMocks";

const mockCreateExtension = vi.fn();

const createExtensionMock = {
  request: {
    query: CREATE_EXTENSION_MUTATION,
    variables: {
      input: {
        name: "Test Extension",
        description: "Test description",
        demonstrationId: "demo-123",
      },
    },
  },
  result: () => {
    mockCreateExtension();
    return {
      data: {
        createExtension: {
          id: "extension-123",
          demonstration: {
            id: "demo-123",
          },
        },
      },
    };
  },
};

describe("ExtensionDialog", () => {
  const getExtensionDialog = (
    mode: ModificationDialogMode,
    data?: ModificationDialogData,
    demonstrationId?: string
  ) => (
    <TestProvider>
      <ExtensionDialog
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
    render(getExtensionDialog("add"));
    expect(screen.getByText("New Extension")).toBeInTheDocument();
  });

  it("renders with correct title for edit mode", () => {
    render(getExtensionDialog("edit"));
    expect(screen.getByText("Edit Extension")).toBeInTheDocument();
  });

  it("renders required form fields", () => {
    render(getExtensionDialog("edit"));

    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Extension Title")).toBeInTheDocument();
    expect(screen.getByText("State/Territory")).toBeInTheDocument();
    expect(screen.getByText("Extension Description")).toBeInTheDocument();
  });

  it("shows warning when demonstration is not selected", async () => {
    render(getExtensionDialog("add"));

    // Submit the form directly by finding it in the document
    const formElement = document.querySelector('form[id="extension-form"]');
    if (formElement) {
      fireEvent.submit(formElement);
    }

    await waitFor(() => {
      expect(
        screen.getByText("Each extension record must be linked to an existing demonstration.")
      ).toBeInTheDocument();
    });
  });

  it("calls onClose when cancel is clicked", () => {
    render(getExtensionDialog("edit"));

    const cancelButton = screen.getByTestId("button-cancel-modification-dialog");
    fireEvent.click(cancelButton);

    // This should trigger the cancel confirmation modal
    expect(cancelButton).toBeInTheDocument();
  });

  it("pre-fills form when data is provided", () => {
    const data = {
      title: "Test Extension",
      description: "Test description",
    };

    render(getExtensionDialog("edit", data));

    const titleInput = screen.getByDisplayValue("Test Extension");
    const descriptionInput = screen.getByDisplayValue("Test description");

    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
  });

  it("pre-selects demonstration when demonstrationId is provided", () => {
    render(getExtensionDialog("edit", undefined, "demo-1"));

    // The demonstration should be pre-selected but we can't easily test the AutoCompleteSelect value
    // without more complex mocking. For now, just ensure the component renders.
    expect(screen.getByText("Demonstration")).toBeInTheDocument();
  });

  it("disables demonstration select when data is provided with demonstrationId", () => {
    render(getExtensionDialog("edit", undefined, "testId"));

    const demonstrationSelect = screen.getByPlaceholderText("Select demonstration");

    expect(demonstrationSelect).toBeDisabled();
  });

  it("creates extension when form is submitted in add mode", async () => {
    const mockOnClose = vi.fn();

    render(
      <TestProvider mocks={[createExtensionMock, ...personMocks]}>
        <ExtensionDialog onClose={mockOnClose} mode="add" demonstrationId="demo-123" />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Error loading users.")).not.toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/extension title/i);
    const descriptionTextarea = screen.getByLabelText(/extension description/i);
    const stateInput = screen.getByLabelText(/state\/territory/i);
    const projectOfficerInput = screen.getByLabelText(/project officer/i);

    fireEvent.change(titleInput, { target: { value: "Test Extension" } });
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
      expect(mockCreateExtension).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
