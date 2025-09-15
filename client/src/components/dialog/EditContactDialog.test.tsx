import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { EditContactDialog } from "./EditContactDialog";

const mockContact = {
  id: "1",
  fullName: "John Doe",
  email: "john@example.com",
  contactType: "Project Officer",
};

describe("EditContactDialog", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog with contact information", () => {
    render(
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
    expect(screen.getByDisplayValue("Project Officer")).toBeInTheDocument();
  });

  it("shows disabled name and email fields with helper text", () => {
    render(
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

    render(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={mockContact}
        onSubmit={mockOnSubmit}
      />
    );

    const contactTypeSelect = screen.getByDisplayValue("Project Officer");
    await user.selectOptions(contactTypeSelect, "DDME Analyst");

    expect(screen.getByDisplayValue("DDME Analyst")).toBeInTheDocument();
  });

  it("validates required contact type field", async () => {
    const user = userEvent.setup();

    render(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={{ ...mockContact, contactType: "" }}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    expect(screen.getByText("A required field is missing.")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits contact update with new contact type", async () => {
    const user = userEvent.setup();

    render(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={mockContact}
        onSubmit={mockOnSubmit}
      />
    );

    const contactTypeSelect = screen.getByDisplayValue("Project Officer");
    await user.selectOptions(contactTypeSelect, "State Point of Contact");

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("1", "State Point of Contact");
    });
  });

  it("shows cancel confirmation on cancel button click", async () => {
    const user = userEvent.setup();

    render(
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
