import React from "react";
import { describe, it, expect, vi } from "vitest";
import { PhaseBox } from "./PhaseBox";
import { render, screen, fireEvent } from "@testing-library/react";

describe("PhaseBox", () => {
  it("renders phase name and number", () => {
    render(
      <PhaseBox
        phaseName="Concept"
        phaseNumber={1}
        phaseStatus="Not Started"
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
        phaseStatus="Not Started"
        isSelectedPhase={false}
        setPhaseAsSelected={mockFn}
      />
    );
    fireEvent.click(screen.getByText("Concept"));
    expect(mockFn).toHaveBeenCalled();
  });
});
