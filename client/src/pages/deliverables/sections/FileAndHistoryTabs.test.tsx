import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { TestProvider } from "test-utils/TestProvider";

import { FileAndHistoryTabs } from "./FileAndHistoryTabs";
import { STATE_FILES_TAB_NAME } from "./StateFilesTab";
import { CMS_FILES_TAB_NAME } from "./CmsFilesTab";
import { HISTORY_TAB_NAME } from "./HistoryTab";

const mockShowRequestResubmissionDeliverableDialog = vi.fn();

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showRequestResubmissionDeliverableDialog:
      mockShowRequestResubmissionDeliverableDialog,
  }),
}));

const setup = (overrides?: Partial<typeof MOCK_DELIVERABLE_1>) =>
  render(
    <TestProvider>
      <FileAndHistoryTabs
        deliverable={{ ...MOCK_DELIVERABLE_1, ...overrides }}
      />
    </TestProvider>
  );

describe("FileAndHistoryTabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all three tabs with State Files selected by default", () => {
    setup();

    expect(screen.getByTestId("button-state_files")).toBeInTheDocument();
    expect(screen.getByTestId("button-cms_files")).toBeInTheDocument();
    expect(screen.getByTestId("button-history")).toBeInTheDocument();
    expect(screen.getByTestId(STATE_FILES_TAB_NAME)).toBeInTheDocument();
  });

  it("shows file counts next to State Files and CMS Files labels", () => {
    setup();

    expect(screen.getByText(/State Files \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/CMS Files \(1\)/)).toBeInTheDocument();
  });

  it("switches to the CMS Files tab on click", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByTestId("button-cms_files"));

    expect(screen.getByTestId(CMS_FILES_TAB_NAME)).toBeInTheDocument();
  });

  it("switches to the History tab on click and renders rows from deliverable actions", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByTestId("button-history"));

    const historyTab = screen.getByTestId(HISTORY_TAB_NAME);
    expect(historyTab).toBeInTheDocument();
    expect(within(historyTab).getByText("Created Deliverable Slot")).toBeInTheDocument();
    expect(within(historyTab).getByText("Requested Resubmission")).toBeInTheDocument();
    expect(within(historyTab).getByText("Mock CMS User (CMS User)")).toBeInTheDocument();
    expect(within(historyTab).getByText(/Old Due Date: 03\/15\/2026/)).toBeInTheDocument();
  });

  it("shows the empty-state message in History when the deliverable has no actions", async () => {
    const user = userEvent.setup();
    setup({ deliverableActions: [] });

    await user.click(screen.getByTestId("button-history"));

    expect(screen.getByText(/No history available\./i)).toBeInTheDocument();
  });

  it("renders the Submit Deliverable button in the State Files tab when files exist", () => {
    setup();

    const stateTab = screen.getByTestId(STATE_FILES_TAB_NAME);
    expect(
      within(stateTab).getByTestId("button-submit-deliverable")
    ).toBeInTheDocument();
  });

  describe("Action Buttons", () => {
    it("renders Request Re-submission button", () => {
      setup();

      expect(
        screen.getByTestId("button-actions-request-resubmission")
      ).toBeInTheDocument();
    });

    it("calls dialog when Request Re-submission button is clicked (enabled state)", async () => {
      const user = userEvent.setup();

      setup({ status: "Submitted" });

      await user.click(
        screen.getByTestId("button-actions-request-resubmission")
      );

      expect(
        mockShowRequestResubmissionDeliverableDialog
      ).toHaveBeenCalledTimes(1);

      expect(
        mockShowRequestResubmissionDeliverableDialog
      ).toHaveBeenCalledWith({
        id: MOCK_DELIVERABLE_1.id,
        dueDate: MOCK_DELIVERABLE_1.dueDate,
      });
    });

    it.each([
      "Upcoming",
      "Past Due",
      "Accepted",
      "Approved",
      "Received and Filed",
    ] as const)(
      "disables Request Re-submission button for status %s",
      (status) => {
        setup({ status });

        expect(
          screen.getByTestId("button-actions-request-resubmission")
        ).toBeDisabled();
      }
    );

    it.each(["Submitted", "Under CMS Review"] as const)(
      "enables Request Re-submission button for status %s",
      (status) => {
        setup({ status });

        expect(
          screen.getByTestId("button-actions-request-resubmission")
        ).not.toBeDisabled();
      }
    );

    it("does not trigger dialog when button is disabled", async () => {
      const user = userEvent.setup();

      setup({ status: "Approved" });

      const button = screen.getByTestId("button-actions-request-resubmission");

      expect(button).toBeDisabled();

      await user.click(button);

      expect(
        mockShowRequestResubmissionDeliverableDialog
      ).not.toHaveBeenCalled();
    });

    it("keeps Submit Deliverable and Complete Review buttons disabled", () => {
      setup();

      expect(
        screen.getByTestId("button-actions-submit-deliverable")
      ).toBeDisabled();

      expect(
        screen.getByTestId("button-actions-complete-review")
      ).toBeDisabled();
    });
  });
});
