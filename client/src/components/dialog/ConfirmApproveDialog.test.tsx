import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeAll } from "vitest";

import { ConfirmApproveDialog } from "./ConfirmApproveDialog";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("ConfirmApproveDialog", () => {
  const setup = (isOpen = true) => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmApproveDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    return { onClose, onConfirm };
  };

  it("renders dialog content", () => {
    setup(true);

    expect(screen.getByText("ARE YOU SURE?")).toBeInTheDocument();
    expect(
      screen.getByText(/final submission of this approved demonstration/i)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("button-ca-dialog-approve")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("button-ca-dialog-cancel")
    ).toBeInTheDocument();
  });

  it("calls onClose when close (×) button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = setup(true);

    await user.click(screen.getByTestId("button-ca-dialog-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = setup(true);

    await user.click(screen.getByTestId("button-ca-dialog-cancel"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when submit button is clicked", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup(true);

    await user.click(screen.getByTestId("button-ca-dialog-approve"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls showModal when isOpen is true", () => {
    setup(true);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it("calls close when isOpen is false", () => {
    setup(false);
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });
});
