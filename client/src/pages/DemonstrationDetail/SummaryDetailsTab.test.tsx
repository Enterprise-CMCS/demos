import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SummaryDetailsTab } from "./SummaryDetailsTab";

// Mock the child components
vi.mock("components/table/tables/SummaryDetailsTable", () => ({
  SummaryDetailsTable: ({ demonstrationId }: { demonstrationId: string }) => (
    <div data-testid="summary-details-table">Summary Details Table for demo: {demonstrationId}</div>
  ),
}));

vi.mock("components/dialog", () => ({
  EditDemonstrationDialog: ({
    demonstrationId,
    onClose,
  }: {
    demonstrationId: string;
    onClose: () => void;
  }) => (
    <div data-testid="edit-demonstration-dialog">
      Edit Dialog for demo: {demonstrationId}
      <button onClick={onClose} data-testid="close-dialog">
        Close
      </button>
    </div>
  ),
}));

describe("SummaryDetailsTab", () => {
  const mockDemonstrationId = "test-demo-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders the page header with correct title", () => {
      render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);

      expect(screen.getByText("Summary Details")).toBeInTheDocument();
      expect(screen.getByText("Summary Details").tagName).toBe("H2");
    });

    it("renders the edit button with correct styling and content", () => {
      render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);

      const editButton = screen.getByTestId("button-edit-details");
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveTextContent("Edit Details");
    });

    it("renders the SummaryDetailsTable with correct demonstrationId", () => {
      render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);

      expect(screen.getByTestId("summary-details-table")).toBeInTheDocument();
      expect(
        screen.getByText(`Summary Details Table for demo: ${mockDemonstrationId}`)
      ).toBeInTheDocument();
    });

    it("does not render the edit dialog initially", () => {
      render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);

      expect(screen.queryByTestId("edit-demonstration-dialog")).not.toBeInTheDocument();
    });
  });

  describe("Edit Modal Functionality", () => {
    it("opens edit dialog when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);

      const editButton = screen.getByTestId("button-edit-details");
      await user.click(editButton);

      expect(screen.getByTestId("edit-demonstration-dialog")).toBeInTheDocument();
      expect(screen.getByText(`Edit Dialog for demo: ${mockDemonstrationId}`)).toBeInTheDocument();
    });

    it("closes edit dialog when onClose is called", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);

      // Open dialog
      const editButton = screen.getByTestId("button-edit-details");
      await user.click(editButton);

      expect(screen.getByTestId("edit-demonstration-dialog")).toBeInTheDocument();

      // Close dialog
      const closeButton = screen.getByTestId("close-dialog");
      await user.click(closeButton);

      expect(screen.queryByTestId("edit-demonstration-dialog")).not.toBeInTheDocument();
    });

    it("can open and close dialog multiple times", async () => {
      const user = userEvent.setup();
      render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);

      const editButton = screen.getByTestId("button-edit-details");

      // Open dialog
      await user.click(editButton);
      expect(screen.getByTestId("edit-demonstration-dialog")).toBeInTheDocument();

      // Close dialog
      const closeButton = screen.getByTestId("close-dialog");
      await user.click(closeButton);
      expect(screen.queryByTestId("edit-demonstration-dialog")).not.toBeInTheDocument();

      // Open dialog again
      await user.click(editButton);
      expect(screen.getByTestId("edit-demonstration-dialog")).toBeInTheDocument();
    });
  });

  describe("Component Props", () => {
    it("passes demonstrationId to child components correctly", () => {
      const customDemoId = "custom-demo-456";
      render(<SummaryDetailsTab demonstrationId={customDemoId} />);

      expect(
        screen.getByText(`Summary Details Table for demo: ${customDemoId}`)
      ).toBeInTheDocument();
    });

    it("renders without throwing errors", () => {
      expect(() => {
        render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);
      }).not.toThrow();
    });
  });

  describe("Layout Structure", () => {
    it("has correct header layout with flex styling", () => {
      render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);

      const headerContainer = screen.getByText("Summary Details").closest("div");
      expect(headerContainer).toHaveClass("flex", "justify-between", "items-center");
    });

    it("renders components in correct order", () => {
      render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);

      const elements = screen.getAllByRole("heading", { level: 2 });
      expect(elements[0]).toHaveTextContent("Summary Details");

      expect(screen.getByTestId("summary-details-table")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Summary Details");
    });

    it("edit button has accessible name", () => {
      render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);

      const editButton = screen.getByRole("button", { name: /edit details/i });
      expect(editButton).toBeInTheDocument();
    });
  });
});
