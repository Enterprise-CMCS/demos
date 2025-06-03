import React from "react";
import { render, screen } from "@testing-library/react";
import { Header } from "./Header";
import { describe, it, expect } from "vitest";

describe("Header Component", () => {
  it("renders without crashing", () => {
    const { container } = render(<Header />);
    expect(container).toBeInTheDocument();
  });

  it("displays the correct title", () => {
    render(<Header />);
    const titleElement = screen.getByText("DEMOS");
    expect(titleElement).toBeInTheDocument();
  });
});
