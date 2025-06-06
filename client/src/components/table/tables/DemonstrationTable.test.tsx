import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";

import { DemonstrationTable } from "./DemonstrationTable";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const mockRawData = [
  {
    id: 1,
    title: "Demo A (latest)",
    demoNumber: "NUM-001",
    description: "Latest version of Demo A",
    evalPeriodStartDate: "2024-01-01",
    evalPeriodEndDate: "2024-06-30",
    demonstrationStatusId: 1,
    stateId: "TX",
    projectOfficer: "Alice",
    createdAt: "2024-06-01T10:00:00.000Z",
    updatedAt: "2024-06-01T10:00:00.000Z",
  },
  {
    id: 2,
    title: "Demo A (older)",
    demoNumber: "NUM-001",
    description: "Older version of Demo A",
    evalPeriodStartDate: "2023-07-01",
    evalPeriodEndDate: "2023-12-31",
    demonstrationStatusId: 1,
    stateId: "TX",
    projectOfficer: "Bob",
    createdAt: "2023-12-01T08:00:00.000Z",
    updatedAt: "2023-12-01T08:00:00.000Z",
  },
  {
    id: 3,
    title: "Demo B (only)",
    demoNumber: "NUM-002",
    description: "Only version of Demo B",
    evalPeriodStartDate: "2024-02-01",
    evalPeriodEndDate: "2024-08-31",
    demonstrationStatusId: 2,
    stateId: "VA",
    projectOfficer: "Carol",
    createdAt: "2024-02-15T12:00:00.000Z",
    updatedAt: "2024-02-15T12:00:00.000Z",
  },
  {
    id: 4,
    title: "Demo C (only)",
    demoNumber: "NUM-003",
    description: "Only version of Demo C",
    evalPeriodStartDate: "2024-03-01",
    evalPeriodEndDate: "2024-09-30",
    demonstrationStatusId: 2,
    stateId: "NY",
    projectOfficer: "Dave",
    createdAt: "2024-03-10T09:00:00.000Z",
    updatedAt: "2024-03-10T09:00:00.000Z",
  },
];

describe("DemonstrationTable", () => {
  beforeEach(() => {
    // Render the table before each test
    render(<DemonstrationTable data={mockRawData} />);
  });

  it("renders the filter dropdown without `expander` or `select` options", () => {
    // Find the “Filter by:” dropdown
    const filterSelect = screen.getByLabelText(/filter by:/i);

    // Collect all option textContent
    const options = Array.from(
      filterSelect.querySelectorAll("option")
    ).map((opt) => opt.textContent);

    // Neither “expander” nor “select” should appear
    expect(options).not.toContain("expander");
    expect(options).not.toContain("select");

    // But real columns should appear
    expect(options).toContain("State/Territory");
    expect(options).toContain("Number");
    expect(options).toContain("Title");
    expect(options).toContain("Project Officer");
  });

  it("renders parent rows (latest entries) but not child rows by default", () => {
    expect(screen.getByText(/Demo A \(latest\)/)).toBeInTheDocument();
    expect(screen.queryByText(/Demo A \(older\)/)).not.toBeInTheDocument();
    expect(screen.getByText(/Demo B \(only\)/)).toBeInTheDocument();
    expect(screen.getByText(/Demo C \(only\)/)).toBeInTheDocument();
  });

  it("expands to show sub-rows when clicking the expander arrow", async () => {
    const user = userEvent.setup();
    // Find all expand buttons by aria-label
    const expandButtons = screen.getAllByLabelText("Expand row");
    expect(expandButtons.length).toBeGreaterThan(0);

    // Click the first expander
    await user.click(expandButtons[0]);
    expect(await screen.findByText(/Demo A \(older\)/)).toBeInTheDocument();

    // Now the collapse button should be visible
    expect(screen.getByLabelText("Collapse row")).toBeInTheDocument();
  });

  it("selects all visible rows when clicking 'Select All' checkbox", async () => {
    const user = userEvent.setup();
    const allCheckboxes = screen.getAllByRole("checkbox");
    const [selectAllCheckbox, ...rowCheckboxesBefore] = allCheckboxes;

    // Initially none are checked
    rowCheckboxesBefore.forEach((cb) => {
      expect(cb).not.toBeChecked();
    });

    // Click the “Select All” header checkbox
    await user.click(selectAllCheckbox);

    // After clicking, all visible row checkboxes should be checked
    screen.getAllByRole("checkbox").slice(1).forEach((cb) => {
      expect(cb).toBeChecked();
    });
  });

  it("filters rows correctly when using the dropdown and typing a filter value", async () => {
    const user = userEvent.setup();

    // 1) Select “State/Territory” from the filter dropdown
    const filterSelect = screen.getByLabelText(/filter by:/i);
    await user.selectOptions(filterSelect, ["stateId"]);

    // 2) Now a text input appears next to it
    const filterInput = screen.getByPlaceholderText(/type to filter/i);
    expect(filterInput).toBeInTheDocument();

    // 3) Type “VA”
    await user.type(filterInput, "VA");

    // Only the “VA” row (Demo B) should remain
    expect(screen.getByText(/Demo B \(only\)/)).toBeInTheDocument();
    expect(screen.queryByText(/Demo A \(latest\)/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Demo C \(only\)/)).not.toBeInTheDocument();
  });
});
