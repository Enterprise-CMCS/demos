import React from "react";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  Input,
  InputProps,
} from "./Input";

describe("Input component", () => {
  const requiredProps: InputProps = {
    type: "text",
    name: "test-input",
    label: "Test Label",
  };

  it("renders label and input", () => {
    render(<Input {...requiredProps} />);
    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders required asterisk when isRequired is true", () => {
    render(<Input {...requiredProps} isRequired />);
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByLabelText("*Test Label")).toBeRequired();
  });

  it("does not render required asterisk when isRequired is false", () => {
    render(<Input {...requiredProps} />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    render(<Input {...requiredProps} placeholder="Enter value" />);
    expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
  });

  it("renders with defaultValue", () => {
    const Component = () => {
      const [value, setValue] = React.useState("default");
      return <Input {...requiredProps} value={value} onChange={(e) => setValue(e.target.value)} />;
    };
    render(<Component />);
    expect(screen.getByDisplayValue("default")).toBeInTheDocument();
  });

  it("renders as disabled when isDisabled is true", () => {
    render(<Input {...requiredProps} isDisabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("calls getValidationMessage and displays validation message", () => {
    const getValidationMessage = vi.fn((value: string) =>
      value.length < 3 ? "Too short" : ""
    );
    render(
      <Input
        {...requiredProps}
        getValidationMessage={getValidationMessage}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "ab" } });
    expect(getValidationMessage).toHaveBeenCalledWith("ab");
    expect(screen.getByText("Too short")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "abcd" } });
    expect(screen.queryByText("Too short")).not.toBeInTheDocument();
  });

  it("updates value on change", () => {
    render(<Input {...requiredProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new value" } });
    expect(input).toHaveValue("new value");
  });

  it("applies correct classes for filled and empty states", () => {
    render(<Input {...requiredProps} />);
    const input = screen.getByRole("textbox");
    // Initially empty
    expect(input.className).toContain("text-text-placeholder");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input.className).toContain("text-text-filled");
  });

  it("applies correct classes for validation error", () => {
    const getValidationMessage = () => "Error!";
    render(
      <Input
        {...requiredProps}
        getValidationMessage={getValidationMessage}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input.className).toContain("border-border-warn");
    expect(screen.getByText("Error!")).toBeInTheDocument();
  });

  it("applies correct classes for valid state", () => {
    const getValidationMessage = () => "";
    render(
      <Input
        {...requiredProps}
        getValidationMessage={getValidationMessage}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input.className).toContain("border-border-fields");
    expect(screen.queryByText("Error!")).not.toBeInTheDocument();
  });

  it("does not crash if getValidationMessage is not provided", () => {
    render(<Input {...requiredProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input).toHaveValue("abc");
  });

  it("handles empty defaultValue", () => {
    render(<Input {...requiredProps} defaultValue="" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("renders input with correct type", () => {
    render(<Input {...requiredProps} type="password" />);
    expect(screen.getByLabelText("Test Label")).toHaveAttribute("type", "password");
  });
});
