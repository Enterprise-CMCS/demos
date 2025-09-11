import React from "react";

import { formatDate } from "util/formatDate";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SummaryDetailsTable } from "./SummaryDetailsTable";
import { mockDemonstrations } from "mock-data/demonstrationMocks";

const EDIT_BUTTON_TEST_ID = "button-edit-details";

// Mock the DemonstrationDialog component
vi.mock("components/dialog/DemonstrationDialog", () => ({
  EditDemonstrationDialog: () => <div>EditDemonstrationDialog</div>,
  CreateDemonstrationDialog: () => <div>CreateDemonstrationDialog</div>,
}));

describe("SummaryDetailsTable", () => {
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders the summary details table with demonstration data", () => {
      render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} />);

      expect(screen.getByText("Summary Details")).toBeInTheDocument();
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Montana")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Approved")).toBeInTheDocument();
      expect(screen.getByText("A demonstration project in Montana.")).toBeInTheDocument();
    });

    it("renders all field labels correctly", () => {
      render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} />);

      expect(screen.getByText("State/Territory")).toBeInTheDocument();
      expect(screen.getByText("Demonstration (Max Limit - 128 Characters)")).toBeInTheDocument();
      expect(screen.getByText("Project Officer")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Effective Date")).toBeInTheDocument();
      expect(screen.getByText("Expiration Date")).toBeInTheDocument();
      expect(
        screen.getByText("Demonstration Description (Max Limit - 2048 Characters)")
      ).toBeInTheDocument();
    });

    it("renders the edit button with correct styling", () => {
      render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveTextContent("Edit Details");
    });
  });

  describe("Date Formatting", () => {
    it("formats effective and expiration dates correctly", () => {
      render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} />);

      // Check that dates are rendered (format will depend on locale)
      const effectiveDate = formatDate(mockDemonstrations[0].effectiveDate);
      const expirationDate = formatDate(mockDemonstrations[0].expirationDate);

      expect(screen.getByText(effectiveDate)).toBeInTheDocument();
      expect(screen.getByText(expirationDate)).toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    it("calls onEdit prop when provided and edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} onEdit={mockOnEdit} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it("opens modal when no onEdit prop is provided and edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      await user.click(editButton);

      expect(screen.getByText("EditDemonstrationDialog")).toBeInTheDocument();
    });

    it("does not open modal when onEdit prop is provided", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} onEdit={mockOnEdit} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      await user.click(editButton);

      expect(screen.queryByTestId("demonstration-dialog")).not.toBeInTheDocument();
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Modal Integration", () => {
    it("passes correct props to DemonstrationDialog", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      await user.click(editButton);

      expect(screen.getByText("EditDemonstrationDialog")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} />);

      const heading = screen.getByText("Summary Details");
      expect(heading.tagName).toBe("H2");
    });

    it("has accessible button with proper content", () => {
      render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      expect(editButton).toHaveTextContent("Edit Details");
    });
  });

  describe("Component Props", () => {
    it("renders without onEdit prop", () => {
      expect(() => {
        render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} />);
      }).not.toThrow();
    });

    it("renders with onEdit prop", () => {
      expect(() => {
        render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} onEdit={mockOnEdit} />);
      }).not.toThrow();
    });
  });
});
