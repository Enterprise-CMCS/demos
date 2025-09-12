import React from "react";

import { describe, expect, it } from "vitest";

import { fireEvent, render, screen, within } from "@testing-library/react";

import { ModificationTable } from "./ModificationTable";
import { mockExtensions } from "mock-data/extensionMocks";
import { mockAmendments } from "mock-data/amendmentMocks";

describe("ExtensionTable", () => {
  beforeEach(() => {
    render(
      <ModificationTable
        modifications={mockExtensions.map((extension) => ({
          ...extension,
          status: extension.extensionStatus,
        }))}
      />
    );
  });
  it("renders extension rows with correct title, status, and date", () => {
    const row1 = screen
      .getByText("Extension 1 - Montana Medicaid Waiver")
      .closest(".grid")! as HTMLElement;
    expect(within(row1).getByText("Under Review")).toBeInTheDocument();
    expect(within(row1).getByText("01/01/2025")).toBeInTheDocument();

    const row2 = screen
      .getByText("Extension 2 - Montana Medicaid Waiver")
      .closest(".grid")! as HTMLElement;
    expect(within(row2).getByText("Approved")).toBeInTheDocument();
    expect(within(row2).getByText("02/01/2025")).toBeInTheDocument();
  });

  it("toggles expand section when a row is clicked", () => {
    // Confirm expanded content not shown initially
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();

    const row = screen.getByText("Extension 1 - Montana Medicaid Waiver").closest("div")!;
    fireEvent.click(row);

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();
  });
});

describe("AmendmentTable", () => {
  beforeEach(() => {
    render(
      <ModificationTable
        modifications={mockAmendments.map((amendment) => ({
          ...amendment,
          status: amendment.amendmentStatus,
        }))}
      />
    );
  });
  it("renders amendment rows with correct title, status, and date", () => {
    const row1 = screen
      .getByText("Amendment 1 - Montana Medicaid Waiver")
      .closest(".grid")! as HTMLElement;
    expect(within(row1).getByText("Under Review")).toBeInTheDocument();
    expect(within(row1).getByText("01/01/2025")).toBeInTheDocument();

    const row2 = screen
      .getByText("Amendment 2 - Montana Medicaid Waiver")
      .closest(".grid")! as HTMLElement;
    expect(within(row2).getByText("Approved")).toBeInTheDocument();
    expect(within(row2).getByText("02/01/2025")).toBeInTheDocument();
  });

  it("toggles expand section when a row is clicked", () => {
    // Confirm expanded content not shown initially
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();

    const row = screen.getByText("Amendment 2 - Montana Medicaid Waiver").closest("div")!;
    fireEvent.click(row);

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByText(/Expanded details coming soon/i)).not.toBeInTheDocument();
  });
});

describe("Status rendering", () => {
  it("renders unknown status without an icon", () => {
    render(
      <ModificationTable
        modifications={[
          {
            id: "3",
            name: "Test Item",
            status: {
              name: "Unknown Status",
            },
            effectiveDate: new Date(2025, 0, 1),
          },
        ]}
      />
    );

    const statusElement = screen.getByText("Unknown Status");
    expect(statusElement).toBeInTheDocument();

    // Check that it's a simple span, not a div with icons
    expect(statusElement.tagName).toBe("SPAN");
    expect(statusElement).toHaveClass("text-sm", "text-gray-700");

    // Ensure no SVG icons are present in the status element
    expect(statusElement.querySelector("svg")).toBeNull();
  });
});

describe("Initially expanded row", () => {
  it("automatically expands a row if initiallyExpandedId is provided", () => {
    render(
      <ModificationTable
        modifications={mockExtensions.map((extension) => ({
          ...extension,
          status: extension.extensionStatus,
        }))}
        initiallyExpandedId="1"
      />
    );

    expect(screen.getByText(/Expanded details coming soon/i)).toBeInTheDocument();
  });
});

describe("Date formatting", () => {
  it("renders placeholder for both amendments and extensions when effectiveDate is undefined", () => {
    // Test amendment
    const { rerender } = render(
      <ModificationTable
        modifications={[
          {
            ...mockAmendments[5],
            status: mockAmendments[5].amendmentStatus,
          },
        ]}
      />
    );
    const amendmentRow = screen
      .getByText("Amendment 6 - Florida Health Innovation")
      .closest(".grid")! as HTMLElement;
    expect(within(amendmentRow).getByText("--/--/----")).toBeInTheDocument();

    rerender(
      <ModificationTable
        modifications={[
          {
            ...mockExtensions[2],
            status: mockExtensions[2].extensionStatus,
          },
        ]}
      />
    );
    const extensionRow = screen
      .getByText("Extension 3 - Montana Medicaid Waiver")
      .closest(".grid")! as HTMLElement;
    expect(within(extensionRow).getByText("--/--/----")).toBeInTheDocument();
  });
});
