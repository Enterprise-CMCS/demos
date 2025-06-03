// src/components/table/tables/DemonstrationTable.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";

import DemonstrationTable from "./DemonstrationTable";

// Minimal mock data, as before:
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
];

describe("DemonstrationTable", () => {
  beforeEach(() => {
    // Render fresh before each test
    render(<DemonstrationTable data={mockRawData} columns={[]} />);
  });

  it("renders parent rows (latest entries) but not child rows by default", () => {
    expect(screen.getByText(/Demo A \(latest\)/)).toBeInTheDocument();
    expect(screen.queryByText(/Demo A \(older\)/)).not.toBeInTheDocument();
    expect(screen.getByText(/Demo B \(only\)/)).toBeInTheDocument();
  });

  it("expands to show sub-rows when clicking the expander arrow", async () => {
    const user = userEvent.setup();
    // Click the first expander (“►”)
    const expandButtons = screen.getAllByText("►");
    expect(expandButtons.length).toBeGreaterThan(0);
    await user.click(expandButtons[0]);
    expect(await screen.findByText(/Demo A \(older\)/)).toBeInTheDocument();
    expect(screen.getByText("▼")).toBeInTheDocument();
  });

  it("selects all visible rows when clicking 'Select All' checkbox", async () => {
    const user = userEvent.setup();
    // Grab all checkboxes; first is header “Select All,” rest are row checkboxes
    const allCheckboxes = screen.getAllByRole("checkbox");
    const [selectAllCheckbox, ...rowCheckboxesBefore] = allCheckboxes;

    // Initially none of the row checkboxes should be checked
    rowCheckboxesBefore.forEach((cb) => {
      expect(cb).not.toBeChecked();
    });

    // Click the “Select All” header checkbox
    await user.click(selectAllCheckbox);

    // Now every visible row’s checkbox should be checked
    const rowCheckboxesAfter = screen.getAllByRole("checkbox").slice(1);
    rowCheckboxesAfter.forEach((cb) => {
      expect(cb).toBeChecked();
    });
  });

  it("checks only expanded child rows when expanded and select all is clicked", async () => {
    const user = userEvent.setup();
    // 1) expand parent “Demo A”
    await user.click(screen.getAllByText("►")[0]);
    expect(await screen.findByText(/Demo A \(older\)/)).toBeInTheDocument();

    // 2) Grab all checkboxes again, first is header
    const allCheckboxes = screen.getAllByRole("checkbox");
    const [selectAllCheckbox] = allCheckboxes;

    // 3) Click header “Select All”
    await user.click(selectAllCheckbox);

    // 4) Now *every* visible checkbox (Demo A latest, Demo A older, Demo B only) should be checked
    screen.getAllByRole("checkbox").forEach((cb) => {
      expect(cb).toBeChecked();
    });
  });
});
