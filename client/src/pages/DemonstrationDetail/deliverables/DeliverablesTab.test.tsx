import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { DialogProvider } from "components/dialog/DialogContext";
import { ADD_DELIVERABLE_SLOT_DIALOG_TITLE } from "components/dialog/deliverable";
import { DeliverablesTab } from "./DeliverablesTab";

describe("DeliverablesTab", () => {
  it("opens the add deliverable slot dialog when the button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <DeliverablesTab />
      </DialogProvider>
    );

    await user.click(screen.getByTestId("button-add-deliverable-slot"));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(ADD_DELIVERABLE_SLOT_DIALOG_TITLE);
  });
});
