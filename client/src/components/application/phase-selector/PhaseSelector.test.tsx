import React from "react";
import { describe, it, expect } from "vitest";
import { PhaseSelector } from "./PhaseSelector";
import { render, screen } from "@testing-library/react";

describe("PhaseSelector", () => {
  it("renders all phase names", () => {
    render(<PhaseSelector />);
    [
      "Concept",
      "State Application",
      "Completeness",
      "Federal Comment",
      "SME/FRT",
      "OGC & OMB",
      "Approval Package",
      "Post Approval",
    ].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });
});
