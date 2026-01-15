import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DemonstrationTypesList } from "./DemonstrationTypesList";
import { DemonstrationType } from "./ApplyDemonstrationTypesDialog";

// Mock the utility and icon
vi.mock("util/formatDate", () => ({
  formatDate: (date: string) => date, // Return as-is for simple testing
}));

vi.mock("components/icons", () => ({
  DeleteIcon: ({ className }: { className?: string }) => (
    <span data-testid="delete-icon" className={className}>
      ×
    </span>
  ),
}));

describe("DemonstrationTypesList", () => {
  const mockSetDemonstrationTypes = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no demonstration types", () => {
    render(
      <DemonstrationTypesList
        demonstrationTypes={[]}
        setDemonstrationTypes={mockSetDemonstrationTypes}
      />
    );

    expect(screen.getByText(/types to be added \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/no demonstration types added/i)).toBeInTheDocument();
  });

  it("displays correct count of demonstration types", () => {
    const demonstrationTypes: DemonstrationType[] = [
      { tag: "Type A", effectiveDate: "2024-01-01", expirationDate: "2024-12-31" },
      { tag: "Type B", effectiveDate: "2024-02-01", expirationDate: "2024-11-30" },
      { tag: "Type C", effectiveDate: "2024-03-01", expirationDate: "2024-10-31" },
    ];

    render(
      <DemonstrationTypesList
        demonstrationTypes={demonstrationTypes}
        setDemonstrationTypes={mockSetDemonstrationTypes}
      />
    );

    expect(screen.getByText(/types to be added \(3\)/i)).toBeInTheDocument();
  });

  it("renders all demonstration types with their details", () => {
    const demonstrationTypes: DemonstrationType[] = [
      { tag: "Type A", effectiveDate: "2024-01-01", expirationDate: "2024-12-31" },
      { tag: "Type B", effectiveDate: "2024-02-01", expirationDate: "2024-11-30" },
    ];

    render(
      <DemonstrationTypesList
        demonstrationTypes={demonstrationTypes}
        setDemonstrationTypes={mockSetDemonstrationTypes}
      />
    );

    // Check Type A
    expect(screen.getByText("Type A")).toBeInTheDocument();
    expect(screen.getByText(/effective: 2024-01-01/i)).toBeInTheDocument();
    expect(screen.getByText(/expires: 2024-12-31/i)).toBeInTheDocument();

    // Check Type B
    expect(screen.getByText("Type B")).toBeInTheDocument();
    expect(screen.getByText(/effective: 2024-02-01/i)).toBeInTheDocument();
    expect(screen.getByText(/expires: 2024-11-30/i)).toBeInTheDocument();
  });

  it("renders delete button for each demonstration type", () => {
    const demonstrationTypes: DemonstrationType[] = [
      { tag: "Type A", effectiveDate: "2024-01-01", expirationDate: "2024-12-31" },
      { tag: "Type B", effectiveDate: "2024-02-01", expirationDate: "2024-11-30" },
    ];

    render(
      <DemonstrationTypesList
        demonstrationTypes={demonstrationTypes}
        setDemonstrationTypes={mockSetDemonstrationTypes}
      />
    );

    const removeButtons = screen.getAllByRole("button");
    expect(removeButtons).toHaveLength(2);
  });

  it("calls setDemonstrationTypes to remove type when delete button clicked", async () => {
    const user = userEvent.setup();
    const demonstrationTypes: DemonstrationType[] = [
      { tag: "Type A", effectiveDate: "2024-01-01", expirationDate: "2024-12-31" },
      { tag: "Type B", effectiveDate: "2024-02-01", expirationDate: "2024-11-30" },
      { tag: "Type C", effectiveDate: "2024-03-01", expirationDate: "2024-10-31" },
    ];

    render(
      <DemonstrationTypesList
        demonstrationTypes={demonstrationTypes}
        setDemonstrationTypes={mockSetDemonstrationTypes}
      />
    );

    const removeButtons = screen.getAllByRole("button");

    // Click the first delete button (Type A)
    await user.click(removeButtons[0]);

    expect(mockSetDemonstrationTypes).toHaveBeenCalledTimes(1);

    // Verify the setter was called with a function
    expect(mockSetDemonstrationTypes).toHaveBeenCalledWith(expect.any(Function));

    // Test the filter function that was passed
    const filterFn = mockSetDemonstrationTypes.mock.calls[0][0];
    const result = filterFn(demonstrationTypes);

    // Should filter out Type A
    expect(result).toHaveLength(2);
    expect(result).toEqual([
      { tag: "Type B", effectiveDate: "2024-02-01", expirationDate: "2024-11-30" },
      { tag: "Type C", effectiveDate: "2024-03-01", expirationDate: "2024-10-31" },
    ]);
  });

  it("removes correct type when multiple delete buttons exist", async () => {
    const user = userEvent.setup();
    const demonstrationTypes: DemonstrationType[] = [
      { tag: "Type A", effectiveDate: "2024-01-01", expirationDate: "2024-12-31" },
      { tag: "Type B", effectiveDate: "2024-02-01", expirationDate: "2024-11-30" },
      { tag: "Type C", effectiveDate: "2024-03-01", expirationDate: "2024-10-31" },
    ];

    render(
      <DemonstrationTypesList
        demonstrationTypes={demonstrationTypes}
        setDemonstrationTypes={mockSetDemonstrationTypes}
      />
    );

    const removeButtons = screen.getAllByRole("button");

    // Click the second delete button (Type B)
    await user.click(removeButtons[1]);

    const filterFn = mockSetDemonstrationTypes.mock.calls[0][0];
    const result = filterFn(demonstrationTypes);

    // Should filter out Type B
    expect(result).toHaveLength(2);
    expect(result).toEqual([
      { tag: "Type A", effectiveDate: "2024-01-01", expirationDate: "2024-12-31" },
      { tag: "Type C", effectiveDate: "2024-03-01", expirationDate: "2024-10-31" },
    ]);
  });

  it("does not render list when empty", () => {
    render(
      <DemonstrationTypesList
        demonstrationTypes={[]}
        setDemonstrationTypes={mockSetDemonstrationTypes}
      />
    );

    const list = screen.queryByRole("list");
    expect(list).not.toBeInTheDocument();
  });

  it("renders list as unordered list when types exist", () => {
    const demonstrationTypes: DemonstrationType[] = [
      { tag: "Type A", effectiveDate: "2024-01-01", expirationDate: "2024-12-31" },
    ];

    render(
      <DemonstrationTypesList
        demonstrationTypes={demonstrationTypes}
        setDemonstrationTypes={mockSetDemonstrationTypes}
      />
    );

    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    expect(list.tagName).toBe("UL");
  });
});
