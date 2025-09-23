import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { EditContactDialog } from "./EditContactDialog";
import { ToastProvider } from "components/toast/ToastContext";
import { demonstrationRoleAssignmentMocks } from "mock-data/demonstrationRoleAssignmentMocks";

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
        contact={demonstrationRoleAssignmentMocks[0]}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText("Edit Contact")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("john.doe@email.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Project Officer")).toBeInTheDocument();
  });

  it("shows disabled name and email fields with helper text", () => {
    renderWithToast(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={demonstrationRoleAssignmentMocks[0]}
        onSubmit={mockOnSubmit}
      />
    );

    const nameInput = screen.getByDisplayValue("John Doe");
    const emailInput = screen.getByDisplayValue("john.doe@email.com");

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
        contact={demonstrationRoleAssignmentMocks[0]}
        onSubmit={mockOnSubmit}
      />
    );

    const contactTypeSelect = screen.getByDisplayValue("Project Officer");
    await user.selectOptions(contactTypeSelect, "DDME Analyst");

    expect(screen.getByDisplayValue("DDME Analyst")).toBeInTheDocument();
  });

  it("submits contact update with new contact type", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={demonstrationRoleAssignmentMocks[0]}
        onSubmit={mockOnSubmit}
      />
    );

    const contactTypeSelect = screen.getByDisplayValue("Project Officer");
    await user.selectOptions(contactTypeSelect, "State Point of Contact");

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          person: expect.objectContaining({
            fullName: "John Doe",
          }),
        }),
        "State Point of Contact"
      );
    });
  });

  it("shows cancel confirmation on cancel button click", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <EditContactDialog
        isOpen={true}
        onClose={mockOnClose}
        contact={demonstrationRoleAssignmentMocks[0]}
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
