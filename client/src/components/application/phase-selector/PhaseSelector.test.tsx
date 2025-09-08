import React from "react";
import { describe, it, expect } from "vitest";
import { PhaseSelector } from "./PhaseSelector";
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "components/toast/ToastContext";

describe("PhaseSelector", () => {
  it("renders all phase names", () => {
    render(
      <ToastProvider>
        <MockedProvider mocks={[]} addTypename={false}>
          <PhaseSelector />
        </MockedProvider>
      </ToastProvider>
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
