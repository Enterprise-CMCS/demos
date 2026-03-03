import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExtensionWorkflow } from "./ExtensionWorkflow";
import { TestProvider } from "test-utils/TestProvider";
import { createExtensionWorkflowMock } from "mock-data/workflowMocks";

describe("ExtensionWorkflow", () => {
  it("renders APPLICATION heading", async () => {
    const mocks = [createExtensionWorkflowMock("test-extension-id")];

    render(
      <TestProvider mocks={mocks}>
        <ExtensionWorkflow extensionId="test-extension-id" />
      </TestProvider>
    );

    expect(await screen.findByText("APPLICATION")).toBeInTheDocument();
  });
});
