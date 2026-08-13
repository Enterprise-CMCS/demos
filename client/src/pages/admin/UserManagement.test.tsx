import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { UserManagement, USER_MANAGEMENT_TEST_ID } from "./UserManagement";

describe("UserManagement", () => {
  it("renders the user management table", async () => {
    render(
      <TestProvider>
        <UserManagement />
      </TestProvider>
    );

    expect(screen.getByTestId(USER_MANAGEMENT_TEST_ID)).toBeInTheDocument();
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});
