import React from "react";
import { Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DeliverableDetailsManagementPage,
  DELIVERABLE_DETAILS_QUERY,
} from "./DeliverableDetailsManagementPage";
import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { TestProvider } from "test-utils/TestProvider";
import { COMMENT_BOX_NAME } from "./sections/comment_box/CommentBox";
import { DELIVERABLE_INFO_FIELDS_NAME } from "./sections/DeliverableInfoFields";
import { FILE_AND_HISTORY_TABS_NAME } from "./sections/FileAndHistoryTabs";
import { DELIVERABLE_BUTTONS_NAME } from "./sections/DeliverableButtons";
import { DialogProvider } from "components/dialog/DialogContext";

const renderAtRoute = (deliverableId: string) =>
  render(
    <TestProvider routerEntries={[`/deliverables/${deliverableId}`]}>
      <DialogProvider>
        <Routes>
          <Route
            path="/deliverables/:deliverableId"
            element={<DeliverableDetailsManagementPage />}
          />
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

  it("renders DeliverableButtons", async () => {
    renderAtRoute("1");

    await waitFor(() => expect(screen.getByTestId(DELIVERABLE_BUTTONS_NAME)).toBeInTheDocument());
  });

  it("renders FileAndHistoryTabs", async () => {
    renderAtRoute("1");

    await waitFor(() => expect(screen.getByTestId(FILE_AND_HISTORY_TABS_NAME)).toBeInTheDocument());
  });

  it("renders CommentBox", async () => {
    renderAtRoute("1");

    await waitFor(() => expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument());
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
