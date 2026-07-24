import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExtensionWorkflow } from "./ExtensionWorkflow";
import { TestProvider } from "test-utils/TestProvider";
import type { ApplicationWorkflowExtension } from "./ExtensionWorkflow";

vi.mock("components/application/phase-selector/PhaseSelector", () => ({
  PhaseSelector: () => <div data-testid="phase-selector" />,
}));

describe("ExtensionWorkflow", () => {
  it("renders APPLICATION heading", async () => {
    render(
      <TestProvider>
        <ExtensionWorkflow
          extension={
            {
              id: "1",
              status: "Pre-Submission",
            } as ApplicationWorkflowExtension
          }
        />
      </TestProvider>
    );

    expect(await screen.findByText("APPLICATION")).toBeInTheDocument();
  });
});
