import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TestProvider } from "test-utils/TestProvider";

import { HISTORY_TAB_NAME, HistoryTab, type DeliverableHistoryRow } from "./HistoryTab";

const MOCK_ROWS: DeliverableHistoryRow[] = [
  {
    id: "hist-1",
    event: "Submitted Deliverable",
    date: new Date("2026-04-01"),
    user: "Leslie Carlson (State User)",
    details: "",
  },
  {
    id: "hist-2",
    event: "Requested Resubmission",
    date: new Date("2026-04-01"),
    user: "Tess Davenport (CMS User)",
    details:
      "Old Due Date: 03/15/2026\nNew Due Date: 04/15/2026\nReason Details: Needs correction.",
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

    expect(screen.getByText("Submitted Deliverable")).toBeInTheDocument();
    expect(screen.getByText("Requested Resubmission")).toBeInTheDocument();
    expect(screen.getByText("Leslie Carlson (State User)")).toBeInTheDocument();
    expect(screen.getByText("Tess Davenport (CMS User)")).toBeInTheDocument();
  });

  it("formats action timestamps in MM/DD/YYYY", () => {
    render(
      <TestProvider>
        <HistoryTab rows={MOCK_ROWS} />
      </TestProvider>
    );

    expect(screen.getAllByText("04/01/2026").length).toBeGreaterThan(0);
  });

  it("preserves newlines in the details column for multi-line entries", () => {
    render(
      <TestProvider>
        <HistoryTab rows={MOCK_ROWS} />
      </TestProvider>
    );

    const detailsText = screen.getByText(/Old Due Date: 03\/15\/2026/);
    expect(detailsText).toBeInTheDocument();
    expect(detailsText.closest("div")?.className).toContain("whitespace-pre-line");
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
