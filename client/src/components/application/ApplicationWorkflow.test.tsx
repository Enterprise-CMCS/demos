import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import { ApplicationWorkflow } from "./ApplicationWorkflow";

describe("ApplicationWorkflow", () => {
  it("renders APPLICATION heading", () => {
    render(
      <TestProvider>
        <ApplicationWorkflow demonstration={{ status: "Under Review" }} />
      </TestProvider>
    );
    expect(screen.getByText("APPLICATION")).toBeInTheDocument();
  });
});
