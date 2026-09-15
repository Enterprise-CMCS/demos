import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TagStatusBadge } from "./TagStatusBadge";

describe("TagStatusBadge", () => {
  it("displays Approved for approved types/tags", () => {
    render(<TagStatusBadge approvalStatus="Approved" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("displays Pending for unapproved types/tags", () => {
    render(<TagStatusBadge approvalStatus="Unapproved" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
