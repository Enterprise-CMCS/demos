import React from "react";

import { BaseModal } from "components/modal/BaseModal";
import { vi } from "vitest";

import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

describe("BaseModal", () => {
  const defaultProps = {
    title: "Test Modal",
    onClose: vi.fn(),
    children: <div>Modal content</div>,
  };

  it("renders the title and children", () => {
    render(<BaseModal {...defaultProps} />);
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("renders and triggers the close button", () => {
    const onClose = vi.fn();
    render(<BaseModal {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByLabelText("Close modal");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders cancel confirmation dialog when showCancelConfirm is true", () => {
    const setShowCancelConfirm = vi.fn();
    render(
      <BaseModal
        {...defaultProps}
        showCancelConfirm={true}
        setShowCancelConfirm={setShowCancelConfirm}
      />
    );
    expect(
      screen.getByText("Are you sure you want to cancel?")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("No"));
    expect(setShowCancelConfirm).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByText("Yes"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders footer actions if provided", () => {
    render(
      <BaseModal
        {...defaultProps}
        actions={<button>Mock Action</button>}
      />
    );
    expect(screen.getByText("Mock Action")).toBeInTheDocument();
  });
});
