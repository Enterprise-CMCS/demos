import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SelectOption } from "./SelectOption";

const scrollIntoView = vi.mocked(HTMLElement.prototype.scrollIntoView);

const renderSelectOption = (props: Partial<React.ComponentProps<typeof SelectOption>> = {}) => {
  const onSelect = vi.fn();
  const onHover = vi.fn();
  render(
    <SelectOption
      id="test-option"
      testId="test-select-option-alpha"
      label="Alpha"
      value="alpha"
      isActive={false}
      isSelected={false}
      onSelect={onSelect}
      onHover={onHover}
      {...props}
    />
  );
  return { onSelect, onHover };
};

describe("SelectOption", () => {
  it("renders as an option with its label, value and test id", () => {
    renderSelectOption();
    const option = screen.getByRole("option", { name: "Alpha" });
    expect(option).toHaveAttribute("id", "test-option");
    expect(option).toHaveAttribute("data-testid", "test-select-option-alpha");
    expect(option).toHaveValue("alpha");
    expect(option).toHaveAttribute("tabindex", "-1");
  });

  it("marks the option as selected", () => {
    renderSelectOption({ isSelected: true });
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent("Alpha");
  });

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSelectOption();
    await user.click(screen.getByRole("option"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("calls onHover when the pointer enters", async () => {
    const user = userEvent.setup();
    const { onHover } = renderSelectOption();
    await user.hover(screen.getByRole("option"));
    expect(onHover).toHaveBeenCalled();
  });

  it("scrolls into view only when active", () => {
    scrollIntoView.mockClear();
    renderSelectOption({ isActive: false });
    expect(scrollIntoView).not.toHaveBeenCalled();

    renderSelectOption({ isActive: true });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });
});
