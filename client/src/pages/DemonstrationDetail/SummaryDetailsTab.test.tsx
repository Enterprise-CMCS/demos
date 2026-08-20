import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SummaryDetailsTab } from "./SummaryDetailsTab";
import { TestProvider } from "test-utils/TestProvider";
import { cmsMockUser, readonlyMockUser } from "mock-data/userMocks";

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

const renderSummaryDetailsTab = (demonstrationId: string, currentUser = cmsMockUser) => {
  render(
    <TestProvider currentUser={currentUser}>
      <SummaryDetailsTab demonstrationId={demonstrationId} />
    </TestProvider>
  );
};

describe("SummaryDetailsTab", () => {
  const mockDemonstrationId = "test-demo-123";

  describe("Component Rendering", () => {
    it("renders the page header with correct title", () => {
      renderSummaryDetailsTab(mockDemonstrationId);
      expect(screen.getByText("Summary Details")).toBeInTheDocument();
      expect(screen.getByText("Summary Details").tagName).toBe("H2");
    });

    it("renders the edit button with correct styling", () => {
      renderSummaryDetailsTab(mockDemonstrationId);
      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveTextContent("Edit Details");
    });

    it("renders the SummaryDetailsTable with correct demonstrationId", () => {
      renderSummaryDetailsTab(mockDemonstrationId);
      expect(screen.getByTestId("summary-details-table")).toBeInTheDocument();
      expect(
        screen.getByText(`Summary Details Table for demo: ${mockDemonstrationId}`)
      ).toBeInTheDocument();
    });

    it("does not render the edit dialog initially", () => {
      renderSummaryDetailsTab(mockDemonstrationId);
      expect(screen.queryByTestId("edit-demonstration-dialog")).not.toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    it("opens modal when edit button is clicked", async () => {
      renderSummaryDetailsTab(mockDemonstrationId);
      const user = userEvent.setup();
      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      await user.click(editButton);
      expect(showEditDemonstrationDialog).toHaveBeenCalledWith(mockDemonstrationId);
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      renderSummaryDetailsTab(mockDemonstrationId);
      const heading = screen.getByText("Summary Details");
      expect(heading.tagName).toBe("H2");
    });

    it("has accessible button with proper content", () => {
      renderSummaryDetailsTab(mockDemonstrationId);
      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      expect(editButton).toHaveTextContent("Edit Details");
    });
  });

  describe("Readonly User Behavior", () => {
    it("does not render the edit button for readonly users", () => {
      renderSummaryDetailsTab(mockDemonstrationId, readonlyMockUser);
      expect(screen.queryByTestId(EDIT_BUTTON_TEST_ID)).not.toBeInTheDocument();
    });
  });
});
