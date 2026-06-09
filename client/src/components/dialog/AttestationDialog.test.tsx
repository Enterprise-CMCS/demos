import "@testing-library/jest-dom";

import React from "react";

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { AttestationDialog } from "./AttestationDialog";

const renderDialog = (overrides?: { onConfirm?: () => void; onCancel?: () => void }) => {
  const onConfirm = overrides?.onConfirm ?? vi.fn();
  const onCancel = overrides?.onCancel ?? vi.fn();
  render(<AttestationDialog onConfirm={onConfirm} onCancel={onCancel} />);
  return { onConfirm, onCancel };
};

describe("AttestationDialog", () => {
  it("renders the attestation heading, statement, and acknowledgement checkbox", () => {
    renderDialog();

    expect(screen.getByRole("heading", { name: "Attestation Required" })).toBeInTheDocument();
    expect(
      screen.getByText(/I attest the information included with this submission is true and accurate/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("attestation-acknowledge")).toBeInTheDocument();
  });

  it("disables Confirm until the acknowledgement is checked", () => {
    renderDialog();

    const confirmButton = screen.getByTestId("button-attestation-confirm");
    expect(confirmButton).toBeDisabled();

    fireEvent.click(screen.getByTestId("attestation-acknowledge"));

    expect(confirmButton).toBeEnabled();
  });

  it("calls onConfirm once the acknowledgement is checked and Confirm is clicked", () => {
    const { onConfirm } = renderDialog();

    fireEvent.click(screen.getByTestId("attestation-acknowledge"));
    fireEvent.click(screen.getByTestId("button-attestation-confirm"));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("does not call onConfirm when Confirm is clicked without acknowledgement", () => {
    const { onConfirm } = renderDialog();

    fireEvent.click(screen.getByTestId("button-attestation-confirm"));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onCancel when the dialog is cancelled", () => {
    const { onCancel } = renderDialog();

    fireEvent.click(screen.getByTestId("button-dialog-cancel"));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
