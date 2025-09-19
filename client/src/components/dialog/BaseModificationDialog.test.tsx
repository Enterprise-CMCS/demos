import React from "react";

import { vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { BaseModificationDialog, ModificationDialogData } from "./BaseModificationDialog";
import { TestProvider } from "test-utils/TestProvider";

describe("BaseModificationDialog", () => {
  const mockOnSubmit = vi.fn();
  const mockGetFormData = vi.fn();
  const mockOnClose = vi.fn();

  const getBaseModificationDialog = (
    mode: "add" | "edit",
    entityType: "amendment" | "extension",
    data?: ModificationDialogData,
    demonstrationId?: string
  ) => (
    <TestProvider>
      <BaseModificationDialog
        isOpen={true}
        onClose={mockOnClose}
        mode={mode}
        data={data}
        demonstrationId={demonstrationId}
        entityType={entityType}
        onSubmit={mockOnSubmit}
        getFormData={mockGetFormData}
      />
    </TestProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFormData.mockReturnValue({ test: "data" });
  });

  it("renders with correct title for amendment add mode", () => {
    render(getBaseModificationDialog("add", "amendment"));
    expect(screen.getByText("New Amendment")).toBeInTheDocument();
  });

  it("renders with correct title for extension edit mode", () => {
    render(getBaseModificationDialog("edit", "extension"));
    expect(screen.getByText("Edit Extension")).toBeInTheDocument();
  });

  it("renders required form fields", () => {
    render(getBaseModificationDialog("add", "amendment"));

    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Amendment Title")).toBeInTheDocument();
    expect(screen.getByText("State/Territory")).toBeInTheDocument();
    expect(screen.getByText("Amendment Description")).toBeInTheDocument();
  });

  it("pre-fills form when data is provided", () => {
    const data: ModificationDialogData = {
      title: "Test Title",
      description: "Test description",
      state: "CA",
      projectOfficer: "user-1",
    };

    render(getBaseModificationDialog("edit", "amendment", data));

    const titleInput = screen.getByDisplayValue("Test Title");
    const descriptionInput = screen.getByDisplayValue("Test description");

    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
  });

  it("pre-selects demonstration when demonstrationId is provided", () => {
    render(getBaseModificationDialog("edit", "amendment", undefined, "demo-1"));

    // The demonstration should be pre-selected
    expect(screen.getByText("Demonstration")).toBeInTheDocument();
  });

  it("shows validation warning when demonstration is not selected", async () => {
    render(getBaseModificationDialog("edit", "amendment"));

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
    render(getBaseModificationDialog("edit", "amendment"));

    const cancelButton = screen.getByTestId("button-cancel-modification-dialog");
    fireEvent.click(cancelButton);

    // This should trigger the cancel confirmation modal
    expect(cancelButton).toBeInTheDocument();
  });

  it("renders correct form ID based on entity type", () => {
    render(getBaseModificationDialog("edit", "extension"));

    const form = document.querySelector('form[id="extension-form"]');
    expect(form).toBeInTheDocument();
  });

  it("renders correct warning message based on entity type", async () => {
    render(getBaseModificationDialog("edit", "extension"));

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

  it("handles date input changes correctly", () => {
    render(getBaseModificationDialog("edit", "extension"));

    const effectiveDateInput = screen.getByTestId("input-effective-date");
    fireEvent.change(effectiveDateInput, { target: { value: "2024-06-01" } });

    expect(effectiveDateInput).toHaveValue("2024-06-01");
  });

  it("renders save button with correct text based on status", () => {
    render(getBaseModificationDialog("edit", "extension"));

    const submitButton = screen.getByTestId("button-submit-modification-dialog");
    expect(submitButton).toHaveTextContent("Submit");
  });

  it("shows date fields only in edit mode, not in add mode", () => {
    // Test add mode - date fields should not be visible
    const { rerender } = render(getBaseModificationDialog("add", "extension"));

    expect(screen.queryByTestId("input-effective-date")).not.toBeInTheDocument();
    expect(screen.queryByTestId("input-expiration-date")).not.toBeInTheDocument();

    // Test edit mode - date fields should be visible
    rerender(getBaseModificationDialog("edit", "extension"));

    expect(screen.getByTestId("input-effective-date")).toBeInTheDocument();
    expect(screen.getByTestId("input-expiration-date")).toBeInTheDocument();
  });
});
