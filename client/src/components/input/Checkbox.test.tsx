import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Checkbox, CheckboxProps } from "./Checkbox";

describe("Checkbox component", () => {
  const defaultProps: CheckboxProps = {
    name: "test-checkbox",
    label: "Test Checkbox",
  };

  describe("Rendering", () => {
    it("renders checkbox with label", () => {
      render(<Checkbox {...defaultProps} />);

      const checkbox = screen.getByTestId("test-checkbox");
      const label = screen.getByText("Test Checkbox");

      expect(checkbox).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("type", "checkbox");
    });

    it("has proper name and id attributes", () => {
      render(<Checkbox {...defaultProps} name="terms-and-conditions" label="Accept Terms" />);

      const checkbox = screen.getByTestId("terms-and-conditions");
      expect(checkbox).toHaveAttribute("name", "terms-and-conditions");
      expect(checkbox).toHaveAttribute("id", "terms-and-conditions");
    });

    it("associates label with checkbox via wrapping", () => {
      render(<Checkbox {...defaultProps} />);

      const checkbox = screen.getByTestId("test-checkbox");
      const label = screen.getByText("Test Checkbox").closest("label");

      expect(label).toContainElement(checkbox);
    });
  });

  describe("State Management", () => {
    it("starts unchecked by default", () => {
      render(<Checkbox {...defaultProps} />);

      const checkbox = screen.getByTestId("test-checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it("starts checked when defaultChecked is true", () => {
      render(<Checkbox {...defaultProps} defaultChecked />);

      const checkbox = screen.getByTestId("test-checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it("toggles checked state when clicked", () => {
      render(<Checkbox {...defaultProps} />);

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

    it("calls onChange when clicked", () => {
      const handleChange = vi.fn();
      render(<Checkbox {...defaultProps} onChange={handleChange} />);

      const checkbox = screen.getByTestId("test-checkbox");
      fireEvent.click(checkbox);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            checked: true,
          }),
        })
      );
    });
  });

  describe("Edge Cases", () => {
    it("handles empty label string", () => {
      render(<Checkbox {...defaultProps} label="" />);

      const checkbox = screen.getByTestId("test-checkbox");
      expect(checkbox).toBeInTheDocument();
    });

    it("handles onChange being undefined", () => {
      render(<Checkbox {...defaultProps} />);

      const checkbox = screen.getByTestId("test-checkbox");

      // Should not throw error when clicked
      expect(() => fireEvent.click(checkbox)).not.toThrow();
    });

    it("clicking label also toggles checkbox", () => {
      render(<Checkbox {...defaultProps} />);

      const checkbox = screen.getByTestId("test-checkbox") as HTMLInputElement;
      const label = screen.getByText("Test Checkbox");

      expect(checkbox.checked).toBe(false);

      // Click label text
      fireEvent.click(label);
      expect(checkbox.checked).toBe(true);
    });
  });
});
