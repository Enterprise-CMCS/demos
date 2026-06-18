import React from "react";

import * as UserContext from "components/user/UserContext";
import { vi } from "vitest";

import { render, screen } from "@testing-library/react";

import { DefaultHeaderLower } from "./DefaultHeaderLower";
import { mockUsers } from "mock-data/userMocks";

vi.mock("components/user/UserContext", async (importOriginal) => {
  const actual = await importOriginal<typeof UserContext>();
  return {
    ...actual,
    getCurrentUser: vi.fn(),
  };
});

describe("DefaultHeaderLower", () => {
  const mockGetCurrentUser = vi.mocked(UserContext.getCurrentUser);

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("displays user greeting", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });
    render(<DefaultHeaderLower />);
    expect(screen.getByText("Hello John Doe")).toBeInTheDocument();
  });

  it("does not render the Create New menu", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });

    render(<DefaultHeaderLower />);

    expect(screen.queryByText("Create New")).not.toBeInTheDocument();
  });
});
