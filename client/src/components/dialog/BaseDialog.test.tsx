import React from "react";

import { BaseDialog } from "components/dialog/BaseDialog";
import { vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

describe("BaseDialog", () => {
  const defaultProps = {
    title: "Test Dialog",
    onClose: vi.fn(),
    children: <div>Dialog content</div>,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the title and children when open", () => {
    render(<BaseDialog {...defaultProps} />);
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog content")).toBeInTheDocument();
  });

  it("renders and triggers the close button when hasChanges is false", () => {
    const onClose = vi.fn();
    render(<BaseDialog {...defaultProps} onClose={onClose} dialogHasChanges={false} />);
    const closeBtn = screen.getByLabelText("Close dialog");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows cancel confirmation dialog when close button clicked and hasChanges is true (default)", () => {
    const onClose = vi.fn();
    render(<BaseDialog {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByLabelText("Close dialog");
    fireEvent.click(closeBtn);
    expect(screen.getByText("You will lose any unsaved changes in this view.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Discard Changes is clicked in confirmation", () => {
    const onClose = vi.fn();
    render(<BaseDialog {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByLabelText("Close dialog");
    fireEvent.click(closeBtn);
    const discardButton = screen.getByTestId("button-cc-dialog-discard");
    fireEvent.click(discardButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes confirmation dialog when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(<BaseDialog {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByLabelText("Close dialog");
    fireEvent.click(closeBtn);
    const cancelButton = screen.getByTestId("button-cc-dialog-cancel");
    fireEvent.click(cancelButton);
    expect(
      screen.queryByText("You will lose any unsaved changes in this view.")
    ).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders action button and Cancel button when actionButton is provided", () => {
    const actionButton = <button>Custom Action</button>;
    render(<BaseDialog {...defaultProps} actionButton={actionButton} />);
    expect(screen.getByText("Custom Action")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("does not render action buttons when actionButton is not provided", () => {
    render(<BaseDialog {...defaultProps} />);
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  it("hides header when hideHeader is true", () => {
    render(<BaseDialog {...defaultProps} hideHeader={true} />);
    expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Close dialog")).not.toBeInTheDocument();
  });

  it("applies custom max width class", () => {
    render(<BaseDialog {...defaultProps} maxWidthClass="max-w-[500px]" />);
    const dialog = document.querySelector("dialog");
    expect(dialog).toHaveClass("max-w-[500px]");
  });

  it("Cancel button shows confirmation dialog when hasChanges is true", () => {
    const onClose = vi.fn();
    const actionButton = <button>Save</button>;
    render(
      <BaseDialog
        {...defaultProps}
        onClose={onClose}
        actionButton={actionButton}
        dialogHasChanges={true}
      />
    );
    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);
    expect(screen.getByText("You will lose any unsaved changes in this view.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Cancel button calls onClose directly when hasChanges is false", () => {
    const onClose = vi.fn();
    const actionButton = <button>Save</button>;
    render(
      <BaseDialog
        {...defaultProps}
        onClose={onClose}
        actionButton={actionButton}
        dialogHasChanges={false}
      />
    );
    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes confirmation dialog when clicking on backdrop", () => {
    const onClose = vi.fn();
    render(<BaseDialog {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByLabelText("Close dialog");
    fireEvent.click(closeBtn);
    const confirmDialog = document.querySelectorAll("dialog")[1]; // Second dialog is confirmation
    fireEvent.click(confirmDialog);
    expect(
      screen.queryByText("You will lose any unsaved changes in this view.")
    ).not.toBeInTheDocument();
  });

  it("prevents default behavior and keeps dialog open on close event", () => {
    render(<BaseDialog {...defaultProps} />);
    const dialog = document.querySelector("dialog");
    const closeEvent = new Event("close", { cancelable: true });
    const preventDefaultSpy = vi.spyOn(closeEvent, "preventDefault");

    dialog?.dispatchEvent(closeEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("prevents escape key default behavior when dialog is open", () => {
    render(<BaseDialog {...defaultProps} />);
    const escapeEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(escapeEvent, "preventDefault");
    const stopPropagationSpy = vi.spyOn(escapeEvent, "stopPropagation");

    document.dispatchEvent(escapeEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it("does not close confirmation dialog when clicking inside confirmation dialog content", () => {
    const onClose = vi.fn();
    render(<BaseDialog {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByLabelText("Close dialog");
    fireEvent.click(closeBtn);
    const confirmText = screen.getByText("You will lose any unsaved changes in this view.");
    fireEvent.click(confirmText);
    expect(screen.getByText("You will lose any unsaved changes in this view.")).toBeInTheDocument();
  });
});
