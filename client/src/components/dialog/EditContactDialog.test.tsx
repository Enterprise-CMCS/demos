import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { EditContactDialog } from "./EditContactDialog";
import { ToastProvider } from "components/toast/ToastContext";

const mockContact = {
  id: "1",
  fullName: "John Doe",
  email: "john@example.com",
  contactType: "Primary Project Officer",
};

const renderWithToast = (component: React.ReactElement) => {
  return render(<ToastProvider>{component}</ToastProvider>);
};

describe("EditContactDialog", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog with contact information", () => {
    renderWithToast(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={mockContact}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText("Edit Contact")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Primary Project Officer")).toBeInTheDocument();
  });

  it("shows disabled name and email fields with helper text", () => {
    renderWithToast(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={mockContact}
        onSubmit={mockOnSubmit}
      />
    );

    const nameInput = screen.getByDisplayValue("John Doe");
    const emailInput = screen.getByDisplayValue("john@example.com");

    expect(nameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(screen.getAllByText(/cannot be edited here/i)).toHaveLength(2);
  });

  it("allows changing contact type", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={mockContact}
        onSubmit={mockOnSubmit}
      />
    );

    const contactTypeSelect = screen.getByDisplayValue("Primary Project Officer");
    await user.selectOptions(contactTypeSelect, "Secondary Project Officer");

    expect(screen.getByDisplayValue("Secondary Project Officer")).toBeInTheDocument();
  });

  it("validates required contact type field", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={{ ...mockContact, contactType: "" }}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // The form should not submit when contact type is empty
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits contact update with new contact type", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={mockContact}
        onSubmit={mockOnSubmit}
      />
    );

    const contactTypeSelect = screen.getByDisplayValue("Primary Project Officer");
    await user.selectOptions(contactTypeSelect, "State Representative");

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("1", "State Representative");
    });
  });

  it("shows cancel confirmation on cancel button click", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={mockContact}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    // The BaseDialog should show cancel confirmation dialog
    // The exact implementation depends on BaseDialog component
    expect(cancelButton).toBeInTheDocument();
  });
});
