import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExtensionWorkflow } from "./ExtensionWorkflow";

describe("ExtensionWorkflow", () => {
  it("renders APPLICATION heading", () => {
    render(<ExtensionWorkflow extensionId="test-extension-id" />);
    expect(screen.getByText("APPLICATION")).toBeInTheDocument();
  });
});
