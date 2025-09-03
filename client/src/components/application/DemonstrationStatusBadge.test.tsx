import React from "react";
import { describe, it, expect } from "vitest";
import { DemonstrationStatusBadge } from "./DemonstrationStatusBadge";
import { render, screen } from "@testing-library/react";

describe("DemonstrationStatusBadge", () => {
  it("shows Under Review for under_review", () => {
    render(<DemonstrationStatusBadge demonstrationStatus="under_review" />);
    expect(screen.getByText("Under Review")).toBeInTheDocument();
  });
  it("shows Approved for approved", () => {
    render(<DemonstrationStatusBadge demonstrationStatus="approved" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });
  it("shows Rejected for rejected", () => {
    render(<DemonstrationStatusBadge demonstrationStatus="rejected" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });
});
