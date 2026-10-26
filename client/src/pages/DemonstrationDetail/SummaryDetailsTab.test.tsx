import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SummaryDetailsTab } from "./SummaryDetailsTab";
import { DialogProvider } from "components/dialog/DialogContext";
import { TestProvider } from "test-utils/TestProvider";
import { MOCK_DEMONSTRATION_ID } from "mock-data/demonstrationMocks";
import {
  cmsMockUser,
  cmsReviewerMockUser,
  oactMockUser,
  readonlyMockUser,
} from "mock-data/userMocks";

const EDIT_BUTTON_TEST_ID = "button-edit-details";
const EDIT_DEMONSTRATION_DIALOG_TEST_ID = "dialog-edit-demonstration";
const SUMMARY_DETAILS_TABLE_TEST_ID = "summary-details-table";

const renderSummaryDetailsTab = (demonstrationId: string, currentUser = cmsMockUser) => {
  render(
    <TestProvider currentUser={currentUser}>
      <DialogProvider>
        <SummaryDetailsTab demonstrationId={demonstrationId} />
      </DialogProvider>
    </TestProvider>
  );
};

describe("SummaryDetailsTab", () => {
  const mockDemonstrationId = MOCK_DEMONSTRATION_ID;

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

    it("renders the SummaryDetailsTable", async () => {
      renderSummaryDetailsTab(mockDemonstrationId);
      expect(await screen.findByTestId(SUMMARY_DETAILS_TABLE_TEST_ID)).toBeInTheDocument();
    });

    it("does not render the edit dialog initially", () => {
      renderSummaryDetailsTab(mockDemonstrationId);
      expect(screen.queryByTestId(EDIT_DEMONSTRATION_DIALOG_TEST_ID)).not.toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    it("opens the edit dialog when edit button is clicked", async () => {
      renderSummaryDetailsTab(mockDemonstrationId);
      const user = userEvent.setup();
      await user.click(screen.getByTestId(EDIT_BUTTON_TEST_ID));
      expect(await screen.findByTestId(EDIT_DEMONSTRATION_DIALOG_TEST_ID)).toBeInTheDocument();
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
    it.each([
      ["readonly users", readonlyMockUser],
      ["CMS Reviewer users", cmsReviewerMockUser],
      ["OACT users", oactMockUser],
    ])("does not render the edit button for %s", (_role, currentUser) => {
      renderSummaryDetailsTab(mockDemonstrationId, currentUser);
      expect(screen.queryByTestId(EDIT_BUTTON_TEST_ID)).not.toBeInTheDocument();
    });
  });
});
