import React from "react";

import { waitFor, render, screen } from "@testing-library/react";
import { GraphQLError } from "graphql";

import { AmendmentDialog, AMENDMENT_DIALOG_QUERY } from "./AmendmentDialog";
import { TestProvider } from "test-utils/TestProvider";

const AMENDMENT_ID = "amendment-123";

const amendmentMock = {
  request: {
    query: AMENDMENT_DIALOG_QUERY,
    variables: { id: AMENDMENT_ID },
  },
  result: {
    data: {
      amendment: {
        id: AMENDMENT_ID,
        name: "Test Amendment",
        description: "This is a test amendment.",
        effectiveDate: "2025-01-01T00:00:00.000Z",
        expirationDate: null,
        status: "Under Review",
        currentPhaseName: "Concept",
        demonstration: {
          id: "demo-1",
          name: "Demo 1",
          __typename: "Demonstration",
        },
        __typename: "Amendment",
      },
    },
  },
};

const errorMock = {
  request: {
    query: AMENDMENT_DIALOG_QUERY,
    variables: { id: AMENDMENT_ID },
  },
  result: {
    errors: [new GraphQLError("Boom")],
  },
};

describe("AmendmentDialog", () => {
  it("renders amendment details with section headings", async () => {
    render(
      <TestProvider mocks={[amendmentMock]}>
        <AmendmentDialog amendmentId={AMENDMENT_ID} isOpen={true} onClose={() => {}} />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Amendment")).toBeInTheDocument();
    });

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Under Review")).toBeInTheDocument();
    expect(screen.getByText("Concept")).toBeInTheDocument();
    expect(screen.getByText("Demo 1")).toBeInTheDocument();
    expect(screen.getByText("This is a test amendment.")).toBeInTheDocument();
    expect(screen.getByText("Expanded details coming soon.")).toBeInTheDocument();

    const titleInput = screen.getByLabelText("Amendment Title") as HTMLInputElement;
    expect(titleInput).toBeDisabled();
    expect(titleInput.value).toBe("Test Amendment");

    expect(screen.getByTestId("amendment-effective-date-display")).toHaveValue("01/01/2025");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("shows an error message when the query fails", async () => {
    render(
      <TestProvider mocks={[errorMock]}>
        <AmendmentDialog amendmentId={AMENDMENT_ID} isOpen={true} onClose={() => {}} />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load amendment.")).toBeInTheDocument();
    });
  });

  it("handles missing amendment id", () => {
    render(
      <TestProvider>
        <AmendmentDialog amendmentId={null} isOpen={true} onClose={() => {}} />
      </TestProvider>
    );

    expect(screen.getByText("No amendment selected.")).toBeInTheDocument();
  });
});
