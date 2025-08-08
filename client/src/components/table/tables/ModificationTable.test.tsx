import React from "react";

import { describe, expect, it } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

import { ModificationTable, ModificationTableRow } from "./ModificationTable";

const mockExtensions = [
  {
    name: "Extension 1",
    status: {
      name: "Pending Review",
    },
    effectiveDate: new Date("2025-08-15"),
  },
  {
    name: "Extension 2",
    status: {
      name: "Approved",
    },
    effectiveDate: new Date("2024-10-01"),
  },
] satisfies ModificationTableRow[];

const mockAmendments = [
  {
    name: "Amendment 1",
    status: {
      name: "Under Review",
    },
    effectiveDate: new Date("2025-07-21"),
  },
  {
    name: "Amendment 2",
    status: {
      name: "Approved",
    },
    effectiveDate: new Date("2024-09-14"),
  },
] satisfies ModificationTableRow[];

const mockUnknownStatus = [
  {
    name: "Test Item",
    status: {
      name: "Unknown Status",
    },
    effectiveDate: new Date("2025-01-01"),
  },
] satisfies ModificationTableRow[];

describe("ExtensionTable", () => {
  it("renders extension rows with correct title, status, and date", () => {
    render(<ModificationTable modifications={mockExtensions} />);

    expect(screen.getByText("Extension 1")).toBeInTheDocument();
    expect(screen.getByText("Extension 2")).toBeInTheDocument();
    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("08/15/2025")).toBeInTheDocument();
    expect(screen.getByText("10/01/2024")).toBeInTheDocument();
  });

  it("toggles expand section when a row is clicked", () => {
    render(<ModificationTable modifications={mockExtensions} />);

    // Confirm expanded content not shown initially
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();

    const row = screen.getByText("Extension 1").closest("div")!;
    fireEvent.click(row);

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();
  });
});

describe("AmendmentTable", () => {
  it("renders amendment rows with correct title, status, and date", () => {
    render(<ModificationTable modifications={mockAmendments} />);

    expect(screen.getByText("Amendment 1")).toBeInTheDocument();
    expect(screen.getByText("Amendment 2")).toBeInTheDocument();
    expect(screen.getByText("Under Review")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("07/21/2025")).toBeInTheDocument();
    expect(screen.getByText("09/14/2024")).toBeInTheDocument();
  });

  it("toggles expand section when a row is clicked", () => {
    render(<ModificationTable modifications={mockAmendments} />);

    // Confirm expanded content not shown initially
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();

    const row = screen.getByText("Amendment 1").closest("div")!;
    fireEvent.click(row);

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();
  });
});

describe("Status rendering", () => {
  it("renders unknown status without an icon", () => {
    render(<ModificationTable modifications={mockUnknownStatus} />);

    const statusElement = screen.getByText("Unknown Status");
    expect(statusElement).toBeInTheDocument();

    // Check that it's a simple span, not a div with icons
    expect(statusElement.tagName).toBe("SPAN");
    expect(statusElement).toHaveClass("text-sm", "text-gray-700");

    // Ensure no SVG icons are present in the status element
    expect(statusElement.querySelector("svg")).toBeNull();
  });
});
