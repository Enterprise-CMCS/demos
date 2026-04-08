import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeliverablesPage } from "./DeliverablesPage";
import { MOCK_DELIVERABLES } from "mock-data/deliverableMocks";

describe("DeliverablesPage tab persistence", () => {
  const TAB_KEY = "selectedDeliverableTab";
  const CURRENT_USER_ID = "dustyrhodes";

  beforeEach(() => {
    vi.clearAllMocks();
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
      (d) => d.primaryContact?.id === CURRENT_USER_ID
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

    // Should show only deliverables assigned to CURRENT_USER_ID
    expect(screen.getByText("Quarterly Report For NYC Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Budget Neutrality Worksheet")).toBeInTheDocument();

    // Should NOT show others in My Deliverables tab
    expect(screen.queryByText("Budget Neutrality Report")).not.toBeInTheDocument();
    expect(screen.queryByText("Deliverable 3")).not.toBeInTheDocument();
  });

  it("shows all deliverables when All Deliverables tab is selected", () => {
    render(<DeliverablesPage />);

    fireEvent.click(screen.getByTestId("button-deliverables"));

    expect(screen.getByText("Budget Neutrality Report")).toBeInTheDocument();
    expect(screen.getByText("Quarterly Report For NYC Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Deliverable 8")).toBeInTheDocument();
  });
});
