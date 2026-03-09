import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DatePicker } from "./DatePicker";

describe("DatePicker component", () => {
  const mockOnChange = vi.fn();

  const requiredProps = {
    name: "test-date",
    label: "Test Date",
    onChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe("Rendering", () => {
    it("renders label, input, and required asterisk", () => {
      render(<DatePicker {...requiredProps} isRequired />);
      expect(screen.getByText("Test Date")).toBeInTheDocument();
      expect(screen.getByTestId("test-date")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("renders as disabled with initial value", () => {
      render(<DatePicker {...requiredProps} isDisabled value="2025-06-15" />);
      const input = screen.getByTestId("test-date") as HTMLInputElement;
      expect(input).toBeDisabled();
      expect(input.value).toBe("2025-06-15");
    });

    it("displays validation message when provided", () => {
      const getValidationMessage = vi.fn(() => "This date is required");
      render(<DatePicker {...requiredProps} getValidationMessage={getValidationMessage} />);
      expect(screen.getByText("This date is required")).toBeInTheDocument();
    });
  });

  describe("Year Validation - 4 Digit Years Between 1900 and 2099", () => {
    it("accepts valid dates within the 1900-2099 range", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date");

      fireEvent.input(input, { target: { value: "1901-06-15" } });
      expect(mockOnChange).toHaveBeenCalledWith("1901-06-15");

      mockOnChange.mockClear();
      fireEvent.input(input, { target: { value: "2025-03-20" } });
      expect(mockOnChange).toHaveBeenCalledWith("2025-03-20");

      mockOnChange.mockClear();
      fireEvent.input(input, { target: { value: "2098-12-25" } });
      expect(mockOnChange).toHaveBeenCalledWith("2098-12-25");
    });

    it("does not call onChange for boundary dates (1900-01-01 and 2099-12-31)", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date");

      fireEvent.input(input, { target: { value: "1900-01-01" } });
      expect(mockOnChange).not.toHaveBeenCalled();

      fireEvent.input(input, { target: { value: "2099-12-31" } });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("rejects dates before 1900", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date");

      fireEvent.input(input, { target: { value: "1899-12-31" } });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("rejects dates after 2099", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date");

      fireEvent.input(input, { target: { value: "2100-01-01" } });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("has min and max attributes set correctly", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date") as HTMLInputElement;
      expect(input.min).toBe("1900-01-01");
      expect(input.max).toBe("2099-12-31");
    });
  });

  describe("4-Digit Year Format", () => {
    it("input type is date which enforces YYYY-MM-DD format", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date") as HTMLInputElement;
      expect(input.type).toBe("date");

      fireEvent.input(input, { target: { value: "2025-01-15" } });
      expect(mockOnChange).toHaveBeenCalledWith("2025-01-15");
    });
  });

  describe("Edge Cases", () => {
    it("accepts leap year dates", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date");
      fireEvent.input(input, { target: { value: "2024-02-29" } });
      expect(mockOnChange).toHaveBeenCalledWith("2024-02-29");
    });

    it("calls onChange when existing value is cleared", () => {
      render(<DatePicker {...requiredProps} value="2024-01-15" />);
      const input = screen.getByTestId("test-date");
      fireEvent.input(input, { target: { value: "" } });
      expect(mockOnChange).toHaveBeenCalledWith("");
    });
  });

  describe("Validation Message", () => {
    it("applies error styling when validation message is present", () => {
      const getValidationMessage = vi.fn(() => "Invalid date");
      render(<DatePicker {...requiredProps} getValidationMessage={getValidationMessage} />);
      const input = screen.getByTestId("test-date");
      expect(input.className).toContain("border-border-warn");
    });
  });
});
