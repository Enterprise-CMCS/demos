import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RenewalWorkflow } from "./RenewalWorkflow";
import { TestProvider } from "test-utils/TestProvider";

describe("RenewalWorkflow", () => {
  it("renders APPLICATION heading", async () => {
    render(
      <TestProvider>
        <RenewalWorkflow renewalId="1" />
      </TestProvider>
    );

    expect(await screen.findByText("APPLICATION")).toBeInTheDocument();
  });
});
