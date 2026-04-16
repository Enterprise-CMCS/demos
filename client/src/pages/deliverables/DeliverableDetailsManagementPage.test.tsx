import React from "react";
import { Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeliverableDetailsManagementPage, DELIVERABLE_DETAILS_QUERY } from "./DeliverableDetailsManagementPage";
import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { TestProvider } from "test-utils/TestProvider";

const renderAtRoute = (deliverableId: string) =>
  render(
    <TestProvider routerEntries={[`/deliverables/${deliverableId}`]}>
      <Routes>
        <Route
          path="/deliverables/:deliverableId"
          element={<DeliverableDetailsManagementPage />}
        />
      </Routes>
    </TestProvider>
  );

describe("DeliverableDetailsManagementPage", () => {
  it("renders the deliverable name heading", async () => {
    renderAtRoute("1");

    await waitFor(() =>
      expect(screen.getByText(MOCK_DELIVERABLE_1.name)).toBeInTheDocument()
    );
  });

  it("renders DeliverableInfoFields", async () => {
    renderAtRoute("1");

    await waitFor(() =>
      expect(screen.getByTestId("deliverable-info-fields")).toBeInTheDocument()
    );
  });

  it("renders DeliverableButtons", async () => {
    renderAtRoute("1");

    await waitFor(() =>
      expect(screen.getByTestId("deliverable-buttons")).toBeInTheDocument()
    );
  });

  it("renders FileAndHistoryTabs", async () => {
    renderAtRoute("1");

    await waitFor(() =>
      expect(screen.getByTestId("file-and-history-tabs")).toBeInTheDocument()
    );
  });

  it("renders CommentBox", async () => {
    renderAtRoute("1");

    await waitFor(() =>
      expect(screen.getByTestId("comment-box")).toBeInTheDocument()
    );
  });

  it("shows not found state", async () => {
    const notFoundMock = {
      request: { query: DELIVERABLE_DETAILS_QUERY, variables: { id: "1" } },
      result: { data: { deliverable: null } },
    };

    render(
      <TestProvider mocks={[notFoundMock]} routerEntries={["/deliverables/1"]}>
        <Routes>
          <Route path="/deliverables/:deliverableId" element={<DeliverableDetailsManagementPage />} />
        </Routes>
      </TestProvider>
    );

    await waitFor(() =>
      expect(screen.getByText(/deliverable not found/i)).toBeInTheDocument()
    );
  });

  it("shows error state", async () => {
    const errorMock = {
      request: { query: DELIVERABLE_DETAILS_QUERY, variables: { id: "1" } },
      error: new Error("Something went wrong"),
    };

    render(
      <TestProvider mocks={[errorMock]} routerEntries={["/deliverables/1"]}>
        <Routes>
          <Route path="/deliverables/:deliverableId" element={<DeliverableDetailsManagementPage />} />
        </Routes>
      </TestProvider>
    );

    await waitFor(() =>
      expect(screen.getByText(/error loading deliverable/i)).toBeInTheDocument()
    );
  });
});
