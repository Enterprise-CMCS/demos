import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AmendmentWorkflow } from "./AmendmentWorkflow";
import { TestProvider } from "test-utils/TestProvider";

describe("AmendmentWorkflow", () => {
  it("renders APPLICATION heading", async () => {
    render(
      <TestProvider>
        <AmendmentWorkflow amendmentId="1" />
      </TestProvider>
    );

    expect(await screen.findByText("APPLICATION")).toBeInTheDocument();
  });
});
