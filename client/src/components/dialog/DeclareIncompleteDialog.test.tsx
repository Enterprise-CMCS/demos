import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeclareIncompleteDialog } from "./DeclareIncompleteDialog";

const mockOnClose = vi.fn();
const mockOnConfirm = vi.fn();

function setup(props = {}) {
  return render(
    <DeclareIncompleteDialog onClose={mockOnClose} onConfirm={mockOnConfirm} {...props} />
  );
}

describe("DeclareIncompleteDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog title and content", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Declare Incomplete" })).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to declare this application process/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/On-Hold/)).toBeInTheDocument();
  });

  it("renders reason select and disables confirm button initially", () => {
    setup();
    expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole("button", { name: /declare-incomplete-confirm/i });
    expect(confirmBtn).toBeDisabled();
  });

  it("enables confirm button when a reason is selected", async () => {
    setup();
    const reasonSelect = screen.getByLabelText(/Reason/i);
    await userEvent.selectOptions(reasonSelect, "missing-documentation");
    const confirmBtn = screen.getByRole("button", { name: /declare-incomplete-confirm/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it("shows 'Other' textbox when 'Other' reason is selected", async () => {
    setup();
    const reasonSelect = screen.getByLabelText(/Reason/i);
    await userEvent.selectOptions(reasonSelect, "other");
    expect(screen.getByLabelText(/Other/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole("button", { name: /declare-incomplete-confirm/i });
    expect(confirmBtn).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Other/i), "Some explanation");
    expect(confirmBtn).not.toBeDisabled();
  });

  it("calls onConfirm and onClose with correct values when valid reason is selected", async () => {
    setup();
    const reasonSelect = screen.getByLabelText(/Reason/i);
    await userEvent.selectOptions(reasonSelect, "pending-clarification");
    const confirmBtn = screen.getByRole("button", { name: /declare-incomplete-confirm/i });
    await userEvent.click(confirmBtn);
    expect(mockOnConfirm).toHaveBeenCalledWith({
      reason: "pending-clarification",
      otherText: undefined,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onConfirm and onClose with correct values when 'Other' is selected and explanation is provided", async () => {
    setup();
    const reasonSelect = screen.getByLabelText(/Reason/i);
    await userEvent.selectOptions(reasonSelect, "other");
    await userEvent.type(screen.getByLabelText(/Other/i), "Extra info");
    const confirmBtn = screen.getByRole("button", { name: /declare-incomplete-confirm/i });
    await userEvent.click(confirmBtn);
    expect(mockOnConfirm).toHaveBeenCalledWith({ reason: "other", otherText: "Extra info" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when cancel button is clicked", async () => {
    setup();
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("has a close dialog button", () => {
    setup();
    expect(screen.getByLabelText("Close dialog")).toBeInTheDocument();
  });
});
