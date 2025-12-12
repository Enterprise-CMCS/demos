import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SubmitButton } from "./SubmitButton";

describe("SubmitButton", () => {
  it("renders with default props", () => {
    render(<SubmitButton />);

    const button = screen.getByRole("button", { name: "Submit" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Submit");
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("renders with custom text", () => {
    render(<SubmitButton text="Save Changes" />);

    const button = screen.getByRole("button", { name: "Save Changes" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Save Changes");
  });

  it("renders with custom name", () => {
    render(<SubmitButton name="custom-submit-button" />);

    const button = screen.getByTestId("custom-submit-button");
    expect(button).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<SubmitButton text="Submit" label="Custom Label" />);

    const button = screen.getByRole("button", { name: "Custom Label" });
    expect(button).toBeInTheDocument();
  });

  it("associates with form when form prop is provided", () => {
    render(<SubmitButton form="my-form" />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("form", "my-form");
  });

  it("is disabled when disabled prop is true", () => {
    render(<SubmitButton disabled={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("shows spinner and submitting text when isSubmitting is true", () => {
    render(<SubmitButton isSubmitting={true} submittingText="Saving..." />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Saving...");

    const spinner = screen.getByRole("img", { name: "Loading" });
    expect(spinner).toBeInTheDocument();
  });

  it("uses default submitting text when not provided", () => {
    render(<SubmitButton isSubmitting={true} />);

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Loading");
  });

  it("is disabled when isSubmitting is true", () => {
    render(<SubmitButton isSubmitting={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("calls onClick handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SubmitButton onClick={handleClick} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SubmitButton onClick={handleClick} disabled={true} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("does not call onClick when isSubmitting", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SubmitButton onClick={handleClick} isSubmitting={true} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("switches text when isSubmitting changes", () => {
    const { rerender } = render(<SubmitButton text="Submit" submittingText="Submitting..." />);

    let button = screen.getByRole("button");
    expect(button).toHaveTextContent("Submit");
    expect(button).not.toBeDisabled();

    rerender(<SubmitButton text="Submit" submittingText="Submitting..." isSubmitting={true} />);

    button = screen.getByRole("button");
    expect(button).toHaveTextContent("Submitting...");
    expect(button).toBeDisabled();
  });

  it("hides spinner when isSubmitting is false", () => {
    render(<SubmitButton isSubmitting={false} />);

    const spinner = screen.queryByRole("img", { name: "Loading" });
    expect(spinner).not.toBeInTheDocument();
  });
});
