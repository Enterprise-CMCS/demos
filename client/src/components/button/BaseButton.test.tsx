import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { Button } from "./Button";

describe("BaseButton eagerTooltip", () => {
  const showPopover = vi.fn();
  const hidePopover = vi.fn();

  beforeEach(() => {
    showPopover.mockClear();
    hidePopover.mockClear();
    HTMLElement.prototype.showPopover = showPopover;
    HTMLElement.prototype.hidePopover = hidePopover;
  });

  it("renders a tooltip element with the provided text", () => {
    render(
      <Button name="my-button" onClick={() => {}}>
        Click me
      </Button>
    );
    expect(screen.queryByRole("tooltip")).toBeNull();

    render(
      <Button name="tip-button" eagerTooltip="Helpful hint" onClick={() => {}}>
        Hover me
      </Button>
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent("Helpful hint");
  });

  it("shows the tooltip on mouse enter", () => {
    render(
      <Button name="tip-button" eagerTooltip="Show on hover" onClick={() => {}}>
        Hover me
      </Button>
    );
    screen.getByTestId("tip-button").dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    expect(showPopover).toHaveBeenCalledTimes(1);
  });

  it("hides the tooltip on mouse leave", () => {
    render(
      <Button name="tip-button" eagerTooltip="Show on hover" onClick={() => {}}>
        Hover me
      </Button>
    );
    screen.getByTestId("tip-button").dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it("shows the tooltip on focus", () => {
    render(
      <Button name="tip-button" eagerTooltip="Show on focus" onClick={() => {}}>
        Focus me
      </Button>
    );
    screen.getByTestId("tip-button").dispatchEvent(new FocusEvent("focus", { bubbles: true }));
    expect(showPopover).toHaveBeenCalledTimes(1);
  });

  it("hides the tooltip on blur", () => {
    render(
      <Button name="tip-button" eagerTooltip="Show on focus" onClick={() => {}}>
        Focus me
      </Button>
    );
    screen.getByTestId("tip-button").dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it("sets aria-describedby on the button pointing to the tooltip", () => {
    render(
      <Button name="tip-button" eagerTooltip="Helpful hint" onClick={() => {}}>
        Hover me
      </Button>
    );
    const button = screen.getByTestId("tip-button");
    const tooltip = screen.getByRole("tooltip");
    expect(button.getAttribute("aria-describedby")).toBe(tooltip.id);
  });

  it("does not set aria-describedby when eagerTooltip is absent", () => {
    render(
      <Button name="plain-button" onClick={() => {}}>
        No tooltip
      </Button>
    );
    expect(screen.getByTestId("plain-button")).not.toHaveAttribute("aria-describedby");
  });
});
