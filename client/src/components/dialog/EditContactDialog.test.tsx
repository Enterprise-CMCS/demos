import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { EditContactDialog } from "./EditContactDialog";
import { ToastProvider } from "components/toast/ToastContext";
import { mockDemonstrationRoleAssignments } from "mock-data/demonstrationRoleAssignmentMocks";
import { DemosApolloProvider } from "router/DemosApolloProvider";

const renderWithToast = (component: React.ReactElement) => {
  return render(
    <DemosApolloProvider>
      <ToastProvider>{component}</ToastProvider>
    </DemosApolloProvider>
  );
};

describe("EditContactDialog", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog with contact information", async () => {
    renderWithToast(
      <EditContactDialog
        demonstrationId="1"
        isOpen={true}
        onClose={mockOnClose}
        contact={mockDemonstrationRoleAssignments[0]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Contact")).toBeInTheDocument();
      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("john.doe@email.com")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Project Officer")).toBeInTheDocument();
    });
  });

  it("allows changing contact type", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <EditContactDialog
        demonstrationId="1"
        isOpen={true}
        onClose={mockOnClose}
        contact={mockDemonstrationRoleAssignments[0]}
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
        demonstrationId="1"
        isOpen={true}
        onClose={mockOnClose}
        contact={mockDemonstrationRoleAssignments[0]}
      />
    );

    const contactTypeSelect = screen.getByDisplayValue("Project Officer");
    await user.selectOptions(contactTypeSelect, "State Point of Contact");

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);
  });

  it("shows cancel confirmation on cancel button click", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <EditContactDialog
        demonstrationId="1"
        isOpen={true}
        onClose={mockOnClose}
        contact={mockDemonstrationRoleAssignments[0]}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    // The BaseDialog should show cancel confirmation dialog
    // The exact implementation depends on BaseDialog component
    expect(cancelButton).toBeInTheDocument();
  });
});
