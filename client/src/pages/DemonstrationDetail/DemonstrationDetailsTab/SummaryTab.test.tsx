import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { SummaryTab } from "./SummaryTab";
import { mockDemonstrations } from "mock-data/demonstrationMocks";

// Mock the DemonstrationTable component
vi.mock("components/table/tables/SummaryDetailsTable", () => ({
  SummaryDetailsTable: () => <div>DocumentTable</div>,
}));

// Mock the DemonstrationDialog component
vi.mock("components/dialog/DemonstrationDialog", () => ({
  DemonstrationDialog: ({ mode, onClose }: { mode: string; onClose: () => void }) => (
    <div data-testid="demonstration-dialog">
      <h2>Demonstration Dialog - {mode}</h2>
      <button onClick={onClose} data-testid="close-dialog">
        Close
      </button>
    </div>
  ),
}));

// Mock the SecondaryButton component
vi.mock("components/button", () => ({
  SecondaryButton: ({
    children,
    onClick,
    className,
    size,
    disabled,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    size?: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={className}
      data-testid="edit-button"
      data-size={size}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

// Mock the EditIcon component
vi.mock("components/icons", () => ({
  EditIcon: ({ className }: { className?: string }) => (
    <span className={className} data-testid="edit-icon">
      ✏️
    </span>
  ),
}));

describe("Edit Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOnEdit = vi.fn();
  it("renders the edit button with correct styling", () => {
    render(<SummaryTab demonstration={mockDemonstrations[0]} onEdit={mockOnEdit} />);

    const editButton = screen.getByTestId("edit-button");
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveTextContent("Edit Details");
    expect(editButton).toHaveAttribute("data-size", "small");
    expect(screen.getByTestId("edit-icon")).toBeInTheDocument();
  });
  it("calls onEdit prop when provided and edit button is clicked", async () => {
    const user = userEvent.setup();
    render(<SummaryTab demonstration={mockDemonstrations[0]} onEdit={mockOnEdit} />);

    const editButton = screen.getByTestId("edit-button");
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it("opens modal when no onEdit prop is provided and edit button is clicked", async () => {
    const user = userEvent.setup();
    render(<SummaryTab demonstration={mockDemonstrations[0]} />);

    const editButton = screen.getByTestId("edit-button");
    await user.click(editButton);

    expect(screen.getByTestId("demonstration-dialog")).toBeInTheDocument();
    expect(screen.getByText("Demonstration Dialog - edit")).toBeInTheDocument();
  });

  it("closes modal when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<SummaryTab demonstration={mockDemonstrations[0]} />);

    // Open modal
    const editButton = screen.getByTestId("edit-button");
    await user.click(editButton);
    expect(screen.getByTestId("demonstration-dialog")).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByTestId("close-dialog");
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("demonstration-dialog")).not.toBeInTheDocument();
    });
  });

  const user = userEvent.setup();
  it("does not open modal when onEdit prop is provided", async () => {
    render(<SummaryTab demonstration={mockDemonstrations[0]} onEdit={mockOnEdit} />);

    const editButton = screen.getByTestId("edit-button");
    await user.click(editButton);

    expect(screen.queryByTestId("demonstration-dialog")).not.toBeInTheDocument();
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  describe("Modal Integration", () => {
    it("passes correct props to DemonstrationDialog", async () => {
      const user = userEvent.setup();
      render(<SummaryTab demonstration={mockDemonstrations[0]} />);

      const editButton = screen.getByTestId("edit-button");
      await user.click(editButton);

      const modal = screen.getByTestId("demonstration-dialog");
      expect(modal).toBeInTheDocument();
      expect(screen.getByText("Demonstration Dialog - edit")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      render(<SummaryTab demonstration={mockDemonstrations[0]} />);

      const heading = screen.getByText("Summary Details");
      expect(heading.tagName).toBe("H2");
    });

    it("has accessible button with proper content", () => {
      render(<SummaryTab demonstration={mockDemonstrations[0]} />);

      const editButton = screen.getByTestId("edit-button");
      expect(editButton).toHaveTextContent("Edit Details");
    });
  });

  describe("Component Props", () => {
    it("renders without onEdit prop", () => {
      expect(() => {
        render(<SummaryTab demonstration={mockDemonstrations[0]} />);
      }).not.toThrow();
    });

    it("renders with onEdit prop", () => {
      expect(() => {
        render(<SummaryTab demonstration={mockDemonstrations[0]} onEdit={mockOnEdit} />);
      }).not.toThrow();
    });
  });
});
