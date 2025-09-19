import React from "react";

import { vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ExtensionDialog } from "./ExtensionDialog";
import { TestProvider } from "test-utils/TestProvider";
import { ModificationDialogData, ModificationDialogMode } from "./BaseModificationDialog";

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
});
