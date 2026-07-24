import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AmendmentWorkflow } from "./AmendmentWorkflow";
import { TestProvider } from "test-utils/TestProvider";
import type { ApplicationWorkflowAmendment } from "./AmendmentWorkflow";

vi.mock("components/application/phase-selector/PhaseSelector", () => ({
  PhaseSelector: () => <div data-testid="phase-selector" />,
}));

describe("AmendmentWorkflow", () => {
  it("renders APPLICATION heading", async () => {
    render(
      <TestProvider>
        <AmendmentWorkflow
          amendment={
            {
              id: "1",
              status: "Pre-Submission",
            } as ApplicationWorkflowAmendment
          }
        />
      </TestProvider>
    );

    expect(await screen.findByText("APPLICATION")).toBeInTheDocument();
  });
});
