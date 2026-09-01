import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import {
  DELIVERABLE_DETAIL_HEADER_QUERY,
  DeliverableDetailHeader,
} from "./DeliverableDetailHeader";
import { TestProvider } from "test-utils/TestProvider";
import { MockedResponse } from "@apollo/client/testing";
import { Route, Routes } from "react-router-dom";

vi.mock("pages/DemonstrationDetail/BaseDemonstrationHeader", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("pages/DemonstrationDetail/BaseDemonstrationHeader")>();
  return {
    ...actual,
    BaseDemonstrationHeader: ({ demonstrationId }: { demonstrationId: string }) => (
      <div data-testid="demonstration-detail-header">{demonstrationId}</div>
    ),
  };
});

const mockSuccess = {
  request: {
    query: DELIVERABLE_DETAIL_HEADER_QUERY,
    variables: { deliverableId: "1" },
  },
  result: {
    data: {
      deliverable: {
        id: "1",
        demonstration: { id: "7" },
      },
    },
  },
};

const mockNoDemonstration = {
  request: {
    query: DELIVERABLE_DETAIL_HEADER_QUERY,
    variables: { deliverableId: "1" },
  },
  result: {
    data: {
      deliverable: {
        id: "1",
        demonstration: null,
      },
    },
  },
};

function renderWithProviders(mocks: MockedResponse[]) {
  return render(
    <TestProvider mocks={mocks} routerEntries={["/deliverables/1"]}>
      <Routes>
        <Route path="/deliverables/:deliverableId" element={<DeliverableDetailHeader />} />
      </Routes>
    </TestProvider>
  );
}

describe("DeliverableDetailHeader", () => {
  it("shows a loading spinner while the query is in flight", () => {
    renderWithProviders([mockSuccess]);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("renders the DemonstrationDetailHeader with the resolved demonstrationId", async () => {
    renderWithProviders([mockSuccess]);
    const header = await waitFor(() => screen.findByTestId("demonstration-detail-header"));
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent("7");
  });

  it("renders nothing when the deliverable has no demonstration", async () => {
    const { container } = renderWithProviders([mockNoDemonstration]);
    await screen.findByLabelText("Loading").catch(() => null);
    // wait for query to settle
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
