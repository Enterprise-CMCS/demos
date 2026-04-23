import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TestProvider } from "test-utils/TestProvider";

import { HISTORY_TAB_NAME, HistoryTab, type DeliverableHistoryRow } from "./HistoryTab";

const MOCK_ROWS: DeliverableHistoryRow[] = [
  {
    id: "hist-1",
    event: "Submitted",
    date: new Date("2026-04-01"),
    user: "Leslie Carlson",
    details: "Sorry",
  },
  {
    id: "hist-2",
    event: "Resubmission Request",
    date: new Date("2026-04-01"),
    user: "Tess Davenport",
    details: "-",
  },
];

describe("HistoryTab", () => {
  it("renders the history table with all expected column headers", () => {
    render(
      <TestProvider>
        <HistoryTab rows={MOCK_ROWS} />
      </TestProvider>
    );

    expect(screen.getByTestId(HISTORY_TAB_NAME)).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Event/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Date/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /User/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Details/ })).toBeInTheDocument();
  });

  it("renders a row per event", () => {
    render(
      <TestProvider>
        <HistoryTab rows={MOCK_ROWS} />
      </TestProvider>
    );

    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText("Resubmission Request")).toBeInTheDocument();
    expect(screen.getByText("Leslie Carlson")).toBeInTheDocument();
    expect(screen.getByText("Tess Davenport")).toBeInTheDocument();
  });

  it("renders an empty-state message when there are no rows", () => {
    render(
      <TestProvider>
        <HistoryTab rows={[]} />
      </TestProvider>
    );

    expect(screen.getByText(/No history available\./i)).toBeInTheDocument();
  });
});
