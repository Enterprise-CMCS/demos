import React from "react";
import { describe, it, expect } from "vitest";
import { PhaseBox } from "./PhaseBox";
import { render, screen, fireEvent } from "@testing-library/react";

describe("PhaseBox", () => {
  it("renders phase name and number", () => {
    render(
      <PhaseBox
        phaseName="Concept"
        phaseNumber={1}
        phaseStatus="not_started"
        isSelectedPhase={false}
        setPhaseAsSelected={() => {}}
      />
    );
    expect(screen.getByText("Concept")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("calls setPhaseAsSelected on click", () => {
    const mockFn = vi.fn();
    render(
      <PhaseBox
        phaseName="Concept"
        phaseNumber={1}
        phaseStatus="not_started"
        isSelectedPhase={false}
        setPhaseAsSelected={mockFn}
      />
    );
    fireEvent.click(screen.getByText("Concept"));
    expect(mockFn).toHaveBeenCalled();
  });
});
