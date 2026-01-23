import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Checkbox, CheckboxProps } from "./Checkbox";

// Helper component for controlled checkbox testing
const ControlledCheckbox = ({
  initialChecked = false,
  ...props
}: Omit<CheckboxProps, "checked"> & { initialChecked?: boolean }) => {
  const [checked, setChecked] = useState(initialChecked);
  return (
    <Checkbox
      {...props}
      checked={checked}
      onChange={(e) => {
        setChecked(e.target.checked);
        props.onChange?.(e);
      }}
    />
  );
};

describe("Checkbox component", () => {
  const defaultProps: Omit<CheckboxProps, "checked"> = {
    name: "test-checkbox",
    label: "Test Checkbox",
  };

  describe("Rendering", () => {
    it("renders checkbox with label", () => {
      render(<Checkbox {...defaultProps} checked={false} />);

      const checkbox = screen.getByTestId("test-checkbox");
      const label = screen.getByText("Test Checkbox");

      expect(checkbox).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("type", "checkbox");
    });

    it("has proper name and id attributes", () => {
      render(<Checkbox name="terms-and-conditions" label="Accept Terms" checked={false} />);

      const checkbox = screen.getByTestId("terms-and-conditions");
      expect(checkbox).toHaveAttribute("name", "terms-and-conditions");
      expect(checkbox).toHaveAttribute("id", "terms-and-conditions");
    });

    it("associates label with checkbox via wrapping", () => {
      render(<Checkbox {...defaultProps} checked={false} />);

      const checkbox = screen.getByTestId("test-checkbox");
      const label = screen.getByText("Test Checkbox").closest("label");

      expect(label).toContainElement(checkbox);
    });
  });

  describe("Controlled State Management", () => {
    it("renders as unchecked when checked prop is false", () => {
      render(<Checkbox {...defaultProps} checked={false} />);

      const checkbox = screen.getByTestId("test-checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it("renders as checked when checked prop is true", () => {
      render(<Checkbox {...defaultProps} checked={true} />);

      const checkbox = screen.getByTestId("test-checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it("updates when checked prop changes", () => {
      const { rerender } = render(<Checkbox {...defaultProps} checked={false} />);

      const checkbox = screen.getByTestId("test-checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      // Update the checked prop
      rerender(<Checkbox {...defaultProps} checked={true} />);
      expect(checkbox.checked).toBe(true);
    });

    it("calls onChange when clicked", () => {
      const handleChange = vi.fn();
      render(<Checkbox {...defaultProps} checked={false} onChange={handleChange} />);

      const checkbox = screen.getByTestId("test-checkbox");
      fireEvent.click(checkbox);

      expect(handleChange).toHaveBeenCalledTimes(1);

      // Verify the event was called with a change event
      const callArg = handleChange.mock.calls[0][0];
      expect(callArg.type).toBe("change");
      expect(callArg.target).toBeDefined();
    });

    it("toggles checked state when used with controlled component pattern", () => {
      render(<ControlledCheckbox {...defaultProps} initialChecked={false} />);

      const checkbox = screen.getByTestId("test-checkbox") as HTMLInputElement;

      // Initially unchecked
      expect(checkbox.checked).toBe(false);

      // Click to check
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);

      // Click to uncheck
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty label string", () => {
      render(<Checkbox {...defaultProps} label="" checked={false} />);

      const checkbox = screen.getByTestId("test-checkbox");
      expect(checkbox).toBeInTheDocument();
    });

    it("handles onChange being undefined", () => {
      render(<Checkbox {...defaultProps} checked={false} />);

      const checkbox = screen.getByTestId("test-checkbox");

      // Should not throw error when clicked
      expect(() => fireEvent.click(checkbox)).not.toThrow();
    });

    it("clicking label also toggles checkbox with controlled pattern", () => {
      render(<ControlledCheckbox {...defaultProps} initialChecked={false} />);

      const checkbox = screen.getByTestId("test-checkbox") as HTMLInputElement;
      const label = screen.getByText("Test Checkbox");

      expect(checkbox.checked).toBe(false);

      // Click label text
      fireEvent.click(label);
      expect(checkbox.checked).toBe(true);
    });

    it("does not change state without onChange handler", () => {
      render(<Checkbox {...defaultProps} checked={false} />);

      const checkbox = screen.getByTestId("test-checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      // Click checkbox - state should not change since no onChange handler updates parent state
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it("sets indeterminate state when provided", () => {
      render(<Checkbox {...defaultProps} checked={false} indeterminate={true} />);

      const checkbox = screen.getByTestId("test-checkbox") as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
      expect(checkbox.getAttribute("aria-checked")).toBe("mixed");
    });
  });
});
