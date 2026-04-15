import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as UserContext from "components/user/UserContext";

import { DeliverablesPage } from "./DeliverablesPage";
import { DELIVERABLES_PAGE_QUERY } from "components/table/tables/DeliverableTable";
import { deliverableMocks, MOCK_DELIVERABLES } from "mock-data/deliverableMocks";
import { mockUsers } from "mock-data/userMocks";
import { TestProvider } from "test-utils/TestProvider";

vi.mock("components/user/UserContext", async (importOriginal) => {
  const actual = await importOriginal<typeof UserContext>();
  return {
    ...actual,
    getCurrentUser: vi.fn(),
  };
});

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({ showEditDeliverableDialog: vi.fn() }),
}));

describe("DeliverablesPage tab persistence", () => {
  const TAB_KEY = "selectedDeliverableTab";
  const CURRENT_USER_ID = "dustyrhodes";
  const mockGetCurrentUser = vi.mocked(UserContext.getCurrentUser);
  const deliverablesPageMocks = [
    {
      ...deliverableMocks[0]!,
      request: {
        ...deliverableMocks[0]!.request,
        query: DELIVERABLES_PAGE_QUERY,
      },
    },
  ];

  const renderDeliverablesPage = async () => {
    render(
      <TestProvider mocks={deliverablesPageMocks} addTypename={false}>
        <DeliverablesPage />
      </TestProvider>
    );
    await screen.findByTestId("button-my-deliverables");
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({
      currentUser: {
        ...mockUsers[0],
        id: CURRENT_USER_ID,
      },
    });
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

    const myDeliverablesCount = MOCK_DELIVERABLES.filter(
      (d) => d.cmsOwner.id === CURRENT_USER_ID
    ).length;

    expect(screen.getByText(`My Deliverables (${myDeliverablesCount})`)).toBeInTheDocument();

    expect(screen.getByText(`All Deliverables (${MOCK_DELIVERABLES.length})`)).toBeInTheDocument();
  });

  it("filters My Deliverables correctly", async () => {
    await renderDeliverablesPage();
    fireEvent.click(screen.getByTestId("button-my-deliverables"));

    const myDeliverables = MOCK_DELIVERABLES.filter((d) => d.cmsOwner.id === CURRENT_USER_ID);
    const notMyDeliverable = MOCK_DELIVERABLES.find((d) => d.cmsOwner.id !== CURRENT_USER_ID);

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
    mockGetCurrentUser.mockReturnValue({
      currentUser: {
        ...mockUsers[0],
        person: {
          ...mockUsers[0].person,
          personType: "demos-state-user",
        },
      },
    });

    await renderDeliverablesPage();

    expect(
      screen.queryByRole("columnheader", { name: /State\/Territory/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /CMS Owner/i })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Demonstration Name/i })).toBeInTheDocument();
  });

  it("shows All Deliverables tab for demos-state-user", async () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: {
        ...mockUsers[0],
        person: {
          ...mockUsers[0].person,
          personType: "demos-state-user",
        },
      },
    });

    await renderDeliverablesPage();

    expect(screen.getByTestId("button-deliverables")).toBeInTheDocument();
    expect(screen.getByTestId("button-my-deliverables")).toHaveAttribute("aria-selected", "true");
  });

  it("uses stored deliverables tab for demos-state-user", async () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: {
        ...mockUsers[0],
        person: {
          ...mockUsers[0].person,
          personType: "demos-state-user",
        },
      },
    });
    sessionStorage.setItem(TAB_KEY, "deliverables");

    await renderDeliverablesPage();

    expect(sessionStorage.getItem(TAB_KEY)).toBe("deliverables");
    expect(screen.getByTestId("button-deliverables")).toHaveAttribute("aria-selected", "true");
  });
});
