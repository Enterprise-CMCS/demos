import React from "react";
import { describe, it, expect } from "vitest";
import { ApplicationWorkflow } from "./ApplicationWorkflow";
import { render, screen } from "@testing-library/react";

describe("ApplicationWorkflow", () => {
  it("renders APPLICATION heading", () => {
    render(<ApplicationWorkflow demonstration={{ status: "under_review" }} />);
    expect(screen.getByText("APPLICATION")).toBeInTheDocument();
  });
});
