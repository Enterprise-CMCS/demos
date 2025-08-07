import React from "react";

import { describe, expect, it } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

import { ExtensionTable, ExtensionTableRow } from "./ExtensionTable";

const mockData = [
  {
    name: "Extension 1",
    extensionStatus: {
      name: "Pending Review",
    },
    effectiveDate: new Date("2025-08-15"),
  },
  {
    name: "Extension 2",
    extensionStatus: {
      name: "Approved",
    },
    effectiveDate: new Date("2024-10-01"),
  },
] satisfies ExtensionTableRow[];
describe("ExtensionTable", () => {
  it("renders extension rows with correct title, status, and date", () => {
    render(<ExtensionTable extensions={mockData} />);

    expect(screen.getByText("Extension 1")).toBeInTheDocument();
    expect(screen.getByText("Extension 2")).toBeInTheDocument();
    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("08/15/2025")).toBeInTheDocument();
    expect(screen.getByText("10/01/2024")).toBeInTheDocument();
  });

  it("toggles expand section when a row is clicked", () => {
    render(<ExtensionTable extensions={mockData} />);

    // Confirm expanded content not shown initially
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();

    const row = screen.getByText("Extension 1").closest("div")!;
    fireEvent.click(row);

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();
  });
});
