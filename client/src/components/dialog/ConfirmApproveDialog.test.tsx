import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
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

  it("shows finalize approval message for demonstration application type", () => {
    setup("demonstration");

    expect(
      screen.getByText(/This will finalize the approval process and move the demonstration to the deliverables phase./i)
    ).toBeInTheDocument();
  });

  it("does not show finalize approval message for non-demonstration application type", () => {
    setup("extension");

    expect(
      screen.queryByText(/This will finalize the approval process and move the demonstration to the deliverables phase./i)
    ).not.toBeInTheDocument();
  });

  it("should show the correct button text based on application type", () => {
    setup("amendment");
    expect(screen.getByTestId("button-ca-dialog-approve")).toHaveTextContent("Submit Approved Amendment");
    cleanup();

    setup("extension");
    expect(screen.getByTestId("button-ca-dialog-approve")).toHaveTextContent("Submit Approved Extension");
    cleanup();

    setup("demonstration");
    expect(screen.getByTestId("button-ca-dialog-approve")).toHaveTextContent("Submit Approved Demonstration");
    cleanup();
  });
});
