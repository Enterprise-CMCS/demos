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

  // onChange commits immediately when a complete date is selected (calendar pick or keyboard).
  // Range is enforced by the native (inclusive) min/max attributes and surfaced via the
  // validation message derived from the parent's value prop.
  describe("onChange commit + range messaging", () => {
    it("does not propagate partial-year dates emitted during year-subfield editing", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date");

      fireEvent.input(input, { target: { value: "0003-03-20" } });
      fireEvent.input(input, { target: { value: "0025-03-20" } });
      fireEvent.input(input, { target: { value: "0202-01-01" } });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("commits an in-range value on change", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date");

      fireEvent.change(input, { target: { value: "2025-03-20" } });
      expect(mockOnChange).toHaveBeenCalledWith("2025-03-20");
    });

    it("commits the value on change, even when out of range", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date");

      fireEvent.change(input, { target: { value: "1899-12-31" } });
      expect(mockOnChange).toHaveBeenCalledWith("1899-12-31");
    });

    // Regression for the year-typing bug: while typing year digits, the browser emits partial
    // dates like "0003-05-15", "0030-05-15", "0302-05-15". The handler ignores these (year < 1000).
    // Only the completed year value (>= 1000) propagates.
    it("does not flash a message or propagate while typing a year over a pre-filled date", () => {
      render(<DatePicker {...requiredProps} value="2020-05-15" />);
      const input = screen.getByTestId("test-date");

      fireEvent.input(input, { target: { value: "0003-05-15" } });
      fireEvent.input(input, { target: { value: "0030-05-15" } });
      fireEvent.input(input, { target: { value: "0302-05-15" } });
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(screen.queryByText(/Date must be on or/)).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: "2026-05-15" } });
      expect(mockOnChange).toHaveBeenCalledWith("2026-05-15");
    });

    it("commits inclusive boundary dates 1900-01-01 and 2099-12-31 on change", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date");

      fireEvent.change(input, { target: { value: "1900-01-01" } });
      expect(mockOnChange).toHaveBeenCalledWith("1900-01-01");

      mockOnChange.mockClear();
      fireEvent.change(input, { target: { value: "2099-12-31" } });
      expect(mockOnChange).toHaveBeenCalledWith("2099-12-31");
    });

    it("shows a default message when the value prop is before the min bound", () => {
      render(<DatePicker {...requiredProps} value="1899-12-31" />);
      expect(screen.getByText("Date must be on or after 01/01/1900.")).toBeInTheDocument();
    });

    it("shows a default message when the value prop is after the max bound", () => {
      render(<DatePicker {...requiredProps} value="2100-01-01" />);
      expect(screen.getByText("Date must be on or before 12/31/2099.")).toBeInTheDocument();
    });

    it("shows no default message for inclusive boundary values", () => {
      const { rerender } = render(<DatePicker {...requiredProps} value="1900-01-01" />);
      expect(screen.queryByText(/Date must be on or/)).not.toBeInTheDocument();

      rerender(<DatePicker {...requiredProps} value="2099-12-31" />);
      expect(screen.queryByText(/Date must be on or/)).not.toBeInTheDocument();
    });

    it("uses the provided minDate/maxDate in the default message", () => {
      const { rerender } = render(
        <DatePicker {...requiredProps} minDate="2026-04-28" value="2026-04-01" />
      );
      expect(screen.getByText("Date must be on or after 04/28/2026.")).toBeInTheDocument();

      rerender(<DatePicker {...requiredProps} maxDate="2026-04-28" value="2026-05-01" />);
      expect(screen.getByText("Date must be on or before 04/28/2026.")).toBeInTheDocument();
    });

    it("lets getValidationMessage take precedence over the default range message", () => {
      render(
        <DatePicker
          {...requiredProps}
          value="1899-12-31"
          getValidationMessage={() => "Custom message"}
        />
      );
      expect(screen.getByText("Custom message")).toBeInTheDocument();
      expect(screen.queryByText(/Date must be on or after/)).not.toBeInTheDocument();
    });

    it("has default min and max attributes", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date") as HTMLInputElement;
      expect(input.min).toBe("1900-01-01");
      expect(input.max).toBe("2099-12-31");
    });

    it("forwards minDate to the input's min attribute", () => {
      render(<DatePicker {...requiredProps} minDate="2026-04-28" />);
      const input = screen.getByTestId("test-date") as HTMLInputElement;
      expect(input.min).toBe("2026-04-28");
    });

    it("forwards maxDate to the input's max attribute", () => {
      render(<DatePicker {...requiredProps} maxDate="2026-04-28" />);
      const input = screen.getByTestId("test-date") as HTMLInputElement;
      expect(input.max).toBe("2026-04-28");
    });
  });

  describe("4-Digit Year Format", () => {
    it("input type is date which enforces YYYY-MM-DD format", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date") as HTMLInputElement;
      expect(input.type).toBe("date");

      fireEvent.change(input, { target: { value: "2025-01-15" } });
      expect(mockOnChange).toHaveBeenCalledWith("2025-01-15");
    });
  });

  describe("Edge Cases", () => {
    it("accepts leap year dates", () => {
      render(<DatePicker {...requiredProps} />);
      const input = screen.getByTestId("test-date");
      fireEvent.change(input, { target: { value: "2024-02-29" } });
      expect(mockOnChange).toHaveBeenCalledWith("2024-02-29");
    });

    it("commits a cleared value on change", () => {
      render(<DatePicker {...requiredProps} value="2024-01-15" />);
      const input = screen.getByTestId("test-date");
      fireEvent.change(input, { target: { value: "" } });
      expect(mockOnChange).toHaveBeenCalledWith("");
    });
  });

  describe("Controlled Input Behavior", () => {
    it("reflects updated value prop in the DOM", () => {
      const { rerender } = render(<DatePicker {...requiredProps} value="2024-01-15" />);
      const input = screen.getByTestId("test-date") as HTMLInputElement;
      expect(input.value).toBe("2024-01-15");

      rerender(<DatePicker {...requiredProps} value="2024-06-01" />);
      expect(input.value).toBe("2024-06-01");
    });

    it("clears displayed value when value prop is set to empty string", () => {
      const { rerender } = render(<DatePicker {...requiredProps} value="2024-01-15" />);
      const input = screen.getByTestId("test-date") as HTMLInputElement;
      expect(input.value).toBe("2024-01-15");

      rerender(<DatePicker {...requiredProps} value="" />);
      expect(input.value).toBe("");
    });

    // Regression test for the year-typing bug. Native <input type="date"> fires input
    // events with e.target.value === "" while the user is mid-typing the year subfield
    // (the date is briefly incomplete). If DatePicker were a controlled <input value={value}>,
    // React would write input.value = "" on every render, wiping the in-progress digits and
    // making it impossible to type a year character-by-character. The defaultValue + ref-sync
    // pattern guarantees React only touches the DOM when the value prop actually changes,
    // so a parent re-render with the same value must NOT clobber the input's current state.
    it("does not overwrite the input DOM value when re-rendered with the same value", () => {
      const { rerender } = render(<DatePicker {...requiredProps} value="" />);
      const input = screen.getByTestId("test-date") as HTMLInputElement;

      // Simulate the browser's internal partial state during year typing
      input.value = "2024-01-15";

      rerender(<DatePicker {...requiredProps} value="" />);

      expect(input.value).toBe("2024-01-15");
    });

    // Regression for "editing a subfield scopes me out". While the user edits one subfield of an
    // existing date, the browser briefly reports an incomplete date and the parent propagates a
    // changed value. Writing to the focused input would drop focus and break the mm→dd→yyyy
    // advance / close the calendar, so the ref-sync must skip the write while the input is focused.
    it("does not reset the input DOM value while the input is focused", () => {
      const { rerender } = render(<DatePicker {...requiredProps} value="2020-05-15" />);
      const input = screen.getByTestId("test-date") as HTMLInputElement;

      input.focus();
      input.value = "2020-08-15"; // user's in-progress subfield edit

      rerender(<DatePicker {...requiredProps} value="" />);

      expect(input.value).toBe("2020-08-15");
      expect(document.activeElement).toBe(input);
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
