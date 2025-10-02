import React from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GraphQLError } from "graphql";
import { MockedResponse } from "@apollo/client/testing";
import { vi } from "vitest";

import { ExtensionDialog, EXTENSION_DIALOG_QUERY } from "./ExtensionDialog";
import { TestProvider } from "test-utils/TestProvider";
import { GET_DEMONSTRATION_OPTIONS_QUERY } from "hooks/useDemonstrationOptions";
import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { CREATE_EXTENSION_MUTATION } from "./ExtensionDialog";

const EXTENSION_ID = "extension-123";

const extensionMock = {
  request: {
    query: EXTENSION_DIALOG_QUERY,
    variables: { id: EXTENSION_ID },
  },
  result: {
    data: {
      extension: {
        id: EXTENSION_ID,
        name: "Test Extension",
        description: "This is a test extension.",
        effectiveDate: "2025-02-01T00:00:00.000Z",
        expirationDate: null,
        status: "Approved",
        currentPhaseName: "Implementation",
        demonstration: {
          id: "demo-2",
          name: "Demo 2",
          __typename: "Demonstration",
        },
        __typename: "Extension",
      },
    },
  },
};

const errorMock = {
  request: {
    query: EXTENSION_DIALOG_QUERY,
    variables: { id: EXTENSION_ID },
  },
  result: {
    errors: [new GraphQLError("Boom")],
  },
};

const baseFormMocks: MockedResponse[] = [
  {
    request: {
      query: GET_DEMONSTRATION_OPTIONS_QUERY,
    },
    result: {
      data: {
        demonstrations: [
          {
            __typename: "Demonstration",
            id: "demo-1",
            name: "Demo 1",
          },
        ],
      },
    },
  },
  {
    request: {
      query: GET_USER_SELECT_OPTIONS_QUERY,
    },
    result: {
      data: {
        people: [
          {
            __typename: "Person",
            id: "user-1",
            fullName: "Jane Doe",
            personType: "demos-admin",
          },
        ],
      },
    },
  },
];

describe("ExtensionDialog", () => {
  it("renders extension details in view mode", async () => {
    render(
      <TestProvider mocks={[extensionMock]}>
        <ExtensionDialog extensionId={EXTENSION_ID} isOpen={true} onClose={() => {}} mode="view" />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Extension")).toBeInTheDocument();
    });

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Approved")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Implementation")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Demo 2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Extension")).toBeInTheDocument();
    expect(screen.getByDisplayValue("This is a test extension.")).toBeInTheDocument();
    expect(screen.getByText("Expanded details coming soon.")).toBeInTheDocument();
    expect(screen.getByTestId("extension-effective-date-display")).toHaveValue("02/01/2025");
    expect(screen.getByRole("button", { name: "close-extension-dialog" })).toBeInTheDocument();
  });

  it("shows an error message when the query fails", async () => {
    render(
      <TestProvider mocks={[errorMock]}>
        <ExtensionDialog extensionId={EXTENSION_ID} isOpen={true} onClose={() => {}} mode="view" />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load extension.")).toBeInTheDocument();
    });
  });

  it("submits the create extension mutation and closes", async () => {
    const onClose = vi.fn();

    const createMock: MockedResponse = {
      request: {
        query: CREATE_EXTENSION_MUTATION,
        variables: {
          input: {
            demonstrationId: "demo-1",
            name: "New Extension",
            description: "Create description",
          },
        },
      },
      result: {
        data: {
          createExtension: {
            __typename: "Extension",
            id: "extension-999",
          },
        },
      },
    };

    render(
      <TestProvider mocks={[...baseFormMocks, createMock]}>
        <ExtensionDialog
          isOpen
          onClose={onClose}
          mode="add"
          demonstrationId="demo-1"
          data={{
            title: "New Extension",
            description: "Create description",
            state: "AL",
            projectOfficer: "user-1",
            demonstration: "demo-1",
          }}
        />
      </TestProvider>
    );

    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });
});
