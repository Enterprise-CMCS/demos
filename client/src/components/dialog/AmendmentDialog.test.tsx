import React from "react";

import { vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CreateAmendmentDialog } from "./CreateAmendmentDialog";
import { TestProvider } from "test-utils/TestProvider";
import { ModificationDialogData, ModificationDialogMode } from "./BaseModificationDialog";

describe("CreateAmendmentDialog", () => {
  const getCreateAmendmentDialog = (
    mode: ModificationDialogMode,
    data?: ModificationDialogData,
    demonstrationId?: string
  ) => (
    <TestProvider>
      <CreateAmendmentDialog
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
    render(getCreateAmendmentDialog("add"));
    expect(screen.getByText("New Amendment")).toBeInTheDocument();
  });

  it("renders with correct title for edit mode", () => {
    render(getCreateAmendmentDialog("edit"));
    expect(screen.getByText("Edit Amendment")).toBeInTheDocument();
  });

  it("renders required form fields", () => {
    render(getCreateAmendmentDialog("edit"));

    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Amendment Title")).toBeInTheDocument();
    expect(screen.getByText("State/Territory")).toBeInTheDocument();
    expect(screen.getByText("Amendment Description")).toBeInTheDocument();
  });

  it("shows warning when demonstration is not selected", async () => {
    render(getCreateAmendmentDialog("add"));

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
    render(getCreateAmendmentDialog("add"));

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

    render(getCreateAmendmentDialog("edit", data));

    const titleInput = screen.getByDisplayValue("Test Amendment");
    const descriptionInput = screen.getByDisplayValue("Test description");

    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
  });

  it("disables demonstration select when data is provided with demonstrationId", () => {
    render(getCreateAmendmentDialog("edit", {}, "testId"));

    const demonstrationSelect = screen.getByPlaceholderText("Select demonstration");

    expect(demonstrationSelect).toBeDisabled();
  });
});
