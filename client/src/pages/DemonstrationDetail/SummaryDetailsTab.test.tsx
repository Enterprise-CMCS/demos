import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { EDIT_BUTTON_TEST_ID, SummaryDetailsTab } from "./SummaryDetailsTab";
import { DialogProvider } from "components/dialog/DialogContext";
import { EDIT_DEMONSTRATION_DIALOG_TEST_ID } from "components/dialog/demonstration/DemonstrationDialog";
import { SUMMARY_DETAILS_TABLE_TEST_ID } from "components/table/tables/SummaryDetailsTable";
import { TestProvider } from "test-utils/TestProvider";
import { MOCK_DEMONSTRATION_ID } from "mock-data/demonstrationMocks";
import {
  cmsMockUser,
  cmsReviewerMockUser,
  oactMockUser,
  readonlyMockUser,
} from "mock-data/userMocks";

const renderSummaryDetailsTab = (currentUser = cmsMockUser) => {
  render(
    <TestProvider currentUser={currentUser}>
      <DialogProvider>
        <SummaryDetailsTab demonstrationId={MOCK_DEMONSTRATION_ID} />
      </DialogProvider>
    </TestProvider>
  );
};

describe("SummaryDetailsTab", () => {
  describe("Component Rendering", () => {
    it("renders the page header with correct title", () => {
      renderSummaryDetailsTab();
      expect(screen.getByText("Summary Details")).toBeInTheDocument();
      expect(screen.getByText("Summary Details").tagName).toBe("H2");
    });

    it("renders the edit button with correct styling", () => {
      renderSummaryDetailsTab();
      const editButton = screen.getByTestId(EDIT_BUTTON_TEST_ID);
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveTextContent("Edit Details");
    });

    it("renders the SummaryDetailsTable", async () => {
      renderSummaryDetailsTab();
      expect(await screen.findByTestId(SUMMARY_DETAILS_TABLE_TEST_ID)).toBeInTheDocument();
    });

    it("does not render the edit dialog initially", () => {
      renderSummaryDetailsTab();
      expect(screen.queryByTestId(EDIT_DEMONSTRATION_DIALOG_TEST_ID)).not.toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    it("opens the edit dialog when edit button is clicked", async () => {
      renderSummaryDetailsTab();
      const user = userEvent.setup();
      await user.click(screen.getByTestId(EDIT_BUTTON_TEST_ID));
      expect(await screen.findByTestId(EDIT_DEMONSTRATION_DIALOG_TEST_ID)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      renderSummaryDetailsTab();
      const heading = screen.getByText("Summary Details");
      expect(heading.tagName).toBe("H2");
    });

    it("has accessible button with proper content", () => {
      renderSummaryDetailsTab();
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
      renderSummaryDetailsTab(currentUser);
      expect(screen.queryByTestId(EDIT_BUTTON_TEST_ID)).not.toBeInTheDocument();
    });
  });
});
