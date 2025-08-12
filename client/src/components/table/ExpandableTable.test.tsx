import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExpandableTable } from "./ExpandableTable"; // adjust path as needed
import type { ColumnDef } from "@tanstack/react-table";

type MockRow = {
  id: string;
  title: string;
  status: string;
  effectiveDate: string;
};

const mockColumns: ColumnDef<MockRow>[] = [];

const mockData: MockRow[] = [
  {
    id: "1",
    title: "Row One",
    status: "Under Review",
    effectiveDate: "2025-07-21",
  },
  {
    id: "2",
    title: "Row Two",
    status: "Approved",
    effectiveDate: "2024-09-14",
  },
];

describe("ExpandableTable", () => {
  it("renders rows with title, status, and formatted date", () => {
    render(
      <ExpandableTable
        data={mockData}
        columns={mockColumns}
      />
    );

    expect(screen.getByText("Row One")).toBeInTheDocument();
    expect(screen.getByText("Row Two")).toBeInTheDocument();
    expect(screen.getByText("Under Review")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("07/21/2025")).toBeInTheDocument();
    expect(screen.getByText("09/14/2024")).toBeInTheDocument();
  });

  it("toggles expanded section when a row is clicked", () => {
    render(<ExpandableTable data={mockData} columns={mockColumns} />);

    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();

    const row = screen.getByText("Row One").closest("div")!;
    fireEvent.click(row);

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();
  });

  it("automatically expands a row if initiallyExpandedId is provided", () => {
    render(
      <ExpandableTable
        data={mockData}
        columns={mockColumns}
        initiallyExpandedId="1"
      />
    );

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();
  });
});
