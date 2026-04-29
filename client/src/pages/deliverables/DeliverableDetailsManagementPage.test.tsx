import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DialogProvider } from "components/dialog/DialogContext";
import { MOCK_DELIVERABLE_1, deliverableMocks } from "mock-data/deliverableMocks";
import { TestProvider } from "test-utils/TestProvider";
import {
  DELIVERABLE_DETAILS_QUERY,
  DeliverableDetailsManagementPage,
} from "./DeliverableDetailsManagementPage";
import { COMMENT_BOX_NAME } from "./sections/CommentBox";
import { FILE_AND_HISTORY_TABS_NAME } from "./sections/FileAndHistoryTabs";

const renderPage = (deliverableId = MOCK_DELIVERABLE_1.id, mocks = deliverableMocks) =>
  render(
    <TestProvider mocks={mocks} routerEntries={["/deliverables/1"]}>
      <DialogProvider>
        <DeliverableDetailsManagementPage deliverableId={deliverableId} onBack={vi.fn()} />
      </DialogProvider>
    </TestProvider>
  );

describe("DeliverableDetailsManagementPage", () => {
  it("renders the selected deliverable details", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText(MOCK_DELIVERABLE_1.name)).toBeInTheDocument());
    expect(screen.getByTestId(FILE_AND_HISTORY_TABS_NAME)).toBeInTheDocument();
    expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument();
  });

  it("shows not found when the deliverable is missing", async () => {
    renderPage("missing-deliverable", [
      {
        request: {
          query: DELIVERABLE_DETAILS_QUERY,
          variables: { id: "missing-deliverable" },
        },
        result: { data: { deliverable: null } },
      },
    ]);

    await waitFor(() => expect(screen.getByText(/deliverable not found/i)).toBeInTheDocument());
  });
});
