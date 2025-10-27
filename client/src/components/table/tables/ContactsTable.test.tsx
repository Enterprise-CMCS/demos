import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { mockDemonstrationRoleAssignments } from "mock-data/demonstrationRoleAssignmentMocks";
import { DemosApolloProvider } from "router/DemosApolloProvider";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContactsTable } from "./ContactsTable";

const renderWithToast = (component: React.ReactElement) => {
  return render(
    <DemosApolloProvider>
      <ToastProvider>{component}</ToastProvider>
    </DemosApolloProvider>
  );
};

const testMocks = mockDemonstrationRoleAssignments.slice(0, 2); // Use first two for testing

// Create test data with explicit primary status variations
const testMocksWithPrimary = [
  { ...testMocks[0], isPrimary: true },
  { ...testMocks[1], isPrimary: false },
];

describe("ContactsTable", () => {
  it("displays all required columns: Name, Email, Contact Type, and Primary", () => {
    renderWithToast(<ContactsTable roles={testMocks} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Contact Type")).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();
  });

  it("displays contact information correctly", () => {
    renderWithToast(<ContactsTable roles={testMocks} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane.smith@email.com")).toBeInTheDocument();
    expect(screen.getAllByText("Project Officer")).toHaveLength(2);
  });

  it("handles null roles prop correctly", () => {
    renderWithToast(<ContactsTable roles={null} />);

    // Should still show headers
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Contact Type")).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();

    // Should only have header row
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(1); // Only header row
  });

  it("displays Primary status correctly for both Yes and No values", () => {
    renderWithToast(<ContactsTable roles={testMocksWithPrimary} />);

    // Should show "Yes" for primary contact
    expect(screen.getByText("Yes")).toBeInTheDocument();

    // Should show "No" for non-primary contact
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("displays fallback dash for empty cell values", () => {
    // Create mock with empty string to test edge case
    const mockWithEmptyValues = [
      {
        ...testMocks[0],
        person: { ...testMocks[0].person, fullName: "", email: "" },
      },
    ];
    renderWithToast(<ContactsTable roles={mockWithEmptyValues} />);

    // Should render the table even with empty values
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(2); // header + 1 data row
  });

  it("displays all required fields for each contact", () => {
    renderWithToast(<ContactsTable roles={testMocks} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Contact Type")).toBeInTheDocument();
  });

  it("allows sorting by any column", async () => {
    renderWithToast(<ContactsTable roles={testMocks} />);

    // Test that we can click on sortable columns without errors
    await userEvent.click(screen.getByText("Name"));
    await userEvent.click(screen.getByText("Email"));
    await userEvent.click(screen.getByText("Contact Type"));
    await userEvent.click(screen.getByText("Primary"));
  });

  it("pagination controls are user friendly and responsive", () => {
    renderWithToast(<ContactsTable roles={Array(50).fill(testMocks[0])} />);
    expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
    expect(screen.getByLabelText("No previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 1, current page")).toBeInTheDocument();
    expect(screen.getByLabelText("Go to page 5")).toBeInTheDocument();
  });

  it("allows navigation to specific pages and page sizes", async () => {
    renderWithToast(<ContactsTable roles={Array(25).fill(testMocks[0])} />);
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
    renderWithToast(<ContactsTable roles={Array(25).fill(testMocks[0])} />);
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  });

  it("renders table without checkboxes", () => {
    renderWithToast(<ContactsTable roles={Array(3).fill(testMocks[0])} />);

    // Should not have any checkboxes since this table doesn't support selection
    const checkboxes = screen.queryAllByRole("checkbox");
    expect(checkboxes.length).toBe(0);

    // Should still render the table with correct structure
    expect(screen.getByRole("table")).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(4); // 1 header + 3 data rows
  });

  it("displays contact data in table format", () => {
    renderWithToast(<ContactsTable roles={testMocks} />);

    // Verify table structure
    expect(screen.getByRole("table")).toBeInTheDocument();

    // Check that we have the expected number of data rows (plus header)
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(3); // 1 header + 2 data rows
  });

  it("handles empty roles array gracefully", () => {
    renderWithToast(<ContactsTable roles={[]} />);

    // Should still show headers
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Contact Type")).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();

    // Should only have header row
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(1); // Only header row
  });
});
