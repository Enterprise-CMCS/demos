import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExtensionWorkflow } from "./ExtensionWorkflow";

describe("ExtensionWorkflow", () => {
  it("renders APPLICATION heading", () => {
    render(<ExtensionWorkflow />);
    expect(screen.getByText("APPLICATION")).toBeInTheDocument();
  });
});
