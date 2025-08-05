import React from "react";

import { Demonstration } from "demos-server";
import { summaryDemonstration } from "mock-data/summaryDetailMock";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SummaryDetailsTable } from "./SummaryDetailsTable";

// Mock the DemonstrationModal component
vi.mock("components/modal/DemonstrationModal", () => ({
  DemonstrationModal: ({ mode, onClose }: { mode: string; onClose: () => void }) => (
    <div data-testid="demonstration-modal">
      <h2>Demonstration Modal - {mode}</h2>
      <button onClick={onClose} data-testid="close-modal">
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
  }: {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    size?: string;
  }) => (
    <button
      onClick={onClick}
      className={className}
      data-testid="edit-button"
      data-size={size}
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

describe("SummaryDetailsTable", () => {
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders the summary details table with demonstration data", () => {
      render(<SummaryDetailsTable demonstration={summaryDemonstration} />);

      expect(screen.getByText("Summary Details")).toBeInTheDocument();
      expect(screen.getByText("Sample Demonstration")).toBeInTheDocument();
      expect(screen.getByText("California")).toBeInTheDocument();
      expect(screen.getByText("Admiral Gial Ackbar")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Sample description")).toBeInTheDocument();
    });

    it("renders all field labels correctly", () => {
      render(<SummaryDetailsTable demonstration={summaryDemonstration} />);

      expect(screen.getByText("State/Territory")).toBeInTheDocument();
      expect(screen.getByText("Demonstration (Max Limit - 128 Characters)")).toBeInTheDocument();
      expect(screen.getByText("Project Officer")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Effective Date")).toBeInTheDocument();
      expect(screen.getByText("Expiration Date")).toBeInTheDocument();
      expect(screen.getByText("Demonstration Description (Max Limit - 2048 Characters)")).toBeInTheDocument();
    });

    it("renders the edit button with correct styling", () => {
      render(<SummaryDetailsTable demonstration={summaryDemonstration} />);

      const editButton = screen.getByTestId("edit-button");
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveTextContent("Edit Details");
      expect(editButton).toHaveAttribute("data-size", "small");
      expect(screen.getByTestId("edit-icon")).toBeInTheDocument();
    });

    it("displays fallback values when demonstration data is missing", () => {
      const incompleteDemo = {
        ...summaryDemonstration,
        state: null,
        projectOfficer: null,
        demonstrationStatus: null,
        description: null,
      } as unknown as Demonstration;

      render(<SummaryDetailsTable demonstration={incompleteDemo} />);

      const dashElements = screen.getAllByText("-");
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe("Date Formatting", () => {
    it("formats effective and expiration dates correctly", () => {
      render(<SummaryDetailsTable demonstration={summaryDemonstration} />);

      // Check that dates are rendered (format will depend on locale)
      const effectiveDate = summaryDemonstration.effectiveDate.toLocaleDateString();
      const expirationDate = summaryDemonstration.expirationDate.toLocaleDateString();

      expect(screen.getByText(effectiveDate)).toBeInTheDocument();
      expect(screen.getByText(expirationDate)).toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    it("calls onEdit prop when provided and edit button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <SummaryDetailsTable
          demonstration={summaryDemonstration}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByTestId("edit-button");
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it("opens modal when no onEdit prop is provided and edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTable demonstration={summaryDemonstration} />);

      const editButton = screen.getByTestId("edit-button");
      await user.click(editButton);

      expect(screen.getByTestId("demonstration-modal")).toBeInTheDocument();
      expect(screen.getByText("Demonstration Modal - edit")).toBeInTheDocument();
    });

    it("closes modal when close button is clicked", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTable demonstration={summaryDemonstration} />);

      // Open modal
      const editButton = screen.getByTestId("edit-button");
      await user.click(editButton);
      expect(screen.getByTestId("demonstration-modal")).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByTestId("close-modal");
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId("demonstration-modal")).not.toBeInTheDocument();
      });
    });

    it("does not open modal when onEdit prop is provided", async () => {
      const user = userEvent.setup();
      render(
        <SummaryDetailsTable
          demonstration={summaryDemonstration}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByTestId("edit-button");
      await user.click(editButton);

      expect(screen.queryByTestId("demonstration-modal")).not.toBeInTheDocument();
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Modal Integration", () => {
    it("passes correct props to DemonstrationModal", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTable demonstration={summaryDemonstration} />);

      const editButton = screen.getByTestId("edit-button");
      await user.click(editButton);

      const modal = screen.getByTestId("demonstration-modal");
      expect(modal).toBeInTheDocument();
      expect(screen.getByText("Demonstration Modal - edit")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      render(<SummaryDetailsTable demonstration={summaryDemonstration} />);

      const heading = screen.getByText("Summary Details");
      expect(heading.tagName).toBe("H2");
    });

    it("has accessible button with proper content", () => {
      render(<SummaryDetailsTable demonstration={summaryDemonstration} />);

      const editButton = screen.getByTestId("edit-button");
      expect(editButton).toHaveTextContent("Edit Details");
    });
  });

  describe("Component Props", () => {
    it("renders without onEdit prop", () => {
      expect(() => {
        render(<SummaryDetailsTable demonstration={summaryDemonstration} />);
      }).not.toThrow();
    });

    it("renders with onEdit prop", () => {
      expect(() => {
        render(
          <SummaryDetailsTable
            demonstration={summaryDemonstration}
            onEdit={mockOnEdit}
          />
        );
      }).not.toThrow();
    });
  });
});
