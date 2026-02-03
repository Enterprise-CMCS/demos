import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DemonstrationTypesList } from "./DemonstrationTypesList";
import { DemonstrationType } from "./ApplyDemonstrationTypesDialog";

vi.mock("util/formatDate", () => ({
  formatDate: (date: string) => date,
}));

vi.mock("components/icons", () => ({
  DeleteIcon: ({ className }: { className?: string }) => (
    <span data-testid="delete-icon" className={className}>
      ×
    </span>
  ),
}));

describe("DemonstrationTypesList", () => {
  const mockRemoveDemonstrationType = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const demonstrationTypes: DemonstrationType[] = [
    {
      demonstrationTypeName: "Type A",
      effectiveDate: "2024-01-01",
      expirationDate: "2024-12-31",
    },
    {
      demonstrationTypeName: "Type B",
      effectiveDate: "2024-02-01",
      expirationDate: "2024-11-30",
    },
    {
      demonstrationTypeName: "Type C",
      effectiveDate: "2024-03-01",
      expirationDate: "2024-10-31",
    },
  ];

  const renderDemonstrationTypesList = () => {
    return render(
      <DemonstrationTypesList
        demonstrationTypes={demonstrationTypes}
        removeDemonstrationType={mockRemoveDemonstrationType}
      />
    );
  };

  it("renders empty state when no demonstration types", () => {
    render(
      <DemonstrationTypesList
        demonstrationTypes={[]}
        removeDemonstrationType={mockRemoveDemonstrationType}
      />
    );

    expect(screen.queryByText(/types to be added/i)).not.toBeInTheDocument();
  });

  it("displays correct count of demonstration types", () => {
    renderDemonstrationTypesList();

    expect(screen.getByText(/types to be added \(3\)/i)).toBeInTheDocument();
  });

  it("renders all demonstration types with their details", () => {
    renderDemonstrationTypesList();

    // Check Type A
    expect(screen.getByText("Type A")).toBeInTheDocument();
    expect(screen.getByText(/effective: 2024-01-01/i)).toBeInTheDocument();
    expect(screen.getByText(/expires: 2024-12-31/i)).toBeInTheDocument();

    // Check Type B
    expect(screen.getByText("Type B")).toBeInTheDocument();
    expect(screen.getByText(/effective: 2024-02-01/i)).toBeInTheDocument();
    expect(screen.getByText(/expires: 2024-11-30/i)).toBeInTheDocument();

    // Check Type C
    expect(screen.getByText("Type C")).toBeInTheDocument();
    expect(screen.getByText(/effective: 2024-03-01/i)).toBeInTheDocument();
    expect(screen.getByText(/expires: 2024-10-31/i)).toBeInTheDocument();
  });

  it("renders delete button for each demonstration type", () => {
    renderDemonstrationTypesList();

    const removeButtons = screen.getAllByRole("button");
    expect(removeButtons).toHaveLength(3);
  });

  it("calls setDemonstrationTypes to remove type when delete button clicked", async () => {
    const user = userEvent.setup();
    renderDemonstrationTypesList();

    const removeButtons = screen.getAllByRole("button");

    await user.click(removeButtons[1]);

    expect(mockRemoveDemonstrationType).toHaveBeenCalledTimes(1);
    expect(mockRemoveDemonstrationType).toHaveBeenCalledWith("Type B");
  });
});
