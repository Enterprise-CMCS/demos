import React from "react";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { ExtensionTable } from "./ExtensionTable";

const mockData = [
  {
    id: "1",
    title: "Extension 1",
    status: "Pending Review",
    effectiveDate: "2025-08-15",
  },
  {
    id: "2",
    title: "Extension 2",
    status: "Approved",
    effectiveDate: "2024-10-01",
  },
];

describe("ExtensionTable", () => {
  it("renders extension rows with correct title, status, and date", () => {
    render(<ExtensionTable data={mockData} demonstrationId="demo-123" />);

    expect(screen.getByText("Extension 1")).toBeInTheDocument();
    expect(screen.getByText("Extension 2")).toBeInTheDocument();
    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("08/15/2025")).toBeInTheDocument();
    expect(screen.getByText("10/01/2024")).toBeInTheDocument();
  });

  it("toggles expand section when a row is clicked", () => {
    render(<ExtensionTable data={mockData} demonstrationId="demo-123" />);

    // Confirm expanded content not shown initially
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();

    const row = screen.getByText("Extension 1").closest("div")!;
    fireEvent.click(row);

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();
  });
});
