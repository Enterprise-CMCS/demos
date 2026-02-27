import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AmendmentWorkflow } from "./AmendmentWorkflow";

describe("AmendmentWorkflow", () => {
  it("renders APPLICATION heading", () => {
    render(<AmendmentWorkflow />);
    expect(screen.getByText("APPLICATION")).toBeInTheDocument();
  });
});
