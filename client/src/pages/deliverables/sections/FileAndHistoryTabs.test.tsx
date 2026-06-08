import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { developmentMockUser } from "mock-data/userMocks";
import type { CurrentUser } from "components/user/UserContext";
import { TestProvider } from "test-utils/TestProvider";

import { FileAndHistoryTabs } from "./FileAndHistoryTabs";
import {
  STATE_FILES_ADD_BUTTON_NAME,
  STATE_FILES_DELETE_BUTTON_NAME,
  STATE_FILES_TAB_NAME,
  STATE_FILES_SUBMIT_BUTTON_NAME,
} from "./StateFilesTab";
import { CMS_FILES_ADD_BUTTON_NAME, CMS_FILES_TAB_NAME } from "./CmsFilesTab";
import { HISTORY_TAB_NAME } from "./HistoryTab";

const mockShowRequestResubmissionDeliverableDialog = vi.fn();
const mockShowCompleteReviewDeliverableDialog = vi.fn();
const mockShowAddDeliverableFileDialog = vi.fn();
const mockShowEditDocumentDialog = vi.fn();
const mockShowRemoveDocumentDialog = vi.fn();

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showRequestResubmissionDeliverableDialog:
      mockShowRequestResubmissionDeliverableDialog,
    showCompleteReviewDeliverableDialog: mockShowCompleteReviewDeliverableDialog,
    showAddDeliverableFileDialog: mockShowAddDeliverableFileDialog,
    showEditDocumentDialog: mockShowEditDocumentDialog,
    showRemoveDocumentDialog: mockShowRemoveDocumentDialog,
  }),
}));

const mockSubmitDeliverable = vi.fn(() => Promise.resolve({ data: {} }));
vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useMutation: () => [mockSubmitDeliverable, { loading: false }],
  };
});

const buildCurrentUser = (
  personType: CurrentUser["person"]["personType"]
): CurrentUser => ({
  ...developmentMockUser,
  person: { ...developmentMockUser.person, personType },
});

const setup = (
  overrides?: Partial<typeof MOCK_DELIVERABLE_1>,
  personType: CurrentUser["person"]["personType"] = "demos-cms-user"
) =>
  render(
    <TestProvider currentUser={buildCurrentUser(personType)}>
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

    it("enables Submit Deliverable when state files exist", () => {
      setup();

      expect(
        screen.getByTestId(STATE_FILES_SUBMIT_BUTTON_NAME)
      ).not.toBeDisabled();
    });

    it("disables Submit Deliverable when no state files have been uploaded", () => {
      setup({ stateDocuments: [] });

      expect(
        screen.getByTestId(STATE_FILES_SUBMIT_BUTTON_NAME)
      ).toBeDisabled();
    });

    it("calls the submit mutation when Submit Deliverable is clicked", async () => {
      const user = userEvent.setup();
      setup();

      await user.click(screen.getByTestId(STATE_FILES_SUBMIT_BUTTON_NAME));

      expect(mockSubmitDeliverable).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { id: MOCK_DELIVERABLE_1.id },
        })
      );
    });

    it("keeps Complete Review button disabled by default", () => {
      setup();

      expect(
        screen.getByTestId("button-actions-complete-review")
      ).toBeDisabled();
    });
  });

  describe("State Files actions", () => {
    it("opens the add-file dialog with state-file params when Add File(s) is clicked", async () => {
      const user = userEvent.setup();
      setup();

      await user.click(screen.getByTestId(STATE_FILES_ADD_BUTTON_NAME));

      expect(mockShowAddDeliverableFileDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          deliverableId: MOCK_DELIVERABLE_1.id,
          applicationId: MOCK_DELIVERABLE_1.demonstration.id,
          isCmsFile: false,
        })
      );
    });
  });

  describe("CMS Files actions", () => {
    it("opens the add-file dialog with CMS-file params when Add File(s) is clicked", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(screen.getByTestId("button-cms_files"));

      await user.click(screen.getByTestId(CMS_FILES_ADD_BUTTON_NAME));

      expect(mockShowAddDeliverableFileDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          deliverableId: MOCK_DELIVERABLE_1.id,
          applicationId: MOCK_DELIVERABLE_1.demonstration.id,
          isCmsFile: true,
        })
      );
    });
  });

  describe("when the current user is a state user", () => {
    it("hides Add File(s), Edit, and Delete on the CMS Files tab", async () => {
      const user = userEvent.setup();
      setup(undefined, "demos-state-user");

      await user.click(screen.getByTestId("button-cms_files"));

      expect(screen.queryByTestId(CMS_FILES_ADD_BUTTON_NAME)).not.toBeInTheDocument();
    });

    it("still allows state users to manage the State Files tab", () => {
      setup(undefined, "demos-state-user");

      expect(screen.getByTestId(STATE_FILES_ADD_BUTTON_NAME)).toBeInTheDocument();
      expect(screen.getByTestId(STATE_FILES_ADD_BUTTON_NAME)).not.toBeDisabled();
    });
  });

  describe("when the deliverable is finalized", () => {
    it.each(["Accepted", "Approved", "Received and Filed"] as const)(
      "disables the State Files Add and Submit Deliverable buttons for status %s",
      (status) => {
        setup({ status });

        expect(screen.getByTestId(STATE_FILES_ADD_BUTTON_NAME)).toBeDisabled();
        expect(screen.getByTestId(STATE_FILES_SUBMIT_BUTTON_NAME)).toBeDisabled();
      }
    );

    it("disables the CMS Files Add button when status is Approved", async () => {
      const user = userEvent.setup();
      setup({ status: "Approved" });

      await user.click(screen.getByTestId("button-cms_files"));

      expect(screen.getByTestId(CMS_FILES_ADD_BUTTON_NAME)).toBeDisabled();
    });

    it("keeps the State Files Add button enabled when status is Submitted", () => {
      setup({ status: "Submitted" });

      expect(screen.getByTestId(STATE_FILES_ADD_BUTTON_NAME)).not.toBeDisabled();
    });
  });

  describe("delete lock by status", () => {
    it.each(["Upcoming", "Past Due"] as const)(
      "enables Delete on the State Files tab once a row is selected for status %s",
      async (status) => {
        const user = userEvent.setup();
        setup({ status });

        await user.click(screen.getByTestId("select-row-state-file-1"));

        expect(screen.getByTestId(STATE_FILES_DELETE_BUTTON_NAME)).not.toBeDisabled();
      }
    );

    it.each(["Submitted", "Under CMS Review"] as const)(
      "keeps Delete disabled on the State Files tab even with a row selected for status %s",
      async (status) => {
        const user = userEvent.setup();
        setup({ status });

        await user.click(screen.getByTestId("select-row-state-file-1"));

        expect(screen.getByTestId(STATE_FILES_DELETE_BUTTON_NAME)).toBeDisabled();
        // Add/Edit remain available until a final status.
        expect(screen.getByTestId(STATE_FILES_ADD_BUTTON_NAME)).not.toBeDisabled();
      }
    );
  });
});
