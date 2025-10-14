import React from "react";
import { describe, it, expect } from "vitest";
import { DemonstrationStatusBadge } from "./DemonstrationStatusBadge";
import { render, screen } from "@testing-library/react";

describe("DemonstrationStatusBadge", () => {
  it("shows Under Review for DEMONSTRATION_UNDER_REVIEW", () => {
    render(<DemonstrationStatusBadge demonstrationStatus="Under Review" />);
    expect(screen.getByText("Under Review")).toBeInTheDocument();
  });
  it("shows Approved for approved", () => {
    render(<DemonstrationStatusBadge demonstrationStatus="Approved" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });
  it("shows Denied for DEMONSTRATION_DENIED", () => {
    render(<DemonstrationStatusBadge demonstrationStatus="Denied" />);
    expect(screen.getByText("Denied")).toBeInTheDocument();
  });
});
