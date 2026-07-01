import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider, MockedProviderProps } from "@apollo/client/testing";
import { UserProvider, GET_CURRENT_USER_QUERY, NO_USER_FOUND_ERROR_MESSAGE } from "./UserProvider";
import { mockUsers } from "mock-data/userMocks";

const successMock = {
  request: { query: GET_CURRENT_USER_QUERY },
  result: { data: { currentUser: mockUsers[0] } },
};

const renderProvider = (mocks: MockedProviderProps["mocks"] = [successMock]) =>
  render(
    <MockedProvider mocks={mocks}>
      <UserProvider>
        <div>app content</div>
      </UserProvider>
    </MockedProvider>
  );

describe("UserProvider", () => {
  it("renders loading state while the current user query is loading", () => {
    renderProvider();

    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
    expect(screen.queryByText("Authentication Failed")).not.toBeInTheDocument();
  });

  it("renders children when user loads successfully", async () => {
    renderProvider();

    await waitFor(() => expect(screen.getByText("app content")).toBeInTheDocument());
  });

  it("renders UserAuthenticationFailed on query error", async () => {
    const errorMock = {
      request: { query: GET_CURRENT_USER_QUERY },
      error: new Error("Something went wrong"),
    };

    renderProvider([errorMock]);

    await waitFor(() => expect(screen.getByText("Authentication Failed")).toBeInTheDocument());
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
  });

  it("renders UserAuthenticationFailed when currentUser is null", async () => {
    const nullUserMock = {
      request: { query: GET_CURRENT_USER_QUERY },
      result: { data: { currentUser: null } },
    };

    renderProvider([nullUserMock]);

    await waitFor(() => expect(screen.getByText("Authentication Failed")).toBeInTheDocument());
    expect(screen.getByText(new RegExp(NO_USER_FOUND_ERROR_MESSAGE))).toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
  });
});
