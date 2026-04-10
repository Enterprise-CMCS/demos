import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { ConfirmApproveDialog } from "./ConfirmApproveDialog";
import { WorkflowApplicationType } from "components/application";
import { DialogProvider } from "./DialogContext";

describe("ConfirmApproveDialog", () => {
  const setup = (applicationType: WorkflowApplicationType = "demonstration") => {
    const onConfirm = vi.fn();

    render(
      <DialogProvider>
        <ConfirmApproveDialog onConfirm={onConfirm} applicationType={applicationType} />
      </DialogProvider>
    );

    return { onConfirm };
  };

  it("renders dialog content", () => {
    setup();

    expect(screen.getByText("ARE YOU SURE?")).toBeInTheDocument();
    expect(
      screen.getByText(/final submission of this approved demonstration/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("button-ca-dialog-approve")).toBeInTheDocument();
  });

  it("calls onConfirm when submit button is clicked", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();

    await user.click(screen.getByTestId("button-ca-dialog-approve"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows correct application type in message", () => {
    setup("amendment");

    expect(screen.getByText(/final submission of this approved amendment/i)).toBeInTheDocument();
  });
});
