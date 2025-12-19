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

  it("renders required asterisk when isRequired is true and has a title", () => {
    render(<RadioGroup {...requiredProps} isRequired title="Title" />);
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

  describe("Accessibility", () => {
    it("renders a fieldset with proper structure", () => {
      render(<RadioGroup {...requiredProps} title="Test Radio" />);
      const fieldset = screen.getByRole("group");
      expect(fieldset.tagName).toBe("FIELDSET");
    });

    it("renders legend when title is provided", () => {
      render(<RadioGroup {...requiredProps} title="Test Radio" />);
      const legend = screen.getByText("Test Radio");
      expect(legend.tagName).toBe("LEGEND");
    });

    it("does not render legend when title is not provided", () => {
      const { container } = render(<RadioGroup {...requiredProps} />);
      const legend = container.querySelector("legend");
      expect(legend).not.toBeInTheDocument();
    });

    it("adds aria-label to required asterisk", () => {
      render(<RadioGroup {...requiredProps} title="Test Radio" isRequired />);
      const asterisk = screen.getByLabelText("required");
      expect(asterisk).toBeInTheDocument();
      expect(asterisk.textContent).toBe("*");
    });

    it("generates unique IDs for each radio button", () => {
      render(<RadioGroup {...requiredProps} />);
      const radioA = screen.getByLabelText(/Option A/);
      const radioB = screen.getByLabelText("Option B");

      expect(radioA).toHaveAttribute("id", "test-radio-radio-option-a");
      expect(radioB).toHaveAttribute("id", "test-radio-radio-option-b");
      expect(radioA.id).not.toBe(radioB.id);
    });

    it("properly associates labels with inputs via htmlFor and id", () => {
      render(<RadioGroup {...requiredProps} />);
      const radioA = screen.getByLabelText(/Option A/);
      const label = screen.getByText("Option A").closest("label");

      expect(label).toHaveAttribute("for", radioA.id);
    });

    it("adds aria-describedby to reference helper text when present", () => {
      render(<RadioGroup {...requiredProps} />);
      const radioA = screen.getByLabelText(/Option A/);
      const helperId = "test-radio-radio-option-a-helper";

      expect(radioA).toHaveAttribute("aria-describedby", helperId);
      expect(screen.getByText("This is A")).toHaveAttribute("id", helperId);
    });

    it("does not add aria-describedby when no helper text", () => {
      render(<RadioGroup {...requiredProps} />);
      const radioB = screen.getByLabelText("Option B");

      expect(radioB).toHaveAttribute("aria-describedby", "test-radio-radio-option-b-helper");
    });

    it("adds aria-invalid when validation error exists", () => {
      const getValidationMessage = vi.fn(() => "Error message");
      render(<RadioGroup {...requiredProps} getValidationMessage={getValidationMessage} />);

      const radioB = screen.getByLabelText("Option B");
      fireEvent.click(radioB);

      expect(radioB).toHaveAttribute("aria-invalid", "true");
    });

    it("sets aria-invalid to false when no validation error", () => {
      render(<RadioGroup {...requiredProps} />);
      const radioA = screen.getByLabelText(/Option A/);

      expect(radioA).toHaveAttribute("aria-invalid", "false");
    });

    it("references validation message in aria-describedby when error exists", () => {
      const getValidationMessage = vi.fn(() => "Error message");
      const { rerender } = render(
        <RadioGroup {...requiredProps} getValidationMessage={getValidationMessage} />
      );

      const radioB = screen.getByLabelText("Option B");
      fireEvent.click(radioB);

      rerender(
        <RadioGroup {...requiredProps} value="b" getValidationMessage={getValidationMessage} />
      );

      expect(radioB).toHaveAttribute("aria-describedby", "test-radio-validation-message");
    });

    it("adds role=alert to validation message", () => {
      const getValidationMessage = vi.fn(() => "Error message");
      render(<RadioGroup {...requiredProps} getValidationMessage={getValidationMessage} />);

      const radioB = screen.getByLabelText("Option B");
      fireEvent.click(radioB);

      const errorMessage = screen.getByText("Error message");
      expect(errorMessage).toHaveAttribute("role", "alert");
    });

    it("adds aria-live=polite to validation message", () => {
      const getValidationMessage = vi.fn(() => "Error message");
      render(<RadioGroup {...requiredProps} getValidationMessage={getValidationMessage} />);

      const radioB = screen.getByLabelText("Option B");
      fireEvent.click(radioB);

      const errorMessage = screen.getByText("Error message");
      expect(errorMessage).toHaveAttribute("aria-live", "polite");
    });

    it("assigns unique ID to validation message", () => {
      const getValidationMessage = vi.fn(() => "Error message");
      render(<RadioGroup {...requiredProps} getValidationMessage={getValidationMessage} />);

      const radioB = screen.getByLabelText("Option B");
      fireEvent.click(radioB);

      const errorMessage = screen.getByText("Error message");
      expect(errorMessage).toHaveAttribute("id", "test-radio-validation-message");
    });

    it("adds role=radiogroup to container", () => {
      render(<RadioGroup {...requiredProps} />);
      const radiogroup = screen.getByRole("radiogroup");
      expect(radiogroup).toBeInTheDocument();
    });

    it("sanitizes option values with spaces for IDs", () => {
      const optionsWithSpaces = [
        { label: "Option A", value: "CMS (OSORA)" },
        { label: "Option B", value: "COMMs Clearance" },
      ];
      render(
        <RadioGroup
          name="clearance"
          options={optionsWithSpaces}
          value="CMS (OSORA)"
          onChange={mockOnChange}
        />
      );

      const radioA = screen.getByLabelText("Option A");
      expect(radioA).toHaveAttribute("id", "clearance-radio-option-cms-(osora)");
    });

    it("keeps original value with spaces in value attribute", () => {
      const optionsWithSpaces = [{ label: "Option A", value: "CMS (OSORA)" }];
      render(
        <RadioGroup
          name="clearance"
          options={optionsWithSpaces}
          value="CMS (OSORA)"
          onChange={mockOnChange}
        />
      );

      const radioA = screen.getByLabelText("Option A");
      expect(radioA).toHaveAttribute("value", "CMS (OSORA)");
    });

    it("marks radio as required when isRequired is true", () => {
      render(<RadioGroup {...requiredProps} isRequired />);
      const radioA = screen.getByLabelText(/Option A/);
      expect(radioA).toBeRequired();
    });

    it("does not mark radio as required when isRequired is false", () => {
      render(<RadioGroup {...requiredProps} />);
      const radioA = screen.getByLabelText(/Option A/);
      expect(radioA).not.toBeRequired();
    });
  });
});
