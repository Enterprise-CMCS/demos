import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { UserProvider, GET_CURRENT_USER_QUERY } from "./UserProvider";
import { mockUsers } from "mock-data/userMocks";

vi.mock("react-oidc-context", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "react-oidc-context";

const mockUseAuth = vi.mocked(useAuth);

const authenticatedAuth = {
  isAuthenticated: true,
  isLoading: false,
  user: { profile: { name: "Jane Doe", email: "jane@example.com" } },
};

describe("UserProvider", () => {
  it("renders children when user loads successfully", async () => {
    mockUseAuth.mockReturnValue(authenticatedAuth as ReturnType<typeof useAuth>);

    const successMock = {
      request: { query: GET_CURRENT_USER_QUERY },
      result: { data: { currentUser: mockUsers[0] } },
    };

    render(
      <MockedProvider mocks={[successMock]}>
        <UserProvider>
          <div>app content</div>
        </UserProvider>
      </MockedProvider>
    );

    await waitFor(() => expect(screen.getByText("app content")).toBeInTheDocument());
  });

  it("renders UserAuthenticationFailed on query error", async () => {
    mockUseAuth.mockReturnValue(authenticatedAuth as ReturnType<typeof useAuth>);

    const errorMock = {
      request: { query: GET_CURRENT_USER_QUERY },
      error: new Error("Something went wrong"),
    };

    render(
      <MockedProvider mocks={[errorMock]}>
        <UserProvider>
          <div>app content</div>
        </UserProvider>
      </MockedProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("Authentication Failed")).toBeInTheDocument()
    );
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
  });

  it("renders UserAuthenticationFailed when currentUser is null", async () => {
    mockUseAuth.mockReturnValue(authenticatedAuth as ReturnType<typeof useAuth>);

    const nullUserMock = {
      request: { query: GET_CURRENT_USER_QUERY },
      result: { data: { currentUser: null } },
    };

    render(
      <MockedProvider mocks={[nullUserMock]}>
        <UserProvider>
          <div>app content</div>
        </UserProvider>
      </MockedProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("Authentication Failed")).toBeInTheDocument()
    );
  });

  it("renders loading state while auth is loading", () => {
    mockUseAuth.mockReturnValue({
      ...authenticatedAuth,
      isLoading: true,
    } as ReturnType<typeof useAuth>);

    render(
      <MockedProvider mocks={[]}>
        <UserProvider>
          <div>app content</div>
        </UserProvider>
      </MockedProvider>
    );

    expect(screen.queryByText("app content")).not.toBeInTheDocument();
    expect(screen.queryByText("Authentication Failed")).not.toBeInTheDocument();
  });
});
