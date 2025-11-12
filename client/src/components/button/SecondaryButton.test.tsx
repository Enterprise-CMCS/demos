import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { SecondaryButton } from "./SecondaryButton";
import { EditIcon } from "components/icons";

describe("SecondaryButton", () => {
  const defaultProps = {
    name: "test-button",
    onClick: vi.fn(),
  };

  it("renders button with text content", () => {
    render(<SecondaryButton {...defaultProps}>Test Button</SecondaryButton>);

    expect(screen.getByTestId("test-button")).toBeInTheDocument();
    expect(screen.getByTestId("test-button")).toHaveTextContent("Test Button");
  });

  it("standardizes icon sizes when passed as children", () => {
    render(
      <SecondaryButton name="test-button" onClick={() => {}}>
        Edit Details
        <EditIcon className="w-2 h-2" />
      </SecondaryButton>
    );

    const button = screen.getByRole("button", { name: "test-button" });
    const icon = button.querySelector("svg");

    expect(button).toBeInTheDocument();
    expect(icon).toHaveClass("w-[20px]");
    expect(icon).toHaveClass("h-[20px]");
    expect(button).toHaveTextContent("Edit Details");
  });

  it("works without icons", () => {
    render(
      <SecondaryButton name="test-button" onClick={() => {}}>
        Cancel
      </SecondaryButton>
    );

    const button = screen.getByRole("button", { name: "test-button" });

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Cancel");
    expect(button.querySelector("svg")).toBeNull();
  });

  it("handles number children correctly (pagination buttons)", () => {
    render(
      <SecondaryButton name="test-button" onClick={() => {}}>
        {2}
      </SecondaryButton>
    );

    const button = screen.getByRole("button", { name: "test-button" });

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("2");
    expect(button.querySelector("svg")).toBeNull();
  });
});
