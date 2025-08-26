import React from "react";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { describe, it, expect } from "vitest";

describe("Footer Component", () => {
  it("renders without crashing", () => {
    const { container } = render(<Footer />);
    expect(container).toBeInTheDocument();
  });

  it("displays the current year", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    const yearElement = screen.getByText(new RegExp(currentYear.toString(), "i"));
    expect(yearElement).toBeInTheDocument();
  });
});
