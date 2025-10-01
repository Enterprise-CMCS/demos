import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  const defaultProps = {
    name: "description",
    label: "Description",
  };

  it("renders with label and textarea", () => {
    render(<Textarea {...defaultProps} />);

    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByTestId("textarea-description")).toBeInTheDocument();
  });

  it("shows required indicator when isRequired is true", () => {
    render(<Textarea {...defaultProps} isRequired />);

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("displays placeholder text", () => {
    render(<Textarea {...defaultProps} placeholder="Enter your description..." />);

    expect(screen.getByPlaceholderText("Enter your description...")).toBeInTheDocument();
  });

  it("starts with 1 row by default", () => {
    render(<Textarea {...defaultProps} />);

    const textarea = screen.getByTestId("textarea-description");
    expect(textarea).toHaveAttribute("rows", "1");
  });

  describe("Auto-growing behavior", () => {
    it("grows to 2 rows when user adds one line break", async () => {
      const user = userEvent.setup();
      render(<Textarea {...defaultProps} />);

      const textarea = screen.getByTestId("textarea-description");

      // Initially 1 row
      expect(textarea).toHaveAttribute("rows", "1");

      // Type text with line break
      await user.type(textarea, "First line{Enter}Second line");

      // Should now be 2 rows
      expect(textarea).toHaveAttribute("rows", "2");
    });

    it("grows to 3 rows (max) with multiple line breaks", async () => {
      const user = userEvent.setup();
      render(<Textarea {...defaultProps} />);

      const textarea = screen.getByTestId("textarea-description");

      // Type text with multiple line breaks
      await user.type(textarea, "Line 1{Enter}Line 2{Enter}Line 3{Enter}Line 4");

      // Should cap at 3 rows
      expect(textarea).toHaveAttribute("rows", "3");
    });

    it("does not grow on long single-line text", async () => {
      const user = userEvent.setup();
      render(<Textarea {...defaultProps} />);

      const textarea = screen.getByTestId("textarea-description");

      // Type very long single line
      const longText =
        "This is a very long line of text that would normally wrap in most textareas but should not increase the row count";
      await user.type(textarea, longText);

      // Should still be 1 row
      expect(textarea).toHaveAttribute("rows", "1");
    });

    it("shrinks back down when line breaks are removed", async () => {
      const user = userEvent.setup();
      render(<Textarea {...defaultProps} />);

      const textarea = screen.getByTestId("textarea-description");

      // Type multiline text
      await user.type(textarea, "Line 1{Enter}Line 2{Enter}Line 3");
      expect(textarea).toHaveAttribute("rows", "3");

      // Clear and type single line
      await user.clear(textarea);
      await user.type(textarea, "Just one line");

      // Should be back to 1 row
      expect(textarea).toHaveAttribute("rows", "1");
    });
  });

  describe("Controlled vs Uncontrolled", () => {
    it("works as uncontrolled component with defaultValue", () => {
      render(<Textarea {...defaultProps} defaultValue="Initial text" />);

      const textarea = screen.getByTestId("textarea-description");
      expect(textarea).toHaveValue("Initial text");
    });

    it("works as controlled component", async () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <Textarea {...defaultProps} value="Controlled text" onChange={handleChange} />
      );

      const textarea = screen.getByTestId("textarea-description");
      expect(textarea).toHaveValue("Controlled text");

      // Type in textarea
      fireEvent.change(textarea, { target: { value: "New text" } });
      expect(handleChange).toHaveBeenCalled();

      // Value shouldn't change until parent updates it
      expect(textarea).toHaveValue("Controlled text");

      // Parent updates value
      rerender(<Textarea {...defaultProps} value="New text" onChange={handleChange} />);
      expect(textarea).toHaveValue("New text");
    });
  });

  describe("Validation", () => {
    it("shows validation message when provided", () => {
      const getValidationMessage = (value: string) => (value.length > 10 ? "Too long!" : undefined);

      render(
        <Textarea
          {...defaultProps}
          defaultValue="This is way too long"
          getValidationMessage={getValidationMessage}
        />
      );

      expect(screen.getByText("Too long!")).toBeInTheDocument();
    });

    it("does not show validation message when validation passes", () => {
      const getValidationMessage = (value: string) => (value.length > 10 ? "Too long!" : undefined);

      render(
        <Textarea
          {...defaultProps}
          defaultValue="Short"
          getValidationMessage={getValidationMessage}
        />
      );

      expect(screen.queryByText("Too long!")).not.toBeInTheDocument();
    });
  });

  describe("Disabled state", () => {
    it("disables textarea when isDisabled is true", () => {
      render(<Textarea {...defaultProps} isDisabled />);

      const textarea = screen.getByTestId("textarea-description");
      expect(textarea).toBeDisabled();
    });

    it("applies disabled styling when disabled", () => {
      render(<Textarea {...defaultProps} isDisabled />);

      const textarea = screen.getByTestId("textarea-description");
      expect(textarea).toHaveClass("disabled:bg-surface-secondary");
    });
  });

  describe("Accessibility", () => {
    it("associates label with textarea using htmlFor/id", () => {
      render(<Textarea {...defaultProps} />);

      const label = screen.getByText("Description");
      const textarea = screen.getByTestId("textarea-description");

      expect(label).toHaveAttribute("for", "description");
      expect(textarea).toHaveAttribute("id", "description");
    });

    it("sets required attribute when isRequired is true", () => {
      render(<Textarea {...defaultProps} isRequired />);

      const textarea = screen.getByTestId("textarea-description");
      expect(textarea).toHaveAttribute("required");
    });
  });

  describe("Edge cases", () => {
    it("handles empty string without errors", () => {
      render(<Textarea {...defaultProps} value="" onChange={vi.fn()} />);

      const textarea = screen.getByTestId("textarea-description");
      expect(textarea).toHaveValue("");
      expect(textarea).toHaveAttribute("rows", "1");
    });

    it("handles text with only line breaks", async () => {
      const user = userEvent.setup();
      render(<Textarea {...defaultProps} />);

      const textarea = screen.getByTestId("textarea-description");

      // Type only line breaks
      await user.type(textarea, "{Enter}{Enter}");

      // Should have 3 rows (empty + 2 line breaks)
      expect(textarea).toHaveAttribute("rows", "3");
    });

    it("maintains row count with mixed content", async () => {
      const user = userEvent.setup();
      render(<Textarea {...defaultProps} />);

      const textarea = screen.getByTestId("textarea-description");

      // Mix of text and line breaks
      await user.type(textarea, "Text{Enter}{Enter}More text{Enter}Final");

      // Should be 4 lines, but capped at 3
      expect(textarea).toHaveAttribute("rows", "3");
    });
  });
});
