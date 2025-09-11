import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import { PhaseSelector } from "./PhaseSelector";

describe("PhaseSelector", () => {
  it("renders all phase names", () => {
    render(
      <TestProvider>
        <PhaseSelector />
      </TestProvider>
    );
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
