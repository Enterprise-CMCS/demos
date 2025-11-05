import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SummaryDetailsTab } from "./SummaryDetailsTab";

const EDIT_BUTTON_TEST_ID = "button-edit-details";

const showEditDemonstrationDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showEditDemonstrationDialog,
  }),
}));

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
    render(<SummaryDetailsTab demonstrationId={mockDemonstrationId} />);
  });

  describe("Component Rendering", () => {
    it("renders the page header with correct title", () => {
      expect(screen.getByText("Summary Details")).toBeInTheDocument();
      expect(screen.getByText("Summary Details").tagName).toBe("H2");
    });

    it("renders the edit button with correct styling", () => {
      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveTextContent("Edit Details");
    });

    it("renders the SummaryDetailsTable with correct demonstrationId", () => {
      expect(screen.getByTestId("summary-details-table")).toBeInTheDocument();
      expect(
        screen.getByText(`Summary Details Table for demo: ${mockDemonstrationId}`)
      ).toBeInTheDocument();
    });

    it("does not render the edit dialog initially", () => {
      expect(screen.queryByTestId("edit-demonstration-dialog")).not.toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    it("opens modal when edit button is clicked", async () => {
      const user = userEvent.setup();
      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      await user.click(editButton);
      expect(showEditDemonstrationDialog).toHaveBeenCalledWith(mockDemonstrationId);
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      const heading = screen.getByText("Summary Details");
      expect(heading.tagName).toBe("H2");
    });

    it("has accessible button with proper content", () => {
      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      expect(editButton).toHaveTextContent("Edit Details");
    });
  });
});
