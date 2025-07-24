import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentTable } from "./DocumentTable";

const mockRawDocuments = [
  {
    id: 1,
    title: "Pre-Submission Concept Note",
    description: "Initial proposal for demonstration.",
    type: "Pre-Submission Concept",
    uploadedBy: "Leia Organa",
    uploadDate: "2025-07-10",
    createdAt: "...",
    updatedAt: "...",
  },
  {
    id: 2,
    title: "Budget Summary",
    description: "Summary of Medicaid budget projections.",
    type: "General File",
    uploadedBy: "Han Solo",
    uploadDate: "2025-07-09",
    createdAt: "...",
    updatedAt: "...",
  },
  {
    id: 3,
    title: "State Plan Amendment",
    description: "Amendment submission for review.",
    type: "General File",
    uploadedBy: "Luke Skywalker",
    uploadDate: "2025-07-08",
    createdAt: "...",
    updatedAt: "...",
  },
];

describe("DocumentTable", () => {
  beforeEach(() => {
    render(<DocumentTable data={mockRawDocuments} />);
  });

  it("renders the filter dropdown initially", () => {
    expect(screen.getByLabelText(/filter by:/i)).toBeInTheDocument();
  });

  it("renders all document titles initially", () => {
    expect(screen.getByText("Pre-Submission Concept Note")).toBeInTheDocument();
    expect(screen.getByText("Budget Summary")).toBeInTheDocument();
    expect(screen.getByText("State Plan Amendment")).toBeInTheDocument();
  });

  it("filters documents by upload date when 'Upload Date' filter is used", async () => {
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/filter by:/i), ["uploadDate"]);

    const dateInput = screen.getByTestId("upload-date-filter");
    expect(dateInput).toBeInTheDocument();

    // Type a date matching only one document
    await user.type(dateInput, "2025-07-09");

    const table = screen.getByRole("table");

    // Should show "Budget Summary" only
    expect(within(table).getByText("Budget Summary")).toBeInTheDocument();

    // Should NOT show other document titles
    expect(within(table).queryByText("Pre-Submission Concept Note")).toBeNull();
    expect(within(table).queryByText("State Plan Amendment")).toBeNull();
  });

  it("shows no documents if filter matches none", async () => {
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/filter by:/i), ["type"]);

    const typeInput = screen.getByPlaceholderText("Select document type");
    await user.type(typeInput, "NonexistentType");

    const table = screen.getByRole("table");

    // No documents should appear
    expect(within(table).queryByRole("row", { name: /document/i })).toBeNull();
  });

  it("defaults to sorting by uploadDate descending (newest first)", () => {
    const rows = screen.getAllByRole("row").slice(1); // skip header

    const titles = rows.map(row => {
      const cells = row.querySelectorAll("td");
      return cells[1]?.textContent?.trim() || "";
    });

    expect(titles).toEqual([
      "Pre-Submission Concept Note",
      "Budget Summary",
      "State Plan Amendment",
    ]);
  });
});
