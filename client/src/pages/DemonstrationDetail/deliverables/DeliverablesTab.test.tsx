import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DialogProvider } from "components/dialog/DialogContext";
import { ADD_DELIVERABLE_SLOT_DIALOG_TITLE } from "components/dialog/deliverable";
import { ADD_DELIVERABLE_SLOT_BUTTON_NAME, DeliverablesTab } from "./DeliverablesTab";
import { TestProvider } from "test-utils/TestProvider";
import { deliverableMocks } from "mock-data/deliverableMocks";
import { Route, Routes } from "react-router-dom";
import { BACK_TO_DELIVERABLES_BUTTON_NAME } from "pages/deliverables/sections/DeliverableInfoFields";

const MOCK_PARENT_DEMONSTRATION = {
  id: "demo-1",
  demonstrationTypes: [],
  effectiveDate: new Date("2026-01-01"),
  expirationDate: new Date("2026-12-31"),
};

describe("DeliverablesTab", () => {
  it("renders Deliverables header and required columns", async () => {
    render(
      <TestProvider mocks={deliverableMocks}>
        <DialogProvider>
          <DeliverablesTab parentDemonstration={MOCK_PARENT_DEMONSTRATION} />
        </DialogProvider>
      </TestProvider>
    );

    expect(screen.getByRole("heading", { name: "Deliverables" })).toBeInTheDocument();
    expect(await screen.findByRole("columnheader", { name: /Deliverable Type/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Deliverable Name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /CMS Owner/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Due Date/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Status/i })).toBeInTheDocument();
  });

  it("opens the add deliverable slot dialog when the button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <TestProvider mocks={deliverableMocks}>
        <DialogProvider>
          <DeliverablesTab parentDemonstration={MOCK_PARENT_DEMONSTRATION} />
        </DialogProvider>
      </TestProvider>
    );

    await user.click(screen.getByTestId(ADD_DELIVERABLE_SLOT_BUTTON_NAME));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(ADD_DELIVERABLE_SLOT_DIALOG_TITLE);
  });

  it("shows empty state when no demonstration deliverables are available", async () => {
    render(
      <TestProvider mocks={deliverableMocks}>
        <DialogProvider>
          <DeliverablesTab
            parentDemonstration={{ ...MOCK_PARENT_DEMONSTRATION, id: "demo-does-not-exist" }}
          />
        </DialogProvider>
      </TestProvider>
    );

    expect(await screen.findByText("You have no assigned Deliverables at this time")).toBeInTheDocument();
  });

  it("replaces the table with detail content inside deliverables tab when view is clicked", async () => {
    const user = userEvent.setup();

    render(
      <TestProvider mocks={deliverableMocks} routerEntries={["/demonstrations/1"]}>
        <DialogProvider>
          <Routes>
            <Route
              path="/demonstrations/:id"
              element={<DeliverablesTab parentDemonstration={{ ...MOCK_PARENT_DEMONSTRATION, id: "1" }} />}
            />
            <Route
              path="/deliverables/:deliverableId"
              element={<DeliverablesTab parentDemonstration={{ ...MOCK_PARENT_DEMONSTRATION, id: "1" }} />}
            />
          </Routes>
        </DialogProvider>
      </TestProvider>
    );

    await user.click(await screen.findByTestId("view-deliverable-1"));
    expect(await screen.findByText("Mock Deliverable 1")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Deliverable Type/i })).not.toBeInTheDocument();

    await user.click(screen.getByTestId(BACK_TO_DELIVERABLES_BUTTON_NAME));
    expect(await screen.findByRole("columnheader", { name: /Deliverable Type/i })).toBeInTheDocument();
  });
});
