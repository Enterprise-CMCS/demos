import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { TestProvider } from "test-utils/TestProvider";

import { FileAndHistoryTabs } from "./FileAndHistoryTabs";
import { STATE_FILES_TAB_NAME } from "./StateFilesTab";
import { CMS_FILES_TAB_NAME } from "./CmsFilesTab";
import { HISTORY_TAB_NAME } from "./HistoryTab";

const setup = () =>
  render(
    <TestProvider>
      <FileAndHistoryTabs deliverable={MOCK_DELIVERABLE_1} />
    </TestProvider>
  );

describe("FileAndHistoryTabs", () => {
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

  it("switches to the History tab on click", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByTestId("button-history"));

    expect(screen.getByTestId(HISTORY_TAB_NAME)).toBeInTheDocument();
  });

  it("renders the Submit Deliverable button in the State Files tab when files exist", () => {
    setup();

    const stateTab = screen.getByTestId(STATE_FILES_TAB_NAME);
    expect(within(stateTab).getByTestId("button-submit-deliverable")).toBeInTheDocument();
  });
});
