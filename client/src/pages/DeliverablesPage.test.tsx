import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as UserContext from "components/user/UserContext";

import { DeliverablesPage } from "./DeliverablesPage";
import { MOCK_DELIVERABLES } from "mock-data/deliverableMocks";
import { mockUsers } from "mock-data/userMocks";

const mockUseQuery = vi.fn();

vi.mock("@apollo/client", () => ({
  gql: (literals: TemplateStringsArray, ...placeholders: string[]) =>
    literals.reduce((acc, curr, idx) => acc + curr + (placeholders[idx] || ""), ""),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("components/user/UserContext", async (importOriginal) => {
  const actual = await importOriginal<typeof UserContext>();
  return {
    ...actual,
    getCurrentUser: vi.fn(),
  };
});

describe("DeliverablesPage tab persistence", () => {
  const TAB_KEY = "selectedDeliverableTab";
  const CURRENT_USER_ID = "dustyrhodes";
  const mockGetCurrentUser = vi.mocked(UserContext.getCurrentUser);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: {
        deliverables: MOCK_DELIVERABLES,
      },
      loading: false,
      error: undefined,
    });
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });
    sessionStorage.clear();
  });

  it("defaults to My Deliverables when no tab is stored", () => {
    render(<DeliverablesPage />);

    // My Deliverables should be selected
    expect(
      screen.getByTestId("button-my-deliverables")
    ).toHaveAttribute("aria-selected", "true");

    expect(sessionStorage.getItem(TAB_KEY)).toBe("my-deliverables");
  });

  it("uses stored tab selection from sessionStorage", () => {
    sessionStorage.setItem(TAB_KEY, "deliverables");

    render(<DeliverablesPage />);

    expect(
      screen.getByTestId("button-deliverables")
    ).toHaveAttribute("aria-selected", "true");
  });

  it("stores tab changes to sessionStorage", () => {
    render(<DeliverablesPage />);

    fireEvent.click(screen.getByTestId("button-deliverables"));

    expect(sessionStorage.getItem(TAB_KEY)).toBe("deliverables");
  });

  it("shows correct deliverable counts in tab labels", () => {
    render(<DeliverablesPage />);

    const myDeliverablesCount = MOCK_DELIVERABLES.filter(
      (d) => d.cmsOwner.id === CURRENT_USER_ID
    ).length;

    expect(
      screen.getByText(`My Deliverables (${myDeliverablesCount})`)
    ).toBeInTheDocument();

    expect(
      screen.getByText(`All Deliverables (${MOCK_DELIVERABLES.length})`)
    ).toBeInTheDocument();
  });

  it("filters My Deliverables correctly", () => {
    render(<DeliverablesPage />);
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

  it("shows all deliverables when All Deliverables tab is selected", () => {
    render(<DeliverablesPage />);

    fireEvent.click(screen.getByTestId("button-deliverables"));

    expect(screen.getByText("Budget Neutrality Report")).toBeInTheDocument();
    expect(screen.getByText("Budget Neutrality Worksheet")).toBeInTheDocument();
    expect(screen.getByText("Deliverable 8")).toBeInTheDocument();
  });

  it("uses state-user table columns when current user is demos-state-user", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: {
        ...mockUsers[0],
        person: {
          ...mockUsers[0].person,
          personType: "demos-state-user",
        },
      },
    });

    render(<DeliverablesPage />);

    expect(screen.queryByRole("columnheader", { name: /State\/Territory/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /CMS Owner/i })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Demonstration Name/i })).toBeInTheDocument();
  });

  it("shows All Deliverables tab for demos-state-user", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: {
        ...mockUsers[0],
        person: {
          ...mockUsers[0].person,
          personType: "demos-state-user",
        },
      },
    });

    render(<DeliverablesPage />);

    expect(screen.getByTestId("button-deliverables")).toBeInTheDocument();
    expect(screen.getByTestId("button-my-deliverables")).toHaveAttribute("aria-selected", "true");
  });

  it("uses stored deliverables tab for demos-state-user", () => {
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

    render(<DeliverablesPage />);

    expect(sessionStorage.getItem(TAB_KEY)).toBe("deliverables");
    expect(screen.getByTestId("button-deliverables")).toHaveAttribute("aria-selected", "true");
  });
});
