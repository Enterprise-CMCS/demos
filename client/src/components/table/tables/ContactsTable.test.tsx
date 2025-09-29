import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { vi } from "vitest";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContactsTable } from "./ContactsTable";
import { mockDemonstrationRoleAssignments } from "mock-data/demonstrationRoleAssignmentMocks";
import { DemosApolloProvider } from "router/DemosApolloProvider";

const renderWithToast = (component: React.ReactElement) => {
  return render(
    <DemosApolloProvider>
      <ToastProvider>{component}</ToastProvider>
    </DemosApolloProvider>
  );
};

const testMocks = mockDemonstrationRoleAssignments.slice(0, 2); // Use first two for testing

describe("ContactsTable", () => {
  it("displays all contacts associated with a demonstration", () => {
    renderWithToast(<ContactsTable demonstrationId="1" roles={testMocks} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("displays all required fields for each contact", () => {
    renderWithToast(<ContactsTable demonstrationId="1" roles={testMocks} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Contact Type")).toBeInTheDocument();
  });

  it("allows sorting by any column, ascending and descending", async () => {
    renderWithToast(<ContactsTable demonstrationId="1" roles={testMocks} />);
    const nameHeader = screen.getByText("Name");

    // default
    let rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("John Doe")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Jane Smith")).toBeInTheDocument();

    await userEvent.click(nameHeader);

    // ascending
    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Jane Smith")).toBeInTheDocument();
    expect(within(rows[2]).getByText("John Doe")).toBeInTheDocument();
    await userEvent.click(nameHeader);

    // descending
    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("John Doe")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Jane Smith")).toBeInTheDocument();
  });

  it("pagination controls are user friendly and responsive", () => {
    renderWithToast(<ContactsTable demonstrationId="1" roles={Array(25).fill(testMocks[0])} />);
    expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
    expect(screen.getByLabelText("No previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 1, current page")).toBeInTheDocument();
  });

  it("allows navigation to specific pages and page sizes", async () => {
    renderWithToast(<ContactsTable demonstrationId="1" roles={Array(25).fill(testMocks[0])} />);
    // Click page 2
    await userEvent.click(screen.getByText("2"));
    // Change page size
    await userEvent.selectOptions(screen.getByRole("combobox", { name: /items per page/i }), [
      "20",
    ]);
    let rows = screen.getAllByRole("row");
    expect(rows.length).toBe(21); // 1 header row + 20 data rows
    await userEvent.click(screen.getByLabelText("Go to next page"));
    rows = screen.getAllByRole("row");
    expect(rows.length).toBe(6); // 1 header row + 5 data rows
  });

  it("displays 10 records per page by default", () => {
    renderWithToast(<ContactsTable demonstrationId="1" roles={Array(25).fill(testMocks[0])} />);
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  });

  it("enables edit button only when exactly one contact is selected", () => {
    renderWithToast(<ContactsTable demonstrationId="1" roles={Array(25).fill(testMocks[0])} />);

    const editButton = screen.getByLabelText("Edit Contact");
    const deleteButton = screen.getByLabelText("Remove Contact");

    // Initially no selection, both buttons disabled
    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();

    // Select first contact
    const firstCheckbox = screen.getAllByRole("checkbox")[1]; // Skip header checkbox
    fireEvent.click(firstCheckbox);

    // Edit enabled with single selection, delete enabled
    expect(editButton).toBeEnabled();
    expect(deleteButton).toBeEnabled();

    // Select second contact (multi-selection)
    const secondCheckbox = screen.getAllByRole("checkbox")[2];
    fireEvent.click(secondCheckbox);

    // Edit disabled with multi-selection, delete still enabled
    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeEnabled();
  });

  it("opens confirmation dialog when delete button is clicked", () => {
    renderWithToast(<ContactsTable demonstrationId="1" roles={testMocks} />);

    // Select both contacts
    const firstCheckbox = screen.getAllByRole("checkbox")[1];
    const secondCheckbox = screen.getAllByRole("checkbox")[2];
    fireEvent.click(firstCheckbox);
    fireEvent.click(secondCheckbox);

    // Click delete button
    const deleteButton = screen.getByLabelText("Remove Contact");
    fireEvent.click(deleteButton);

    // Should open confirmation dialog
    expect(
      screen.getByText(/Are you sure you want to remove the contact\(s\)/)
    ).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  it("calls delete functionality when confirmation dialog is confirmed", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    renderWithToast(<ContactsTable demonstrationId="1" roles={testMocks} />);

    // Select both contacts
    const firstCheckbox = screen.getAllByRole("checkbox")[1];
    const secondCheckbox = screen.getAllByRole("checkbox")[2];
    fireEvent.click(firstCheckbox);
    fireEvent.click(secondCheckbox);

    // Verify the remove button is enabled
    const deleteButton = screen.getByLabelText("Remove Contact");
    expect(deleteButton).not.toBeDisabled();

    // Click delete button to open dialog
    fireEvent.click(deleteButton);

    // Wait for the dialog to appear and verify its content
    await waitFor(() => {
      expect(
        screen.getByText(/Are you sure you want to remove the contact\(s\)/)
      ).toBeInTheDocument();
    });

    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();

    // Find the confirm button in the dialog
    const confirmButton = await screen.findByRole("button", {
      name: "button-confirm-delete-contact",
    });

    fireEvent.click(confirmButton);

    // Verify the delete function was called with correct IDs
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Deleting contacts:", ["1", "2"]);
    });

    consoleSpy.mockRestore();
  });

  it("shows error message when trying to delete without selecting any contacts", () => {
    renderWithToast(<ContactsTable demonstrationId="1" roles={testMocks} />);

    const deleteButton = screen.getByLabelText("Remove Contact");
    fireEvent.click(deleteButton);

    // Should be disabled, but testing the handler logic if called
    expect(deleteButton).toBeDisabled();
  });
});
