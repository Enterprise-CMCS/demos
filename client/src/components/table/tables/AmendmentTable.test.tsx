import React from "react";

import { describe, expect, it } from "vitest"; // or use `jest` if you're using Jest

import { fireEvent, render, screen } from "@testing-library/react";

import { AmendmentTable, AmendmentTableRow } from "./AmendmentTable";

const mockData = [
  {
    name: "Amendment 1",
    amendmentStatus: {
      name: "Under Review",
    },
    effectiveDate: new Date("2025-07-21"),
  },
  {
    name: "Amendment 2",
    amendmentStatus: {
      name: "Approved",
    },
    effectiveDate: new Date("2024-09-14"),
  },
] satisfies AmendmentTableRow[];

describe("AmendmentTable", () => {
  it("renders amendment rows with correct title, status, and date", () => {
    render(<AmendmentTable amendments={mockData} />);

    expect(screen.getByText("Amendment 1")).toBeInTheDocument();
    expect(screen.getByText("Amendment 2")).toBeInTheDocument();
    expect(screen.getByText("Under Review")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("07/21/2025")).toBeInTheDocument();
    expect(screen.getByText("09/14/2024")).toBeInTheDocument();
  });

  it("toggles expand section when a row is clicked", () => {
    render(<AmendmentTable amendments={mockData} />);

    // Confirm expanded content not shown initially
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();

    const row = screen.getByText("Amendment 1").closest("div")!;
    fireEvent.click(row);

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();
  });
});
