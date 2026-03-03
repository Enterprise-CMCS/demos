import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExtensionWorkflow } from "./ExtensionWorkflow";
import { TestProvider } from "test-utils/TestProvider";

describe("ExtensionWorkflow", () => {
  it("renders APPLICATION heading", async () => {
    render(
      <TestProvider>
        <ExtensionWorkflow extensionId="1" />
      </TestProvider>
    );

    expect(await screen.findByText("APPLICATION")).toBeInTheDocument();
  });
});
