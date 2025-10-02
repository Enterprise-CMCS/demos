import React from "react";

import { MockedResponse } from "@apollo/client/testing";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { TestProvider } from "test-utils/TestProvider";
import { CreateAmendmentDialog, CREATE_AMENDMENT_MUTATION } from "./CreateAmendmentDialog";
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

describe("CreateAmendmentDialog", () => {
  it("submits the create amendment mutation and closes", async () => {
    const onClose = vi.fn();

    const mutationMock: MockedResponse = {
      request: {
        query: CREATE_AMENDMENT_MUTATION,
        variables: {
          input: {
            demonstrationId: "demo-1",
            name: "My Amendment",
            description: "Amendment description",
          },
        },
      },
      result: {
        data: {
          createAmendment: {
            __typename: "CreateAmendmentPayload",
            success: true,
            message: null,
            amendment: {
              __typename: "Amendment",
              id: "amend-1",
            },
          },
        },
      },
    };

    render(
      <TestProvider mocks={[...baseMocks, mutationMock]}>
        <CreateAmendmentDialog
          isOpen
          onClose={onClose}
          mode="add"
          demonstrationId="demo-1"
          data={{
            title: "My Amendment",
            description: "Amendment description",
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
      // Refetch?
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });
});

