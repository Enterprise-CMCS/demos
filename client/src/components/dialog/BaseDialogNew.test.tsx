import React from "react";

import { BaseDialogNew } from "components/dialog/BaseDialogNew";
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

  it("renders the title and children", () => {
    render(<BaseDialogNew {...defaultProps} />);
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog content")).toBeInTheDocument();
  });

  it("renders and triggers the close button", () => {
    const onClose = vi.fn();
    render(<BaseDialogNew {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByLabelText("Close dialog");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders cancel confirmation dialog when showCancelConfirm is true", () => {
    const setShowCancelConfirm = vi.fn();
    render(
      <BaseDialogNew
        {...defaultProps}
        showCancelConfirm={true}
        setShowCancelConfirm={setShowCancelConfirm}
      />
    );
    expect(
      screen.getByText(
        "Are you sure you want to cancel? Changes you have made so far will not be saved."
      )
    ).toBeInTheDocument();
  });

  it("calls setShowCancelConfirm(false) when No is clicked", () => {
    const setShowCancelConfirm = vi.fn();
    render(
      <BaseDialogNew
        {...defaultProps}
        showCancelConfirm={true}
        setShowCancelConfirm={setShowCancelConfirm}
      />
    );
    const noButton = screen.getByText("No");
    fireEvent.click(noButton);
    expect(setShowCancelConfirm).toHaveBeenCalledWith(false);
  });

  it("calls onClose when Yes is clicked in confirmation", () => {
    const onClose = vi.fn();
    const setShowCancelConfirm = vi.fn();
    render(
      <BaseDialogNew
        {...defaultProps}
        onClose={onClose}
        showCancelConfirm={true}
        setShowCancelConfirm={setShowCancelConfirm}
      />
    );
    const yesButton = screen.getByText("Yes");
    fireEvent.click(yesButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders custom actions when provided", () => {
    const actions = <button>Custom Action</button>;
    render(<BaseDialogNew {...defaultProps} actions={actions} />);
    expect(screen.getByText("Custom Action")).toBeInTheDocument();
  });

  it("hides header when hideHeader is true", () => {
    render(<BaseDialogNew {...defaultProps} hideHeader={true} />);
    expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Close dialog")).not.toBeInTheDocument();
  });

  it("applies custom max width class", () => {
    render(<BaseDialogNew {...defaultProps} maxWidthClass="max-w-[500px]" />);
    const dialog = document.querySelector("dialog");
    expect(dialog).toHaveClass("max-w-[500px]");
  });
});
