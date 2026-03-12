import React from "react";
import { describe, it, expect } from "vitest";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { render, screen } from "@testing-library/react";

describe("DemonstrationStatusBadge", () => {
  it("shows Under Review for DEMONSTRATION_UNDER_REVIEW", () => {
    render(<ApplicationStatusBadge applicationStatus="Under Review" />);
    expect(screen.getByText("Under Review")).toBeInTheDocument();
  });
  it("shows Approved for approved", () => {
    render(<ApplicationStatusBadge applicationStatus="Approved" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });
  it("shows Denied for DEMONSTRATION_DENIED", () => {
    render(<ApplicationStatusBadge applicationStatus="Denied" />);
    expect(screen.getByText("Denied")).toBeInTheDocument();
  });
});
