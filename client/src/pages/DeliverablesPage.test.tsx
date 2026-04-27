import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockedResponse } from "@apollo/client/testing";
import { DELIVERABLES_PAGE_QUERY } from "components/table/tables/DeliverableTable";
import { DeliverablesPage } from "./DeliverablesPage";
import { MOCK_DELIVERABLE_TABLE_ROW } from "mock-data/deliverableMocks";
import { mockUsers } from "mock-data/userMocks";
import { TestProvider } from "test-utils/TestProvider";

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({ showEditDeliverableDialog: vi.fn() }),
}));

const MOCK_DELIVERABLE_TABLE_ROWS = [
  {
    ...MOCK_DELIVERABLE_TABLE_ROW,
    demonstration: {
      ...MOCK_DELIVERABLE_TABLE_ROW.demonstration,
      roles: [{ role: "State Point of Contact" as const, person: { id: "1" } }],
    },
  },
  {
    ...MOCK_DELIVERABLE_TABLE_ROW,
    id: "2",
    name: "Budget Neutrality Worksheet",
    demonstration: {
      ...MOCK_DELIVERABLE_TABLE_ROW.demonstration,
      roles: [{ role: "State Point of Contact" as const, person: { id: "1" } }],
    },
  },
  {
    ...MOCK_DELIVERABLE_TABLE_ROW,
    id: "3",
    name: "Quarterly Report For NYC Demonstration",
    demonstration: {
      ...MOCK_DELIVERABLE_TABLE_ROW.demonstration,
      roles: [{ role: "State Point of Contact" as const, person: { id: "2" } }],
    },
    cmsOwner: {
      id: "other-user-id",
      person: { id: "other-person", fullName: "Other Person" },
    },
  },
];

const DELIVERABLES_TABLE_MOCKS: MockedResponse[] = [
  {
    request: { query: DELIVERABLES_PAGE_QUERY },
    result: { data: { deliverables: MOCK_DELIVERABLE_TABLE_ROWS } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];

describe("DeliverablesPage tab persistence", () => {
  const TAB_KEY = "selectedDeliverableTab";
  const CURRENT_USER_ID = MOCK_DELIVERABLE_TABLE_ROW.cmsOwner.id;
  const DEFAULT_TEST_USER = { ...mockUsers[0], id: CURRENT_USER_ID };

  const renderDeliverablesPage = async (currentUser = DEFAULT_TEST_USER) => {
    render(
      <TestProvider mocks={DELIVERABLES_TABLE_MOCKS} currentUser={currentUser}>
        <DeliverablesPage />
      </TestProvider>
    );
    await screen.findByTestId("button-my-deliverables");
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("defaults to My Deliverables when no tab is stored", async () => {
    await renderDeliverablesPage();

    // My Deliverables should be selected
    expect(screen.getByTestId("button-my-deliverables")).toHaveAttribute("aria-selected", "true");

    expect(sessionStorage.getItem(TAB_KEY)).toBe("my-deliverables");
  });

  it("uses stored tab selection from sessionStorage", async () => {
    sessionStorage.setItem(TAB_KEY, "deliverables");

    await renderDeliverablesPage();

    expect(screen.getByTestId("button-deliverables")).toHaveAttribute("aria-selected", "true");
  });

  it("stores tab changes to sessionStorage", async () => {
    await renderDeliverablesPage();

    fireEvent.click(screen.getByTestId("button-deliverables"));

    expect(sessionStorage.getItem(TAB_KEY)).toBe("deliverables");
  });

  it("shows correct deliverable counts in tab labels", async () => {
    await renderDeliverablesPage();

    const myDeliverablesCount = MOCK_DELIVERABLE_TABLE_ROWS.filter(
      (d) => d.cmsOwner.id === CURRENT_USER_ID
    ).length;

    expect(screen.getByText(`My Deliverables (${myDeliverablesCount})`)).toBeInTheDocument();

    expect(
      screen.getByText(`All Deliverables (${MOCK_DELIVERABLE_TABLE_ROWS.length})`)
    ).toBeInTheDocument();
  });

  it("filters My Deliverables correctly", async () => {
    await renderDeliverablesPage();
    fireEvent.click(screen.getByTestId("button-my-deliverables"));

    const myDeliverables = MOCK_DELIVERABLE_TABLE_ROWS.filter((d) => d.cmsOwner.id === CURRENT_USER_ID);
    const notMyDeliverable = MOCK_DELIVERABLE_TABLE_ROWS.find((d) => d.cmsOwner.id !== CURRENT_USER_ID);

    myDeliverables.forEach((deliverable) => {
      expect(screen.getByText(deliverable.name)).toBeInTheDocument();
    });

    if (notMyDeliverable) {
      expect(screen.queryByText(notMyDeliverable.name)).not.toBeInTheDocument();
    }
  });

  it("shows all deliverables when All Deliverables tab is selected", async () => {
    await renderDeliverablesPage();

    fireEvent.click(screen.getByTestId("button-deliverables"));

    expect(screen.getByText("Budget Neutrality Report")).toBeInTheDocument();
    expect(screen.getByText("Budget Neutrality Worksheet")).toBeInTheDocument();
    expect(screen.getByText("Quarterly Report For NYC Demonstration")).toBeInTheDocument();
  });

  it("uses state-user table columns when current user is demos-state-user", async () => {
    await renderDeliverablesPage({
      ...mockUsers[0],
      person: {
        ...mockUsers[0].person,
        personType: "demos-state-user",
      },
    });

    expect(
      screen.queryByRole("columnheader", { name: /State\/Territory/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /CMS Owner/i })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Demonstration Name/i })).toBeInTheDocument();
  });

  it("shows only deliverables where the state user is a State Point of Contact", async () => {
    await renderDeliverablesPage({
      ...mockUsers[0],
      person: {
        ...mockUsers[0].person,
        personType: "demos-state-user",
      },
    });

    expect(screen.queryByTestId("button-deliverables")).not.toBeInTheDocument();
    expect(screen.queryByTestId("button-my-deliverables")).not.toBeInTheDocument();
    expect(screen.getByText("Budget Neutrality Report")).toBeInTheDocument();
    expect(screen.getByText("Budget Neutrality Worksheet")).toBeInTheDocument();
    expect(screen.queryByText("Quarterly Report For NYC Demonstration")).not.toBeInTheDocument();
  });

  it("shows the state-user empty message when no State Point of Contact rows match", async () => {
    await renderDeliverablesPage({
      ...mockUsers[9],
      person: {
        ...mockUsers[9].person,
        personType: "demos-state-user",
      },
    });

    expect(screen.getByText("There are no assigned Deliverables at this time")).toBeInTheDocument();
  });
});
