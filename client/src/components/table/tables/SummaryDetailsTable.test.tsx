import React from "react";

import { mockDemonstrations } from "mock-data/demonstrationMocks";
import { safeDateFormat } from "util/formatDate";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SummaryDetailsTable } from "./SummaryDetailsTable";

const EDIT_BUTTON_TEST_ID = "button-edit-details";

// Helper to convert mock demonstration to proper format for SummaryDetailsTable
const createTestDemonstration = (mockDemo: (typeof mockDemonstrations)[0]) => ({
  id: mockDemo.id,
  name: mockDemo.name,
  description: mockDemo.description,
  sdgDivision: mockDemo.sdgDivision,
  signatureLevel: mockDemo.signatureLevel,
  effectiveDate: new Date(mockDemo.effectiveDate),
  expirationDate: new Date(mockDemo.expirationDate),
  status: mockDemo.status,
  state: mockDemo.state,
  roles: mockDemo.roles,
});

// Mock the DemonstrationDialog component
vi.mock("components/dialog", () => ({
  EditDemonstrationDialog: () => <div>EditDemonstrationDialog</div>,
  CreateDemonstrationDialog: () => <div>CreateDemonstrationDialog</div>,
}));

describe("SummaryDetailsTable", () => {
  const mockOnEdit = vi.fn();
  const testDemo = createTestDemonstration(mockDemonstrations[0]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders the summary details table with demonstration data", () => {
      render(<SummaryDetailsTable demonstration={testDemo} />);

      expect(screen.getByText("Summary Details")).toBeInTheDocument();
      expect(screen.getByText("Test Demonstration 1")).toBeInTheDocument();
      expect(screen.getByText("Alabama")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Approved")).toBeInTheDocument();
      expect(screen.getByText("A test demonstration.")).toBeInTheDocument();
    });

    it("renders all field labels correctly", () => {
      render(<SummaryDetailsTable demonstration={testDemo} />);

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
      render(<SummaryDetailsTable demonstration={testDemo} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveTextContent("Edit Details");
    });
  });

  describe("Date Formatting", () => {
    it("formats effective and expiration dates correctly", () => {
      render(<SummaryDetailsTable demonstration={testDemo} />);

      // Check that dates are rendered (format will depend on locale)
      const effectiveDate = safeDateFormat(testDemo.effectiveDate);
      const expirationDate = safeDateFormat(testDemo.expirationDate);

      expect(screen.getByText(effectiveDate)).toBeInTheDocument();
      expect(screen.getByText(expirationDate)).toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    it("calls onEdit prop when provided and edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTable demonstration={testDemo} onEdit={mockOnEdit} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it("opens modal when no onEdit prop is provided and edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTable demonstration={testDemo} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      await user.click(editButton);

      expect(screen.getByText("EditDemonstrationDialog")).toBeInTheDocument();
    });

    it("does not open modal when onEdit prop is provided", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTable demonstration={testDemo} onEdit={mockOnEdit} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      await user.click(editButton);

      expect(screen.queryByTestId("demonstration-dialog")).not.toBeInTheDocument();
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Modal Integration", () => {
    it("passes correct props to DemonstrationDialog", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTable demonstration={testDemo} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      await user.click(editButton);

      expect(screen.getByText("EditDemonstrationDialog")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      render(<SummaryDetailsTable demonstration={testDemo} />);

      const heading = screen.getByText("Summary Details");
      expect(heading.tagName).toBe("H2");
    });

    it("has accessible button with proper content", () => {
      render(<SummaryDetailsTable demonstration={testDemo} />);

      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      expect(editButton).toHaveTextContent("Edit Details");
    });
  });

  describe("Component Props", () => {
    it("renders without onEdit prop", () => {
      expect(() => {
        render(<SummaryDetailsTable demonstration={testDemo} />);
      }).not.toThrow();
    });

    it("renders with onEdit prop", () => {
      expect(() => {
        render(<SummaryDetailsTable demonstration={testDemo} onEdit={mockOnEdit} />);
      }).not.toThrow();
    });
  });
});
