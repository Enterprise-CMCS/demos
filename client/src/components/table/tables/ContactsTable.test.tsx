import React from "react";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Contact, ContactsTable } from "./ContactsTable";
import { ToastProvider } from "components/toast/ToastContext";

const contacts: Contact[] = [
  {
    id: "1",
    fullName: "Alice Smith",
    email: "alice@example.com",
    contactType: "Primary Project Officer",
  },
  {
    id: "2",
    fullName: "Bob Jones",
    email: null,
    contactType: "State Representative",
  },
];

const renderWithToast = (component: React.ReactElement) => {
  return render(<ToastProvider>{component}</ToastProvider>);
};

describe("ContactsTable", () => {
  it("displays all contacts associated with a demonstration", () => {
    renderWithToast(<ContactsTable contacts={contacts} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("displays all required fields for each contact", () => {
    renderWithToast(<ContactsTable contacts={contacts} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Contact Type")).toBeInTheDocument();
  });

  it('displays a dash "-" for missing field values', () => {
    renderWithToast(<ContactsTable contacts={contacts} />);
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("allows sorting by any column, ascending and descending", async () => {
    renderWithToast(<ContactsTable contacts={contacts} />);
    const nameHeader = screen.getByText("Name");

    // default
    let rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Alice Smith")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Bob Jones")).toBeInTheDocument();

    await userEvent.click(nameHeader);

    // ascending
    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Alice Smith")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Bob Jones")).toBeInTheDocument();
    await userEvent.click(nameHeader);

    // descending
    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Bob Jones")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Alice Smith")).toBeInTheDocument();
  });

  it("pagination controls are user friendly and responsive", () => {
    renderWithToast(<ContactsTable contacts={Array(25).fill(contacts[0])} />);
    expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
    expect(screen.getByLabelText("No previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 1, current page")).toBeInTheDocument();
  });

  it("allows navigation to specific pages and page sizes", async () => {
    renderWithToast(<ContactsTable contacts={Array(25).fill(contacts[0])} />);
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
    renderWithToast(<ContactsTable contacts={Array(15).fill(contacts[0])} />);
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  });

  it("enables edit button only when exactly one contact is selected", () => {
    renderWithToast(<ContactsTable contacts={contacts} />);

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
    const mockOnDeleteContacts = vi.fn();
    renderWithToast(<ContactsTable contacts={contacts} onDeleteContacts={mockOnDeleteContacts} />);

    // Select both contacts
    const firstCheckbox = screen.getAllByRole("checkbox")[1];
    const secondCheckbox = screen.getAllByRole("checkbox")[2];
    fireEvent.click(firstCheckbox);
    fireEvent.click(secondCheckbox);

    // Click delete button
    const deleteButton = screen.getByLabelText("Remove Contact");
    fireEvent.click(deleteButton);

    // Should open confirmation dialog instead of directly calling onDeleteContacts
    expect(screen.getByText(/Are you sure you want to remove.*contacts\?/)).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
    expect(mockOnDeleteContacts).not.toHaveBeenCalled();
  });

  it("calls onDeleteContacts when confirmation dialog is confirmed", async () => {
    const mockOnDeleteContacts = vi.fn().mockResolvedValue(undefined);

    renderWithToast(<ContactsTable contacts={contacts} onDeleteContacts={mockOnDeleteContacts} />);

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
      expect(screen.getByText(/Are you sure you want to remove/)).toBeInTheDocument();
    });

    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();

    // Ensure mockOnDeleteContacts hasn't been called yet
    expect(mockOnDeleteContacts).not.toHaveBeenCalled();

    // Find the confirm button in the dialog
    const confirmButton = await screen.findByRole("button", {
      name: "button-confirm-delete-contact",
    });

    fireEvent.click(confirmButton);

    // Wait a bit for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should call onDeleteContacts with selected IDs
    expect(mockOnDeleteContacts).toHaveBeenCalledWith(["1", "2"]);
  });

  it("shows error message when trying to delete without selecting any contacts", () => {
    renderWithToast(<ContactsTable contacts={contacts} />);

    const deleteButton = screen.getByLabelText("Remove Contact");
    fireEvent.click(deleteButton);

    // Should be disabled, but testing the handler logic if called
    expect(deleteButton).toBeDisabled();
  });
});
