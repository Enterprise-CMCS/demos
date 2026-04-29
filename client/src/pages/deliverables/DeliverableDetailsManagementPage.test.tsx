import React from "react";
import { Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  DeliverableDetailsManagementPage,
  DELIVERABLE_DETAILS_QUERY,
} from "./DeliverableDetailsManagementPage";
import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { TestProvider } from "test-utils/TestProvider";
import { COMMENT_BOX_NAME } from "./sections/CommentBox";
import {
  BACK_TO_DELIVERABLES_BUTTON_NAME,
  DELIVERABLE_INFO_FIELDS_NAME,
} from "./sections/DeliverableInfoFields";
import { FILE_AND_HISTORY_TABS_NAME } from "./sections/FileAndHistoryTabs";
// import { DELIVERABLE_BUTTONS_NAME } from "./sections/DeliverableButtons";
import { DialogProvider } from "components/dialog/DialogContext";
import {
  DELIVERABLE_REVIEW_NOTICE_NAME,
  START_REVIEW_BUTTON_NAME,
} from "./sections/PendingReviewNotice";

const renderAtRoute = (deliverableId: string) =>
  render(
    <TestProvider routerEntries={[`/deliverables/${deliverableId}`]}>
      <DialogProvider>
        <Routes>
          <Route
            path="/deliverables/:deliverableId"
            element={<DeliverableDetailsManagementPage />}
          />
          <Route path="/deliverables" element={<div>Deliverables list</div>} />
        </Routes>
      </DialogProvider>
    </TestProvider>
  );

describe("DeliverableDetailsManagementPage", () => {
  it("renders the deliverable name heading", async () => {
    renderAtRoute("1");

    await waitFor(() => expect(screen.getByText(MOCK_DELIVERABLE_1.name)).toBeInTheDocument());
  });

  it("renders DeliverableInfoFields", async () => {
    renderAtRoute("1");

    await waitFor(() =>
      expect(screen.getByTestId(DELIVERABLE_INFO_FIELDS_NAME)).toBeInTheDocument()
    );
  });

  // Commented out in the page.
  // it("renders DeliverableButtons", async () => {
  //   renderAtRoute("1");

  //   await waitFor(() => expect(screen.getByTestId(DELIVERABLE_BUTTONS_NAME)).toBeInTheDocument());
  // });

  it("renders FileAndHistoryTabs", async () => {
    renderAtRoute("1");

    await waitFor(() => expect(screen.getByTestId(FILE_AND_HISTORY_TABS_NAME)).toBeInTheDocument());
  });

  it("renders CommentBox", async () => {
    renderAtRoute("1");

    await waitFor(() => expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument());
  });

  it("navigates back to the deliverables list", async () => {
    const user = userEvent.setup();
    renderAtRoute("1");

    await user.click(await screen.findByTestId(BACK_TO_DELIVERABLES_BUTTON_NAME));

    expect(screen.getByText("Deliverables list")).toBeInTheDocument();
  });

  it("toggles additional details", async () => {
    const user = userEvent.setup();
    renderAtRoute("1");

    expect(await screen.findByText("Show Additional Details")).toBeInTheDocument();
    expect(screen.queryByTestId("deliverable-CMS Owner")).not.toBeInTheDocument();

    await user.click(screen.getByText("Show Additional Details"));

    expect(screen.getByText("Hide Additional Details")).toBeInTheDocument();
    expect(screen.getByTestId("deliverable-CMS Owner")).toHaveTextContent("Mock User");
  });

  it("dismisses the pending review notice when review starts", async () => {
    const user = userEvent.setup();
    renderAtRoute("1");

    expect(await screen.findByTestId(DELIVERABLE_REVIEW_NOTICE_NAME)).toBeInTheDocument();

    await user.click(screen.getByTestId(START_REVIEW_BUTTON_NAME));

    expect(screen.queryByTestId(DELIVERABLE_REVIEW_NOTICE_NAME)).not.toBeInTheDocument();
  });

  it("shows not found state", async () => {
    const notFoundMock = {
      request: { query: DELIVERABLE_DETAILS_QUERY, variables: { id: "1" } },
      result: { data: { deliverable: null } },
    };

    render(
      <TestProvider mocks={[notFoundMock]} routerEntries={["/deliverables/1"]}>
        <Routes>
          <Route
            path="/deliverables/:deliverableId"
            element={<DeliverableDetailsManagementPage />}
          />
        </Routes>
      </TestProvider>
    );

    await waitFor(() => expect(screen.getByText(/deliverable not found/i)).toBeInTheDocument());
  });

  it("shows error state", async () => {
    const errorMock = {
      request: { query: DELIVERABLE_DETAILS_QUERY, variables: { id: "1" } },
      error: new Error("Something went wrong"),
    };

    render(
      <TestProvider mocks={[errorMock]} routerEntries={["/deliverables/1"]}>
        <Routes>
          <Route
            path="/deliverables/:deliverableId"
            element={<DeliverableDetailsManagementPage />}
          />
        </Routes>
      </TestProvider>
    );

    await waitFor(() => expect(screen.getByText(/error loading deliverable/i)).toBeInTheDocument());
  });
});
