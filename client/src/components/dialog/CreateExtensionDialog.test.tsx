import React from "react";

import { MockedResponse } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { TestProvider } from "test-utils/TestProvider";
import { CreateExtensionDialog } from "./CreateExtensionDialog";
import { CREATE_EXTENSION_MUTATION } from "queries/extensionQueries";
import { GET_DEMONSTRATION_OPTIONS_QUERY } from "hooks/useDemonstrationOptions";
import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";

const baseMocks: MockedResponse[] = [
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

describe("CreateExtensionDialog", () => {
  it("submits the create extension mutation and closes", async () => {
    const onClose = vi.fn();

    const mutationMock: MockedResponse = {
      request: {
        query: CREATE_EXTENSION_MUTATION,
        variables: {
          input: {
            demonstrationId: "demo-1",
            name: "My Extension",
            description: "Extension description",
          },
        },
      },
      result: {
        data: {
          createExtension: {
            __typename: "Extension",
            id: "extension-1",
          },
        },
      },
    };

    render(
      <TestProvider mocks={[...baseMocks, mutationMock]}>
        <CreateExtensionDialog
          isOpen
          onClose={onClose}
          demonstrationId="demo-1"
          data={{
            title: "My Extension",
            description: "Extension description",
            state: "AL",
            projectOfficer: "user-1",
            demonstration: "demo-1",
          }}
        />
      </TestProvider>
    );

    const submitButton = await screen.findByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

