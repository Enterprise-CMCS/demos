import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeAll } from "vitest";

import { ConfirmApproveDialog } from "./ConfirmApproveDialog";
import { WorkflowApplicationType } from "components/application";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("ConfirmApproveDialog", () => {
  const setup = (applicationType: WorkflowApplicationType = "demonstration") => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmApproveDialog
        onClose={onClose}
        onConfirm={onConfirm}
        applicationType={applicationType}
      />
    );

    return { onClose, onConfirm };
  };

  it("renders dialog content", () => {
    setup();

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
    const { onClose } = setup();

    await user.click(screen.getByTestId("button-ca-dialog-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.click(screen.getByTestId("button-ca-dialog-cancel"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when submit button is clicked", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();

    await user.click(screen.getByTestId("button-ca-dialog-approve"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows correct application type in message", () => {
    setup("amendment");

    expect(
      screen.getByText(/final submission of this approved amendment/i)
    ).toBeInTheDocument();
  });
});
