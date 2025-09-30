import React from "react";
import { describe, it, expect } from "vitest";
import { PhaseDate } from "./PhaseDate";
import { render, screen } from "@testing-library/react";

describe("PhaseDate", () => {
  it("renders date for Started", () => {
    render(<PhaseDate phaseStatus="Started" date={new Date(2024, 0, 2)} />);
    expect(screen.getByText("Due")).toBeInTheDocument();
    expect(screen.getByText("01/02/2024")).toBeInTheDocument();
  });

  it("renders past due messaging when flagged", () => {
    render(<PhaseDate phaseStatus="past-due" date={new Date(2024, 0, 2)} />);
    expect(screen.getByText("Past Due")).toBeInTheDocument();
    expect(screen.getByText("01/02/2024")).toBeInTheDocument();
  });

  it("renders placeholder for missing date", () => {
    render(<PhaseDate phaseStatus="Not Started" />);
    expect(screen.getByText("Not Started")).toBeInTheDocument();
    expect(screen.getByText("--/--/----")).toBeInTheDocument();
  });
});
