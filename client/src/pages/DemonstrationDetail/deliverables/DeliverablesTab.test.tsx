import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MockedResponse } from "@apollo/client/testing";
import { DialogProvider } from "components/dialog/DialogContext";
import { ADD_DELIVERABLE_SLOT_DIALOG_TITLE } from "components/dialog/deliverable";
import { ADD_DELIVERABLE_SLOT_BUTTON_NAME, DeliverablesTab } from "./DeliverablesTab";
import { TestProvider } from "test-utils/TestProvider";
import { deliverableMocks, MOCK_DELIVERABLE_TABLE_ROW } from "mock-data/deliverableMocks";
import { developmentMockUser } from "mock-data/userMocks";
import { STATE_USER_DELIVERABLES_PAGE_QUERY } from "components/table/tables/DeliverableTable";

const MOCK_PARENT_DEMONSTRATION = {
  id: "demo-1",
  demonstrationTypes: [],
  effectiveDate: new Date("2026-01-01"),
  expirationDate: new Date("2026-12-31"),
};
const STATE_TEST_USER = {
  ...developmentMockUser,
  person: {
    ...developmentMockUser.person,
    personType: "demos-state-user" as const,
  },
};
const STATE_USER_DELIVERABLES_TAB_MOCKS: MockedResponse[] = [
  {
    request: { query: STATE_USER_DELIVERABLES_PAGE_QUERY },
    result: {
      data: {
        currentUser: {
          person: {
            roles: [
              {
                role: "State Point of Contact",
                demonstration: {
                  id: MOCK_PARENT_DEMONSTRATION.id,
                  deliverables: [MOCK_DELIVERABLE_TABLE_ROW],
                },
              },
              {
                role: "State Point of Contact",
                demonstration: {
                  id: "other-demo",
                  deliverables: [
                    {
                      ...MOCK_DELIVERABLE_TABLE_ROW,
                      id: "other-demo-deliverable",
                      name: "Other Demo Deliverable",
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  },
];

describe("DeliverablesTab", () => {
  it("renders Deliverables Management header and required columns", async () => {
    render(
      <TestProvider mocks={deliverableMocks}>
        <DialogProvider>
          <DeliverablesTab parentDemonstration={MOCK_PARENT_DEMONSTRATION} />
        </DialogProvider>
      </TestProvider>
    );

    expect(screen.getByRole("heading", { name: "Deliverables" })).toBeInTheDocument();
    expect(
      await screen.findByRole("columnheader", { name: /Deliverable Type/i })
    ).toBeInTheDocument();
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

    expect(
      await screen.findByText("You have no assigned Deliverables at this time")
    ).toBeInTheDocument();
  });

  it("loads state user deliverables from current user role assignments", async () => {
    render(
      <TestProvider mocks={STATE_USER_DELIVERABLES_TAB_MOCKS} currentUser={STATE_TEST_USER}>
        <DialogProvider>
          <DeliverablesTab parentDemonstration={MOCK_PARENT_DEMONSTRATION} />
        </DialogProvider>
      </TestProvider>
    );

    expect(await screen.findByText(MOCK_DELIVERABLE_TABLE_ROW.name)).toBeInTheDocument();
    expect(screen.queryByText("Other Demo Deliverable")).not.toBeInTheDocument();
    expect(screen.queryByText("Error loading deliverables.")).not.toBeInTheDocument();
  });
});
