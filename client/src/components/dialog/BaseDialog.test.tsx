import React from "react";

import { BaseDialog } from "components/dialog/BaseDialog";
import { vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

const mockHideDialog = vi.fn();
vi.mock("./DialogContext", () => ({
  useDialog: () => ({
    hideDialog: mockHideDialog,
  }),
}));

describe("BaseDialog", () => {
  const defaultProps = {
    title: "Test Dialog",
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

  it("renders and triggers the close button", () => {
    render(<BaseDialog {...defaultProps} />);
    const closeBtn = screen.getByLabelText("Close dialog");
    fireEvent.click(closeBtn);
    expect(mockHideDialog).toHaveBeenCalledTimes(1);
  });

  it("renders cancel confirmation dialog when showCancelConfirm is true", () => {
    const setShowCancelConfirm = vi.fn();
    render(
      <BaseDialog
        {...defaultProps}
        showCancelConfirm={true}
        setShowCancelConfirm={setShowCancelConfirm}
      />
    );
    expect(screen.getByText("You will lose any unsaved changes in this view.")).toBeInTheDocument();
  });

  it("calls setShowCancelConfirm(false) when No is clicked", () => {
    const setShowCancelConfirm = vi.fn();
    render(
      <BaseDialog
        {...defaultProps}
        showCancelConfirm={true}
        setShowCancelConfirm={setShowCancelConfirm}
      />
    );
    const noButton = screen.getByTestId("button-cc-dialog-cancel");
    fireEvent.click(noButton);
    expect(setShowCancelConfirm).toHaveBeenCalledWith(false);
  });

  it("calls hideDialog when Yes is clicked in confirmation", () => {
    const setShowCancelConfirm = vi.fn();
    render(
      <BaseDialog
        {...defaultProps}
        showCancelConfirm={true}
        setShowCancelConfirm={setShowCancelConfirm}
      />
    );
    const yesButton = screen.getByTestId("button-cc-dialog-discard");
    fireEvent.click(yesButton);
    expect(mockHideDialog).toHaveBeenCalledTimes(1);
  });

  it("renders custom actions when provided", () => {
    const actions = <button>Custom Action</button>;
    render(<BaseDialog {...defaultProps} actions={actions} />);
    expect(screen.getByText("Custom Action")).toBeInTheDocument();
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

  it("calls setShowCancelConfirm(true) when close button is clicked and setShowCancelConfirm is provided", () => {
    const setShowCancelConfirm = vi.fn();
    render(
      <BaseDialog
        {...defaultProps}
        showCancelConfirm={true}
        setShowCancelConfirm={setShowCancelConfirm}
      />
    );
    const closeBtn = screen.getByLabelText("Close dialog");
    fireEvent.click(closeBtn);
    expect(setShowCancelConfirm).toHaveBeenCalledWith(true);
    expect(mockHideDialog).not.toHaveBeenCalled();
  });

  it("calls hideDialog directly when close button is clicked and setShowCancelConfirm is not provided", () => {
    render(<BaseDialog {...defaultProps} />);
    const closeBtn = screen.getByLabelText("Close dialog");
    fireEvent.click(closeBtn);
    expect(mockHideDialog).toHaveBeenCalledTimes(1);
  });

  it("closes confirmation dialog when clicking on backdrop", () => {
    const setShowCancelConfirm = vi.fn();
    render(
      <BaseDialog
        {...defaultProps}
        showCancelConfirm={true}
        setShowCancelConfirm={setShowCancelConfirm}
      />
    );
    const confirmDialog = document.querySelectorAll("dialog")[1]; // Second dialog is confirmation
    fireEvent.click(confirmDialog);
    expect(setShowCancelConfirm).toHaveBeenCalledWith(false);
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

  it("does not call setShowCancelConfirm when clicking inside confirmation dialog content", () => {
    const setShowCancelConfirm = vi.fn();
    render(
      <BaseDialog
        {...defaultProps}
        showCancelConfirm={true}
        setShowCancelConfirm={setShowCancelConfirm}
      />
    );
    const confirmText = screen.getByText("You will lose any unsaved changes in this view.");
    fireEvent.click(confirmText);
    expect(setShowCancelConfirm).not.toHaveBeenCalled();
  });
});
