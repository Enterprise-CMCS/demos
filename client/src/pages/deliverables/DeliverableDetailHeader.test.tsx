import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import {
  DELIVERABLE_DETAIL_HEADER_QUERY,
  DeliverableDetailHeader,
} from "./DeliverableDetailHeader";
import { TestProvider } from "test-utils/TestProvider";
import { MockedResponse } from "@apollo/client/testing";
import { useParams } from "react-router-dom";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

vi.mock("pages/DemonstrationDetail/DemonstrationHeader", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("pages/DemonstrationDetail/DemonstrationHeader")>();
  return {
    ...actual,
    DemonstrationHeader: ({ demonstrationId }: { demonstrationId: string }) => (
      <div data-testid="demonstration-detail-header">{demonstrationId}</div>
    ),
  };
});

const mockSuccess = {
  request: {
    query: DELIVERABLE_DETAIL_HEADER_QUERY,
    variables: { deliverableId: "test-deliverable-id" },
  },
  result: {
    data: {
      deliverable: {
        id: "test-deliverable-id",
        demonstration: { id: "test-demonstration-id" },
      },
    },
  },
};

const mockError = {
  request: {
    query: DELIVERABLE_DETAIL_HEADER_QUERY,
    variables: { deliverableId: "test-deliverable-id" },
  },
  error: new Error("Failed to fetch deliverable"),
};

function renderWithProviders(mocks: MockedResponse[]) {
  return render(
    <TestProvider mocks={mocks}>
      <DeliverableDetailHeader />
    </TestProvider>
  );
}

describe("DeliverableDetailHeader", () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ deliverableId: "test-deliverable-id" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading spinner while the query is in flight", () => {
    renderWithProviders([mockSuccess]);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("renders the DemonstrationDetailHeader with the resolved demonstrationId", async () => {
    renderWithProviders([mockSuccess]);
    const header = await waitFor(() => screen.findByTestId("demonstration-detail-header"));
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent("test-demonstration-id");
  });

  it("throws an error when deliverableId param is missing", () => {
    vi.mocked(useParams).mockReturnValue({});

    expect(() => {
      render(<DeliverableDetailHeader />);
    }).toThrow("DeliverableDetailHeader must be rendered within a route with :deliverableId param");
  });

  it("displays an error message when the GraphQL query fails", async () => {
    renderWithProviders([mockError]);
    const error = await screen.findByText("Error loading deliverable");
    expect(error).toBeInTheDocument();
  });
});
