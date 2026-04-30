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
  MOCK_DELIVERABLE_TABLE_ROW,
  {
    ...MOCK_DELIVERABLE_TABLE_ROW,
    id: "2",
    name: "Budget Neutrality Worksheet",
  },
  {
    ...MOCK_DELIVERABLE_TABLE_ROW,
    id: "3",
    name: "Quarterly Report For NYC Demonstration",
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

const EMPTY_DELIVERABLES_TABLE_MOCKS: MockedResponse[] = [
  {
    request: { query: DELIVERABLES_PAGE_QUERY },
    result: { data: { deliverables: [] } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];

describe("DeliverablesPage tab persistence", () => {
  const TAB_KEY = "selectedDeliverableTab";
  const CURRENT_USER_ID = MOCK_DELIVERABLE_TABLE_ROW.cmsOwner.id;
  const DEFAULT_TEST_USER = { ...mockUsers[0], id: CURRENT_USER_ID };
  const STATE_TEST_USER = {
    ...mockUsers[0],
    person: {
      ...mockUsers[0].person,
      personType: "demos-state-user" as const,
    },
  };

  const renderDeliverablesPage = async (
    currentUser = DEFAULT_TEST_USER,
    mocks: MockedResponse[] = DELIVERABLES_TABLE_MOCKS
  ) => {
    render(
      <TestProvider mocks={mocks} currentUser={currentUser}>
        <DeliverablesPage />
      </TestProvider>
    );
    await screen.findByTestId("button-my-deliverables");
  };

  const renderStateDeliverablesPage = async (
    mocks: MockedResponse[] = DELIVERABLES_TABLE_MOCKS
  ) => {
    render(
      <TestProvider mocks={mocks} currentUser={STATE_TEST_USER}>
        <DeliverablesPage />
      </TestProvider>
    );
    await screen.findByText("Deliverables");
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

    const myDeliverables = MOCK_DELIVERABLE_TABLE_ROWS.filter(
      (d) => d.cmsOwner.id === CURRENT_USER_ID
    );
    const notMyDeliverable = MOCK_DELIVERABLE_TABLE_ROWS.find(
      (d) => d.cmsOwner.id !== CURRENT_USER_ID
    );

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

  it("uses distinct empty messages for My Deliverables and All Deliverables", async () => {
    await renderDeliverablesPage(DEFAULT_TEST_USER, EMPTY_DELIVERABLES_TABLE_MOCKS);

    expect(screen.getByText("You have no assigned Deliverables at this time")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("button-deliverables"));

    expect(screen.getByText("There are no assigned Deliverables at this time")).toBeInTheDocument();
  });

  it("uses state-user table columns when current user is demos-state-user", async () => {
    await renderStateDeliverablesPage();

    expect(
      screen.queryByRole("columnheader", { name: /State\/Territory/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /CMS Owner/i })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Demonstration Name/i })).toBeInTheDocument();
  });

  it("renders all deliverables without tabs for demos-state-user", async () => {
    await renderStateDeliverablesPage();

    expect(screen.queryByTestId("button-deliverables")).not.toBeInTheDocument();
    expect(screen.queryByTestId("button-my-deliverables")).not.toBeInTheDocument();
    expect(screen.getByText("Budget Neutrality Report")).toBeInTheDocument();
    expect(screen.getByText("Budget Neutrality Worksheet")).toBeInTheDocument();
    expect(screen.getByText("Quarterly Report For NYC Demonstration")).toBeInTheDocument();
  });

  it("shows state-user empty message when there are no deliverables", async () => {
    await renderStateDeliverablesPage(EMPTY_DELIVERABLES_TABLE_MOCKS);

    expect(screen.getByText("There are no assigned Deliverables at this time")).toBeInTheDocument();
    expect(screen.queryByTestId("button-deliverables")).not.toBeInTheDocument();
    expect(screen.queryByTestId("button-my-deliverables")).not.toBeInTheDocument();
  });

  it("does not use stored deliverables tab for demos-state-user", async () => {
    sessionStorage.setItem(TAB_KEY, "deliverables");

    await renderStateDeliverablesPage();

    expect(sessionStorage.getItem(TAB_KEY)).toBe("deliverables");
    expect(screen.queryByTestId("button-deliverables")).not.toBeInTheDocument();
    expect(screen.queryByTestId("button-my-deliverables")).not.toBeInTheDocument();
  });
});
