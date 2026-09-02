import React from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DefaultHeaderLower } from "./DefaultHeaderLower";
import { TestProvider } from "test-utils/TestProvider";

describe("DefaultHeaderLower", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("displays user greeting", () => {
    render(
      <TestProvider>
        <DefaultHeaderLower />
      </TestProvider>
    );
    expect(screen.getByText("Hello CMS User")).toBeInTheDocument();
  });

  it("does not render the Create New menu", () => {
    render(
      <TestProvider>
        <DefaultHeaderLower />
      </TestProvider>
    );

    expect(screen.queryByText("Create New")).not.toBeInTheDocument();
  });
});
