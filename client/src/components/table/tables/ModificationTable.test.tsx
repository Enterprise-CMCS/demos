import React from "react";

import { mockAmendments } from "mock-data/amendmentMocks";
import { mockExtensions } from "mock-data/extensionMocks";
import { describe, expect, it } from "vitest";

import { fireEvent, render, screen, within } from "@testing-library/react";

import { ModificationTable } from "./ModificationTable";

describe("ExtensionTable", () => {
  beforeEach(() => {
    render(
      <ModificationTable
        modificationType="Extension"
        modifications={mockExtensions.map((extension) => ({
          ...extension,
          status: extension.status,
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
        modificationType="Amendment"
        modifications={mockAmendments.map((amendment) => ({
          ...amendment,
          status: amendment.status,
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

describe("Initially expanded row", () => {
  it("automatically expands a row if initiallyExpandedId is provided", () => {
    render(
      <ModificationTable
        modificationType="Extension"
        modifications={mockExtensions.map((extension) => ({
          ...extension,
          status: extension.status,
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
        modificationType="Amendment"
        modifications={[
          {
            ...mockAmendments[5],
            status: mockAmendments[5].status,
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
        modificationType="Extension"
        modifications={[
          {
            ...mockExtensions[2],
            status: mockExtensions[2].status,
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

describe("Empty table message", () => {
  it("displays correct empty message for amendments when no modifications are provided", () => {
    render(<ModificationTable modificationType="Amendment" modifications={[]} />);

    expect(
      screen.getByText("There are currently no amendments for this demonstration.")
    ).toBeInTheDocument();
    expect(
      screen.getByText('To add a new amendment, click the "Add New" button.')
    ).toBeInTheDocument();
  });

  it("displays correct empty message for extensions when no modifications are provided", () => {
    render(<ModificationTable modificationType="Extension" modifications={[]} />);

    expect(
      screen.getByText("There are currently no extensions for this demonstration.")
    ).toBeInTheDocument();
    expect(
      screen.getByText('To add a new extension, click the "Add New" button.')
    ).toBeInTheDocument();
  });

  it("does not display empty message when modifications are present", () => {
    render(
      <ModificationTable
        modificationType="Amendment"
        modifications={mockAmendments.map((amendment) => ({
          ...amendment,
          status: amendment.status,
        }))}
      />
    );

    expect(
      screen.queryByText("There are currently no amendments for this demonstration.")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('To add a new amendment, click the "Add New" button.')
    ).not.toBeInTheDocument();
  });
});
