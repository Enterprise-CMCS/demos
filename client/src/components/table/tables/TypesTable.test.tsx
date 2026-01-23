import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TypesTable } from "./TypesTable";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";

const mockTypes: DemonstrationDetailDemonstrationType[] = [
  {
    demonstrationType: "Environmental",
    status: "Active",
    effectiveDate: new Date("2023-01-01"),
    expirationDate: new Date("2024-01-01"),
  },
  {
    demonstrationType: "Economic",
    status: "Inactive",
    effectiveDate: new Date("2024-01-01"),
    expirationDate: new Date("2025-01-01"),
  },
];

describe("TypesTable", () => {
  it("renders required columns", async () => {
    render(<TypesTable types={mockTypes} />);
    await waitFor(() => screen.getByRole("table"));

    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Effective Date")).toBeInTheDocument();
    expect(screen.getByText("Expiration Date")).toBeInTheDocument();
  });

  it("renders type rows", () => {
    render(<TypesTable types={mockTypes} />);

    expect(screen.getByText("Environmental")).toBeInTheDocument();
    expect(screen.getByText("Economic")).toBeInTheDocument();
  });

  it("shows empty message when no types exist", () => {
    render(<TypesTable types={[]} />);

    expect(
      screen.getByText("You have no assigned Types at this time")
    ).toBeInTheDocument();
  });

  it("supports keyword search filtering", async () => {
    render(<TypesTable types={mockTypes} />);
    const user = userEvent.setup();
    const searchInput = screen.getByLabelText(/input keyword search query/i);

    await user.type(searchInput, "Economic");

    await waitFor(() => {
      expect(screen.getByText("Economic")).toBeInTheDocument();
      expect(screen.queryByText("Environmental")).not.toBeInTheDocument();
    });
  });

  it("does not render keyword search when hideSearch is true", () => {
    render(<TypesTable types={mockTypes} hideSearch />);

    expect(
      screen.queryByLabelText(/input keyword search query/i)
    ).not.toBeInTheDocument();
  });

  it("defaults to sorting by Effective Date ascending (oldest first)", () => {
    render(<TypesTable types={mockTypes} />);
    const rows = screen.getAllByRole("row").slice(1);

    const types = rows.map((row) => row.querySelectorAll("td")[1]?.textContent);
    expect(types).toEqual(["Environmental", "Economic"]);
  });

  it("allows sorting by Status column", async () => {
    render(<TypesTable types={mockTypes} />);
    const user = userEvent.setup();
    const statusHeader = screen.getByRole("columnheader", { name: /status/i });

    await user.click(statusHeader);

    const rows = screen.getAllByRole("row").slice(1);
    const statuses = rows.map(
      (row) => row.querySelectorAll("td")[2]?.textContent
    );

    expect(statuses).toEqual(["Active", "Inactive"]);
  });

  it("does not render keyword search when hideSearch is true", () => {
    render(<TypesTable types={mockTypes} hideSearch />);
    expect(screen.queryByTestId("input-keyword-search")).not.toBeInTheDocument();
  });

  it("disables action buttons when inputDisabled is true", () => {
    render(<TypesTable types={mockTypes} inputDisabled />);

    const addButton = screen.getByTestId("add-type");
    const editButton = screen.getByTestId("edit-type");
    const removeButton = screen.getAllByTestId("remove-type")[0]; // only one remove button enabled initially

    expect(addButton).toBeDisabled();
    expect(editButton).toBeDisabled();
    expect(removeButton).toBeDisabled();
  });
});
