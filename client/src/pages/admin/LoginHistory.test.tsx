import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { LoginHistory, LOGIN_HISTORY_TEST_ID } from "./LoginHistory";

describe("LoginHistory", () => {
  it("renders the login history table", async () => {
    render(
      <TestProvider>
        <LoginHistory />
      </TestProvider>
    );

    expect(screen.getByTestId(LOGIN_HISTORY_TEST_ID)).toBeInTheDocument();
  });
});
