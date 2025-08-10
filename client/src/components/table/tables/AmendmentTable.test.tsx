import React from "react";
import { describe, expect, it } from "vitest"; // or use `jest` if you're using Jest
import { fireEvent, render, screen } from "@testing-library/react";
import { AmendmentTable } from "./AmendmentTable";

const mockData = [
  {
    id: "1",
    title: "Amendment 1",
    status: "Under Review",
    effectiveDate: "2025-07-21",
  },
  {
    id: "2",
    title: "Amendment 2",
    status: "Approved",
    effectiveDate: "2024-09-14",
  },
];

describe("AmendmentTable", () => {
  it("renders amendment rows with correct title, status, and date", () => {
    render(<AmendmentTable data={mockData} demonstrationId="demo-123" />);

    expect(screen.getByText("Amendment 1")).toBeInTheDocument();
    expect(screen.getByText("Amendment 2")).toBeInTheDocument();
    expect(screen.getByText("Under Review")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("07/21/2025")).toBeInTheDocument();
    expect(screen.getByText("09/14/2024")).toBeInTheDocument();
  });

  it("toggles expand section when a row is clicked", () => {
    render(<AmendmentTable data={mockData} demonstrationId="demo-123" />);

    // Confirm expanded content not shown initially
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();

    const row = screen.getByText("Amendment 1").closest("div")!;
    fireEvent.click(row);

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();
  });

  it("automatically expands the row if initiallyExpandedId is provided", () => {
    render(
      <AmendmentTable
        data={mockData}
        demonstrationId="demo-123"
        initiallyExpandedId="1"
      />
    );

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();
  });
});
