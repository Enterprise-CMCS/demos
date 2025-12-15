import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BaseActionButton } from "./BaseActionButton";

describe("SubmitButton", () => {
  it("renders with default props", () => {
    render(<BaseActionButton />);

    const button = screen.getByRole("button", { name: "Submit" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Submit");
    expect(button).not.toBeDisabled();
  });

  it("renders with custom text", () => {
    render(<BaseActionButton text="Save Changes" />);

    const button = screen.getByRole("button", { name: "Save Changes" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Save Changes");
  });

  it("renders with custom name", () => {
    render(<BaseActionButton name="custom-submit-button" />);

    const button = screen.getByTestId("custom-submit-button");
    expect(button).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<BaseActionButton text="Submit" label="Custom Label" />);

    const button = screen.getByRole("button", { name: "Custom Label" });
    expect(button).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<BaseActionButton disabled={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("shows spinner and submitting text when isSubmitting is true", () => {
    render(<BaseActionButton isSubmitting={true} submittingText="Saving..." />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Saving...");

    const spinner = screen.getByRole("img", { name: "Loading" });
    expect(spinner).toBeInTheDocument();
  });

  it("uses default submitting text when not provided", () => {
    render(<BaseActionButton isSubmitting={true} />);

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Loading");
  });

  it("is disabled when isSubmitting is true", () => {
    render(<BaseActionButton isSubmitting={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("calls onClick handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<BaseActionButton onClick={handleClick} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<BaseActionButton onClick={handleClick} disabled={true} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("does not call onClick when isSubmitting", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<BaseActionButton onClick={handleClick} isSubmitting={true} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("switches text when isSubmitting changes", () => {
    const { rerender } = render(<BaseActionButton text="Submit" submittingText="Submitting..." />);

    let button = screen.getByRole("button");
    expect(button).toHaveTextContent("Submit");
    expect(button).not.toBeDisabled();

    rerender(<BaseActionButton text="Submit" submittingText="Submitting..." isSubmitting={true} />);

    button = screen.getByRole("button");
    expect(button).toHaveTextContent("Submitting...");
    expect(button).toBeDisabled();
  });

  it("hides spinner when isSubmitting is false", () => {
    render(<BaseActionButton isSubmitting={false} />);

    const spinner = screen.queryByRole("img", { name: "Loading" });
    expect(spinner).not.toBeInTheDocument();
  });
});
