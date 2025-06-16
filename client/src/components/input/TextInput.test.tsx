import React from "react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import { TextInput } from "./TextInput";

describe("TextInput", () => {
  it("renders with required props", () => {
    render(<TextInput name="username" label="Username" />);
    const input = screen.getByLabelText("Username");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("name", "username");
  });

  it("passes isRequired, isDisabled, isSelected, placeholder, and defaultValue props", () => {
    const { getByLabelText } = render(
      <TextInput
        name="email"
        label="Email"
        isRequired
        isDisabled
        placeholder="Enter email"
        value="test@example.com"
      />
    );

    const input = getByLabelText(/email/i) as HTMLInputElement;
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("placeholder", "Enter email");
    expect(input).toHaveValue("test@example.com");
  });


  it("calls getValidationMessage if provided", () => {
    const getValidationMessage = vi.fn();
    render(
      <TextInput
        name="test"
        label="Test"
        getValidationMessage={getValidationMessage}
      />
    );
    expect(getValidationMessage).toHaveBeenCalledTimes(1);
    expect(getValidationMessage).toHaveBeenCalledWith("");
  });
});
