import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Select, Option } from "components/input/select/Select";

const SELECT_TEST_ID = "test-select";
const OPTIONS: Option[] = [
  { label: "Alpha", value: "alpha" },
  { label: "Beta", value: "beta" },
  { label: "Gamma", value: "gamma" },
];
const BASE_PROPS = { id: SELECT_TEST_ID, options: OPTIONS, onSelect: () => {} };

describe("Select", () => {
  it("renders label and options", () => {
    render(<Select {...BASE_PROPS} label="Test Label" placeholder="Choose one" />);
    expect(screen.getByLabelText("Test Label")).toBe(screen.getByTestId(SELECT_TEST_ID));
    expect(screen.getByText("Choose one")).toBeInTheDocument();
    OPTIONS.forEach((opt) => {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
    });
  });

  it("calls onSelect when an option is chosen", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<Select {...BASE_PROPS} onSelect={handleSelect} />);
    await user.selectOptions(screen.getByTestId(SELECT_TEST_ID), "beta");
    expect(handleSelect).toHaveBeenCalledWith("beta");
  });

  it("shows the selected value", () => {
    render(<Select {...BASE_PROPS} value="gamma" />);
    expect(screen.getByTestId(SELECT_TEST_ID)).toHaveValue("gamma");
  });

  it("allows clearing selection by choosing the placeholder", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<Select {...BASE_PROPS} value="alpha" onSelect={handleSelect} placeholder="Choose one" />);
    await user.selectOptions(screen.getByTestId(SELECT_TEST_ID), "Choose one");
    expect(handleSelect).toHaveBeenCalledWith("");
  });

  it("disables the select when isDisabled is true", () => {
    render(<Select {...BASE_PROPS} isDisabled />);
    expect(screen.getByTestId(SELECT_TEST_ID)).toBeDisabled();
  });

  it("requires the select when isRequired is true", () => {
    render(<Select {...BASE_PROPS} isRequired />);
    expect(screen.getByTestId(SELECT_TEST_ID)).toBeRequired();
  });

  it("keeps the select and option test ids", () => {
    render(<Select {...BASE_PROPS} />);
    expect(screen.getByTestId(SELECT_TEST_ID).tagName).toBe("SELECT");
    expect(screen.getByTestId(`${SELECT_TEST_ID}-option-empty`)).toBeInTheDocument();
    expect(screen.getByTestId(`${SELECT_TEST_ID}-option-beta`)).toHaveTextContent("Beta");
  });

  it("links the validation message to the select", () => {
    render(<Select {...BASE_PROPS} validationMessage="Selection is required" />);
    const select = screen.getByTestId(SELECT_TEST_ID);
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Selection is required");
  });

  it("generates unique ids when no id is passed", () => {
    render(
      <>
        <Select options={OPTIONS} label="First" onSelect={() => {}} />
        <Select options={OPTIONS} label="Second" onSelect={() => {}} />
      </>
    );
    const first = screen.getByLabelText("First");
    const second = screen.getByLabelText("Second");
    expect(first.id).toBeTruthy();
    expect(first.id).not.toEqual(second.id);
  });
});
