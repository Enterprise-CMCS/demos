import React from "react";

import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmationToast } from "./ConfirmationToast";

describe("ConfirmationToast", () => {
  const defaultProps = {
    message: "Are you sure you want to continue?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the message and default button text", () => {
    render(<ConfirmationToast {...defaultProps} />);

    expect(screen.getByText("Are you sure you want to continue?")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("renders custom button text when provided", () => {
    render(<ConfirmationToast {...defaultProps} confirmText="Delete" cancelText="Keep" />);

    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Keep")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<ConfirmationToast {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByRole("button", { name: "confirmation-confirm" });
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ConfirmationToast {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: "confirmation-cancel" });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when clicking on backdrop", () => {
    const onCancel = vi.fn();

    render(<ConfirmationToast {...defaultProps} onCancel={onCancel} />);

    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onCancel when clicking on dialog content", () => {
    const onCancel = vi.fn();

    render(<ConfirmationToast {...defaultProps} onCancel={onCancel} />);

    const message = screen.getByText("Are you sure you want to continue?");
    fireEvent.click(message);

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("has correct button names for identification", () => {
    render(<ConfirmationToast {...defaultProps} />);

    expect(screen.getByRole("button", { name: "confirmation-confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "confirmation-cancel" })).toBeInTheDocument();
  });

  it("applies correct CSS classes", () => {
    render(<ConfirmationToast {...defaultProps} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass(
      "bg-white",
      "border",
      "border-gray-300",
      "rounded",
      "p-2",
      "w-[400px]",
      "shadow-md",
      "text-center",
      "backdrop:bg-black/40"
    );
  });
});
