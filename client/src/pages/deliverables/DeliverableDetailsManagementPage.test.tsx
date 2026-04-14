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
  it("renders deliverable details after query resolves", async () => {
    renderAtRoute("1");

    await waitFor(() =>
      expect(screen.getByText(MOCK_DELIVERABLE_1.demonstration.name)).toBeInTheDocument()
    );
  });

  it("shows the demonstration name", async () => {
    renderAtRoute("1");

    await waitFor(() =>
      expect(screen.getByText(MOCK_DELIVERABLE_1.demonstration.name)).toBeInTheDocument()
    );
  });

  it("shows the status", async () => {
    renderAtRoute("1");

    await waitFor(() =>
      expect(screen.getByText(MOCK_DELIVERABLE_1.status)).toBeInTheDocument()
    );
  });

  it("shows the primary contact", async () => {
    renderAtRoute("1");

    await waitFor(() =>
      expect(screen.getByText(MOCK_DELIVERABLE_1.cmsOwner.person.fullName)).toBeInTheDocument()
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
