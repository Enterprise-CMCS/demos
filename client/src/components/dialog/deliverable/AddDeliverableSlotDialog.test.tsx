import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeAll } from "vitest";

import {
  ADD_DELIVERABLE_SLOT_DIALOG_TITLE,
  AddDeliverableSlotDialog,
} from "components/dialog/deliverable";

describe("AddDeliverableSlotDialog", () => {
  const setup = () => {
    const onClose = vi.fn();

    render(<AddDeliverableSlotDialog onClose={onClose} />);

    return { onClose };
  };

  it("renders with the correct title", () => {
    setup();

    expect(screen.getByText(ADD_DELIVERABLE_SLOT_DIALOG_TITLE)).toBeInTheDocument();
  });

  it("renders the confirm button", () => {
    setup();

    expect(screen.getByTestId("button-add-deliverable-slot-confirm")).toBeInTheDocument();
  });

  it("calls onClose when the cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.click(screen.getByTestId("button-dialog-cancel"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
