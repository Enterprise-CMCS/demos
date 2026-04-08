import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DialogProvider } from "components/dialog/DialogContext";
import { ADD_DELIVERABLE_SLOT_DIALOG_TITLE } from "components/dialog/deliverable";
import { ADD_DELIVERABLE_SLOT_BUTTON_NAME, DeliverablesTab } from "./DeliverablesTab";
import { TestProvider } from "test-utils/TestProvider";
import { MOCK_DELIVERABLES } from "mock-data/deliverableMocks";

const MOCK_PARENT_DEMONSTRATION = {
  demonstrationTypes: [],
  effectiveDate: new Date("2026-01-01"),
  expirationDate: new Date("2026-12-31"),
};

describe("DeliverablesTab", () => {
  it("renders Deliverables Management header and required columns", () => {
    render(
      <TestProvider>
        <DialogProvider>
          <DeliverablesTab
            parentDemonstration={MOCK_PARENT_DEMONSTRATION}
            deliverables={MOCK_DELIVERABLES.slice(0, 1)}
          />
        </DialogProvider>
      </TestProvider>
    );

    expect(screen.getByRole("heading", { name: "Deliverables Management" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Deliverable Type/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Deliverable Name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /CMS Owner/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Due Date/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Submission Date/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Status/i })).toBeInTheDocument();
  });

  it("opens the add deliverable slot dialog when the button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <TestProvider>
        <DialogProvider>
          <DeliverablesTab parentDemonstration={MOCK_PARENT_DEMONSTRATION} deliverables={[]} />
        </DialogProvider>
      </TestProvider>
    );

    await user.click(screen.getByTestId(ADD_DELIVERABLE_SLOT_BUTTON_NAME));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(ADD_DELIVERABLE_SLOT_DIALOG_TITLE);
  });

  it("shows empty state when no demonstration deliverables are available", () => {
    render(
      <TestProvider>
        <DialogProvider>
          <DeliverablesTab parentDemonstration={MOCK_PARENT_DEMONSTRATION} deliverables={[]} />
        </DialogProvider>
      </TestProvider>
    );

    expect(
      screen.getByText("You have no assigned Deliverables at this time")
    ).toBeInTheDocument();
  });
});
