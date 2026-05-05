import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("renders the title", () => {
    render(<Card title="My Title">content</Card>);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(<Card title="Title"><span data-testid="child">child content</span></Card>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies card styles", () => {
    const { container } = render(<Card title="Title">content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("shadow-md", "bg-white");
  });
});
