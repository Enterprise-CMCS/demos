import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { IconButton } from "./IconButton";

describe("IconButton", () => {
  const defaultProps = {
    name: "test-button",
    onClick: vi.fn(),
    icon: (
      <svg data-testid="icon">
        <path d="test" />
      </svg>
    ),
  };

  it("renders button with icon and text", () => {
    render(<IconButton {...defaultProps}>Click me</IconButton>);

    expect(screen.getByTestId("test-button")).toBeInTheDocument();
    expect(screen.getByTestId("test-button")).toHaveTextContent("Click me");
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("standardizes icon size to 20px", () => {
    const { container } = render(<IconButton {...defaultProps}>Text</IconButton>);

    const icon = container.querySelector('[data-testid="icon"]');
    expect(icon).toHaveClass("w-[20px]", "h-[20px]");
  });

  it("positions icon on the left when specified", () => {
    render(
      <IconButton {...defaultProps} iconPosition="left">
        Text
      </IconButton>
    );

    const button = screen.getByTestId("test-button");
    const icon = screen.getByTestId("icon");
    const span = button.querySelector("span");

    expect(button.children[0]).toBe(icon);
    expect(button.children[1]).toBe(span);
  });

  it("positions icon on the right by default", () => {
    render(<IconButton {...defaultProps}>Text</IconButton>);

    const button = screen.getByTestId("test-button");
    const icon = screen.getByTestId("icon");
    const span = button.querySelector("span");

    expect(button.children[0]).toBe(span);
    expect(button.children[1]).toBe(icon);
  });

  it("works with icon only (no text)", () => {
    render(<IconButton {...defaultProps} />);

    expect(screen.getByTestId("test-button")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByTestId("test-button").querySelector("span")).toBeNull();
  });

  it("passes through button props correctly", () => {
    render(
      <IconButton {...defaultProps} disabled>
        Disabled
      </IconButton>
    );
    const button = screen.getByTestId("test-button");
    expect(button).toBeDisabled();
  });
});
