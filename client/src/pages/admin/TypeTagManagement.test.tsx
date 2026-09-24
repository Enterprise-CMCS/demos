import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Route, Routes } from "react-router-dom";
import { TestProvider } from "test-utils/TestProvider";
import { MOCK_DEMONSTRATION_TYPE_USAGE } from "mock-data/demonstrationTypeUsageMocks";
import { AdminHeader } from "./AdminHeader";
import { TypeTagManagement, DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME } from "./TypeTagManagement";
import { DialogProvider } from "components/dialog/DialogContext";
import { RECORD_COUNT_TEST_ID } from "components/table/tables/TypeTagAssociatedRecordsTable";

const FIRST_TYPE_TAG_NAME = MOCK_DEMONSTRATION_TYPE_USAGE[0].demonstrationTypeName;
const PREVIOUS_PAGE_TEXT = "Demonstrations list";

const setup = (routerEntry = "/admin") =>
  render(
    <TestProvider routerEntries={[routerEntry]}>
      <DialogProvider>
        <TypeTagManagement />
      </DialogProvider>
    </TestProvider>
  );

describe("TypeTagManagement", () => {
  it("displays the type/tag management pane", async () => {
    setup();

    expect(screen.getByTestId(DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME)).toBeInTheDocument();
  });

  it("displays the type/tag list table with data", async () => {
    setup();

    expect(screen.getByRole("table")).toBeInTheDocument();
    // Verify the first type/tag is visible in a row
    expect(screen.getByRole("row", { name: new RegExp(FIRST_TYPE_TAG_NAME) })).toBeInTheDocument();
  });

  it("opens the associated records view when View button is clicked", async () => {
    const user = userEvent.setup();
    setup();

    const firstTypeTagRow = screen.getByRole("row", { name: new RegExp(FIRST_TYPE_TAG_NAME) });
    const viewButton = within(firstTypeTagRow).getByRole("button", { name: /View/i });

    await user.click(viewButton);

    expect(await screen.findByTestId(RECORD_COUNT_TEST_ID)).toBeInTheDocument();
    expect(screen.getByText("Type/Tag File View")).toBeInTheDocument();
  });

  it("returns to the type/tag list from the back button", async () => {
    const user = userEvent.setup();
    setup("/admin");

    const firstTypeTagRow = screen.getByRole("row", { name: new RegExp(FIRST_TYPE_TAG_NAME) });
    const viewButton = within(firstTypeTagRow).getByRole("button", { name: /View/i });

    await user.click(viewButton);
    await screen.findByText("Type/Tag File View");

    const backButton = screen.getByRole("button", { name: /Type\/Tag Management/i });
    await user.click(backButton);

    expect(screen.queryByTestId(RECORD_COUNT_TEST_ID)).not.toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("leaves Admin in one Close Admin click after navigating between views", async () => {
    const user = userEvent.setup();
    render(
      <TestProvider routerEntries={["/demonstrations", "/admin"]}>
        <DialogProvider>
          <Routes>
            <Route path="/demonstrations" element={<div>{PREVIOUS_PAGE_TEXT}</div>} />
            <Route
              path="/admin"
              element={
                <>
                  <AdminHeader />
                  <TypeTagManagement />
                </>
              }
            />
          </Routes>
        </DialogProvider>
      </TestProvider>
    );

    const firstTypeTagRow = screen.getByRole("row", { name: new RegExp(FIRST_TYPE_TAG_NAME) });
    const viewButton = within(firstTypeTagRow).getByRole("button", { name: /View/i });

    await user.click(viewButton);
    await screen.findByText("Type/Tag File View");

    const backButton = screen.getByRole("button", { name: /Type\/Tag Management/i });
    await user.click(backButton);

    const viewButtonAgain = within(
      screen.getByRole("row", { name: new RegExp(FIRST_TYPE_TAG_NAME) })
    ).getByRole("button", { name: /View/i });
    await user.click(viewButtonAgain);

    const closeAdminButton = screen.getByTestId("close-admin");
    await user.click(closeAdminButton);

    expect(await screen.findByText(PREVIOUS_PAGE_TEXT)).toBeInTheDocument();
  });
});
