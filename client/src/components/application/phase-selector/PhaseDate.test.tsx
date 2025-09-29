import React from "react";
import { describe, it, expect } from "vitest";
import { PhaseDate } from "./PhaseDate";
import { render, screen } from "@testing-library/react";

describe("PhaseDate", () => {
  it("renders date for in_progress", () => {
    render(<PhaseDate phaseStatus="in_progress" date={new Date(2024, 0, 2)} />);
    expect(screen.getByText("Due")).toBeInTheDocument();
    expect(screen.getByText("01/02/2024")).toBeInTheDocument();
  });

  it("renders past due messaging when status is past_due", () => {
    render(<PhaseDate phaseStatus="past_due" date={new Date(2024, 0, 2)} />);
    expect(screen.getByText("Past Due")).toBeInTheDocument();
    expect(screen.getByText("01/02/2024")).toBeInTheDocument();
  });

  it("renders placeholder for missing date", () => {
    render(<PhaseDate phaseStatus="not_started" />);
    expect(screen.getByText("Not Started")).toBeInTheDocument();
    expect(screen.getByText("--/--/----")).toBeInTheDocument();
  });
});
