import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QuickLinks } from "./QuickLinks";

describe("QuickLinks", () => {
  it("renders all quick links", () => {
    render(<QuickLinks />);
    expect(screen.getByRole("link", { name: /Admin/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Help/i })).toBeInTheDocument();
  });
});
