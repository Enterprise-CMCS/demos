import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { VerticalTabEntry } from "./VerticalTabEntry";
import { InfoIcon } from "components/icons";

describe("VerticalTabEntry", () => {
  const defaultProps = {
    value: "test-tab",
    isSelected: false,
    label: "Test Tab",
    isNavCollapsed: false,
    handleTabSelect: vi.fn(),
    icon: <InfoIcon />,
  };

  it("renders the tab button with correct label", () => {
    render(<VerticalTabEntry {...defaultProps} />);

    const button = screen.getByTestId("button-test-tab");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Test Tab");
  });

  it("renders the icon", () => {
    render(<VerticalTabEntry {...defaultProps} />);

    expect(screen.getByLabelText("Info")).toBeInTheDocument();
  });

  it("calls handleTabSelect when clicked", async () => {
    const user = userEvent.setup();
    const handleTabSelect = vi.fn();

    render(<VerticalTabEntry {...defaultProps} handleTabSelect={handleTabSelect} />);

    const button = screen.getByTestId("button-test-tab");
    await user.click(button);

    expect(handleTabSelect).toHaveBeenCalledWith("test-tab");
    expect(handleTabSelect).toHaveBeenCalledTimes(1);
  });

  it("applies selected styles when isSelected is true", () => {
    render(<VerticalTabEntry {...defaultProps} isSelected={true} />);

    const button = screen.getByTestId("button-test-tab");
    expect(button).toHaveClass("border-l-4", "border-l-focus", "bg-white", "font-semibold");
  });

  it("does not apply selected styles when isSelected is false", () => {
    render(<VerticalTabEntry {...defaultProps} isSelected={false} />);

    const button = screen.getByTestId("button-test-tab");
    expect(button).not.toHaveClass("border-l-4");
    expect(button).not.toHaveClass("border-l-focus");
  });

  it("sets aria-selected attribute correctly when selected", () => {
    render(<VerticalTabEntry {...defaultProps} isSelected={true} />);

    const button = screen.getByTestId("button-test-tab");
    expect(button).toHaveAttribute("aria-selected", "true");
  });

  it("sets aria-selected attribute correctly when not selected", () => {
    render(<VerticalTabEntry {...defaultProps} isSelected={false} />);

    const button = screen.getByTestId("button-test-tab");
    expect(button).toHaveAttribute("aria-selected", "false");
  });

  it("hides label when isNavCollapsed is true", () => {
    render(<VerticalTabEntry {...defaultProps} isNavCollapsed={true} />);

    const button = screen.getByTestId("button-test-tab");
    // Icon should still be visible, but label text should not be rendered
    expect(screen.getByLabelText("Info")).toBeInTheDocument();
    expect(button.textContent).toBe("");
  });

  it("shows label when isNavCollapsed is false", () => {
    render(<VerticalTabEntry {...defaultProps} isNavCollapsed={false} />);

    const button = screen.getByTestId("button-test-tab");
    expect(button).toHaveTextContent("Test Tab");
  });

  it("applies focus color to icon when selected", () => {
    const { container } = render(<VerticalTabEntry {...defaultProps} isSelected={true} />);

    const iconSpan = container.querySelector("span.text-focus");
    expect(iconSpan).toBeInTheDocument();
  });

  it("does not apply focus color to icon when not selected", () => {
    const { container } = render(<VerticalTabEntry {...defaultProps} isSelected={false} />);

    const iconSpan = container.querySelector("span.text-focus");
    expect(iconSpan).not.toBeInTheDocument();
  });

  it("sets title attribute from label", () => {
    render(<VerticalTabEntry {...defaultProps} label="My Custom Label" />);

    const button = screen.getByTestId("button-test-tab");
    expect(button).toHaveAttribute("title", "My Custom Label");
  });

  it("sets title attribute to value when label is not provided", () => {
    render(<VerticalTabEntry {...defaultProps} label={undefined} />);

    const button = screen.getByTestId("button-test-tab");
    expect(button).toHaveAttribute("title", "test-tab");
  });

  it("renders with ReactNode label", () => {
    const complexLabel = (
      <span>
        Complex <strong>Label</strong>
      </span>
    );

    render(<VerticalTabEntry {...defaultProps} label={complexLabel} />);

    const button = screen.getByTestId("button-test-tab");
    expect(button).toHaveTextContent("Complex Label");
  });

  it("applies base styles to all tabs", () => {
    render(<VerticalTabEntry {...defaultProps} />);

    const button = screen.getByTestId("button-test-tab");
    expect(button).toHaveClass(
      "flex",
      "items-center",
      "gap-1",
      "font-medium",
      "px-1",
      "cursor-pointer"
    );
  });
});
