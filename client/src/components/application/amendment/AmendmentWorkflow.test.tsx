import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AmendmentWorkflow } from "./AmendmentWorkflow";
import { TestProvider } from "test-utils/TestProvider";
import { createAmendmentWorkflowMock } from "mock-data/workflowMocks";

describe("AmendmentWorkflow", () => {
  it("renders APPLICATION heading", async () => {
    const mocks = [createAmendmentWorkflowMock("test-amendment-id")];

    render(
      <TestProvider mocks={mocks}>
        <AmendmentWorkflow amendmentId="test-amendment-id" />
      </TestProvider>
    );

    expect(await screen.findByText("APPLICATION")).toBeInTheDocument();
  });
});
