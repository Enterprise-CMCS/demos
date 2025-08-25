import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Contact, ContactsTable } from "./ContactsTable";

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
    contactType: "State Representative",
  },
];

describe("ContactsTable", () => {
  it("displays all contacts associated with a demonstration", () => {
    render(<ContactsTable contacts={contacts} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("displays all required fields for each contact", () => {
    render(<ContactsTable contacts={contacts} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Contact Type")).toBeInTheDocument();
  });

  it('displays a dash "-" for missing field values', () => {
    render(<ContactsTable contacts={contacts} />);
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("allows sorting by any column, ascending and descending", async () => {
    render(<ContactsTable contacts={contacts} />);
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
    render(<ContactsTable contacts={Array(25).fill(contacts[0])} />);
    expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();
    expect(screen.getByLabelText("No previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 1, current page")).toBeInTheDocument();
  });

  it("allows navigation to specific pages and page sizes", async () => {
    render(<ContactsTable contacts={Array(25).fill(contacts[0])} />);
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
    render(<ContactsTable contacts={Array(15).fill(contacts[0])} />);
    const rows = screen.getAllByRole("row");
    // 1 header row + 10 data rows
    expect(rows.length).toBe(11);
  });
});
