import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RadioGroup, RadioGroupProps } from "./RadioGroup";

describe("RadioGroup component", () => {
  const options = [
    { label: "Option A", value: "a", helperText: "This is A" },
    { label: "Option B", value: "b" },
  ];

  const mockOnChange = vi.fn();

  const requiredProps: RadioGroupProps = {
    name: "test-radio",
    options,
    value: "a",
    onChange: mockOnChange,
  };

  it("renders title and options", () => {
    render(<RadioGroup {...requiredProps} title="Test Radio" />);
    const labelA = screen.getByText("Option A").closest("label");
    const labelB = screen.getByText("Option B").closest("label");

    expect(screen.getByText("Test Radio")).toBeInTheDocument();
    expect(labelA).toBeInTheDocument();
    expect(labelB).toBeInTheDocument();
  });

  it("renders required asterisk when isRequired is true", () => {
    render(<RadioGroup {...requiredProps} isRequired />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not render required asterisk when isRequired is false", () => {
    render(<RadioGroup {...requiredProps} />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders helperText when provided", () => {
    render(<RadioGroup {...requiredProps} />);
    expect(screen.getByText("This is A")).toBeInTheDocument();
  });

  it("renders as disabled when isDisabled is true", () => {
    render(<RadioGroup {...requiredProps} isDisabled />);
    const label = screen.getByText("Option A").closest("label");
    expect(label?.querySelector("input")).toBeDisabled();
  });

  it("selects defaultValue if provided", () => {
    render(<RadioGroup {...requiredProps} value="b" />);
    const input = screen.getByLabelText("Option B");
    expect(input).toBeChecked();
  });

  it("calls onChange when option value changes", () => {
    render(<RadioGroup {...requiredProps} />);
    const alreadySelectedOption = screen.getByLabelText(/Option A/);
    fireEvent.click(alreadySelectedOption);
    expect(mockOnChange).not.toHaveBeenCalled();
    const newOption = screen.getByLabelText("Option B");
    fireEvent.click(newOption);
    expect(mockOnChange).toHaveBeenCalledWith("b");
  });

  it("calls getValidationMessage and displays error", () => {
    const getValidationMessage = vi.fn((val: string) => (val === "b" ? "Invalid choice" : ""));
    render(<RadioGroup {...requiredProps} getValidationMessage={getValidationMessage} />);
    const input = screen.getByLabelText("Option B");
    fireEvent.click(input);
    expect(getValidationMessage).toHaveBeenCalledWith("b");
    expect(screen.getByText("Invalid choice")).toBeInTheDocument();
  });

  it("clears validation message when input becomes valid", () => {
    const getValidationMessage = vi.fn((val: string) => (val === "a" ? "" : "Invalid"));
    let currentValue = "a";
    const handleChange = vi.fn((val: string) => {
      currentValue = val;
    });

    const { rerender } = render(
      <RadioGroup
        {...requiredProps}
        value={currentValue}
        onChange={handleChange}
        getValidationMessage={getValidationMessage}
      />
    );

    const bInput = screen.getByText("Option B").closest("label")!.querySelector("input")!;
    fireEvent.click(bInput);

    rerender(
      <RadioGroup
        {...requiredProps}
        value="b"
        onChange={handleChange}
        getValidationMessage={getValidationMessage}
      />
    );
    expect(screen.getByText("Invalid")).toBeInTheDocument();

    const aInput = screen.getByText("Option A").closest("label")!.querySelector("input")!;
    fireEvent.click(aInput);

    rerender(
      <RadioGroup
        {...requiredProps}
        value="a"
        onChange={handleChange}
        getValidationMessage={getValidationMessage}
      />
    );
    expect(screen.queryByText("Invalid")).not.toBeInTheDocument();
  });

  it("does not crash without getValidationMessage", () => {
    render(<RadioGroup {...requiredProps} />);
    const input = screen.getByText("Option A").closest("label")!.querySelector("input")!;
    fireEvent.click(input);
    expect(input).toBeChecked();
  });

  it("renders radio buttons stacked vertically when isInline is false", () => {
    render(<RadioGroup {...requiredProps} isInline={false} />);
    const container = screen.getByText("Option A").closest("div")?.parentElement?.parentElement;
    expect(container?.className).toContain("flex-col");
  });
});
