import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CheckboxGroup, CheckboxGroupProps } from "./CheckboxGroup";

describe("CheckboxGroup component", () => {
  const options = [
    { label: "Option A", value: "a", helperText: "This is A" },
    { label: "Option B", value: "b" },
  ];

  const requiredProps: CheckboxGroupProps = {
    name: "test-checkbox",
    label: "Test Checkbox",
    options,
  };

  it("renders label and options", () => {
    render(<CheckboxGroup {...requiredProps} />);
    const labelA = screen.getByText("Option A").closest("label");
    const labelB = screen.getByText("Option B").closest("label");

    expect(screen.getByText("Test Checkbox")).toBeInTheDocument();
    expect(labelA).toBeInTheDocument();
    expect(labelB).toBeInTheDocument();
  });

  it("renders required asterisk when isRequired is true", () => {
    render(<CheckboxGroup {...requiredProps} isRequired />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not render required asterisk when isRequired is false", () => {
    render(<CheckboxGroup {...requiredProps} />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders helperText when provided", () => {
    render(<CheckboxGroup {...requiredProps} />);
    expect(screen.getByText("This is A")).toBeInTheDocument();
  });

  it("renders as disabled when isDisabled is true", () => {
    render(<CheckboxGroup {...requiredProps} isDisabled />);
    const label = screen.getByText("Option A").closest("label");
    expect(label?.querySelector("input")).toBeDisabled();
  });

  it("checks defaultValues if provided", () => {
    render(<CheckboxGroup {...requiredProps} defaultValues={["b"]} />);
    const input = screen.getByLabelText("Option B");
    expect(input).toBeChecked();
  });

  it("updates values on change", () => {
    render(<CheckboxGroup {...requiredProps} />);
    const input = screen.getByLabelText("Option B");
    fireEvent.click(input);
    expect(input).toBeChecked();
  });

  it("calls getValidationMessage and displays error", () => {
    const getValidationMessage = vi.fn((vals: string[]) =>
      vals.includes("b") ? "Invalid choice" : ""
    );
    render(
      <CheckboxGroup
        {...requiredProps}
        getValidationMessage={getValidationMessage}
      />
    );
    const input = screen.getByLabelText("Option B");
    fireEvent.click(input);
    expect(getValidationMessage).toHaveBeenCalledWith(["b"]);
    expect(screen.getByText("Invalid choice")).toBeInTheDocument();
  });

  it("clears validation message when input becomes valid", () => {
    const getValidationMessage = vi.fn((vals: string[]) =>
      vals.includes("a") ? "" : "Invalid"
    );
    render(
      <CheckboxGroup
        {...requiredProps}
        getValidationMessage={getValidationMessage}
      />
    );

    const bInput = screen.getByText("Option B").closest("label")!.querySelector("input")!;
    fireEvent.click(bInput);
    expect(screen.getByText("Invalid")).toBeInTheDocument();

    const aInput = screen.getByText("Option A").closest("label")!.querySelector("input")!;
    fireEvent.click(aInput);
    expect(screen.queryByText("Invalid")).not.toBeInTheDocument();
  });

  it("does not crash without getValidationMessage", () => {
    render(<CheckboxGroup {...requiredProps} />);
    const input = screen.getByText("Option A").closest("label")!.querySelector("input")!;
    fireEvent.click(input);
    expect(input).toBeChecked();
  });

  it("renders checkboxes stacked vertically when isInline is false", () => {
    render(<CheckboxGroup {...requiredProps} isInline={false} />);
    const container = screen.getByText("Option A").closest("div")?.parentElement?.parentElement;
    expect(container?.className).toContain("flex-col");
  });

  it("tracks selectedValues correctly through a sequence of changes", () => {
    render(<CheckboxGroup {...requiredProps} />);
    const inputA = screen.getByText("Option A").closest("label")!.querySelector("input")!;
    const inputB = screen.getByText("Option B").closest("label")!.querySelector("input")!;

    // Select A
    fireEvent.click(inputA);
    expect(inputA).toBeChecked();
    expect(inputB).not.toBeChecked();

    // Select B
    fireEvent.click(inputB);
    expect(inputA).toBeChecked();
    expect(inputB).toBeChecked();

    // Deselect A
    fireEvent.click(inputA);
    expect(inputA).not.toBeChecked();
    expect(inputB).toBeChecked();
  });
});
