import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DatePicker } from "./DatePicker";

describe("DatePicker Dirty Validation", () => {
  it("starts with normal label color", () => {
    render(
      <DatePicker
        name="test-date"
        label="Test Date"
        isRequired
      />
    );

    const label = screen.getByText("Test Date");
    expect(label).not.toHaveClass("text-error-dark");
  });

  it("shows red label when required field is touched but left empty", () => {
    render(
      <DatePicker
        name="test-date"
        label="Test Date"
        isRequired
      />
    );

    const input = screen.getByTestId("test-date");

    // Touch the field (blur without entering value)
    fireEvent.blur(input);

    const label = screen.getByText("Test Date");
    expect(label).toHaveClass("text-error-dark");
  });

  it("shows red label when user clears a previously set value", () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(
      <DatePicker
        name="test-date"
        label="Test Date"
        value="2024-01-15"
        onChange={mockOnChange}
        isRequired
      />
    );

    const input = screen.getByTestId("test-date");

    // Clear the value
    fireEvent.change(input, { target: { value: "" } });

    // Re-render with empty value
    rerender(
      <DatePicker
        name="test-date"
        label="Test Date"
        value=""
        onChange={mockOnChange}
        isRequired
      />
    );

    const label = screen.getByText("Test Date");
    expect(label).toHaveClass("text-error-dark");
  });

  it("shows normal label when valid date is entered", () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(
      <DatePicker
        name="test-date"
        label="Test Date"
        onChange={mockOnChange}
        isRequired
      />
    );

    const input = screen.getByTestId("test-date");

    // Enter valid date
    fireEvent.change(input, { target: { value: "2024-01-15" } });

    // Re-render with valid value
    rerender(
      <DatePicker
        name="test-date"
        label="Test Date"
        value="2024-01-15"
        onChange={mockOnChange}
        isRequired
      />
    );

    const label = screen.getByText("Test Date");
    expect(label).not.toHaveClass("text-error-dark");
  });

  it("resets to clean state on page refresh (component remount)", () => {
    const { unmount } = render(
      <DatePicker
        name="test-date"
        label="Test Date"
        value="" // empty value but dirty state should be reset
        isRequired
      />
    );

    unmount();

    // Re-mount component (simulates page refresh)
    render(
      <DatePicker
        name="test-date"
        label="Test Date"
        value=""
        isRequired
      />
    );

    const label = screen.getByText("Test Date");
    expect(label).not.toHaveClass("text-error-dark");
  });
});
