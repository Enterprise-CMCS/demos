import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

import { DemonstrationDetail } from "./DemonstrationDetail";

// Mock useDemonstration hook
vi.mock("hooks/useDemonstration", () => ({
  useDemonstration: () => ({
    getDemonstrationById: {
      trigger: vi.fn(),
      data: {
        id: "demo-123",
        name: "Test Demo",
        state: { id: "CA" },
        description: "Test Project Officer",
      },
      loading: false,
      error: null,
    },
  }),
}));

// Mock usePageHeader (no-op)
vi.mock("hooks/usePageHeader", () => ({
  usePageHeader: () => {},
}));

describe("DemonstrationDetail", () => {
  function renderWithProviders() {
    return render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/demonstrations/demo-123"]}>
          <Routes>
            <Route
              path="/demonstrations/:id"
              element={<DemonstrationDetail />}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );
  }

  it("renders demonstration header info", () => {
    renderWithProviders();

    const rows = screen.getAllByTestId("demonstration-detail-row");

    const stateRow = rows.find(
      (row) =>
        row.textContent?.includes("State/Territory:") &&
        row.textContent?.includes("CA")
    );
    const officerRow = rows.find(
      (row) =>
        row.textContent?.includes("Project Officer:") &&
        row.textContent?.includes("Test Project Officer")
    );

    expect(stateRow).toBeDefined();
    expect(officerRow).toBeDefined();
  });

  it("renders and switches to Amendments tab", () => {
    renderWithProviders();

    expect(
      screen.getByRole("heading", { name: /Documents/i })
    ).toBeInTheDocument();

    const amendmentsTab = screen.getByRole("button", { name: /Amendments/i });
    fireEvent.click(amendmentsTab);

    expect(screen.getByText("Amendments")).toBeInTheDocument();
    expect(screen.getByText("Amendment 1")).toBeInTheDocument();
  });

  it("opens Add New Amendment modal", () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole("button", { name: /Amendments/i }));
    fireEvent.click(screen.getByRole("button", { name: /Add New/i }));

    expect(screen.getByText(/New Amendment/i)).toBeInTheDocument();
  });

  it("renders and switches to Extensions tab", () => {
    renderWithProviders();

    expect(
      screen.getByRole("heading", { name: /Documents/i })
    ).toBeInTheDocument();

    const extensionsTab = screen.getByRole("button", { name: /Extensions/i });
    fireEvent.click(extensionsTab);

    expect(screen.getByText("Extensions")).toBeInTheDocument();
    expect(screen.getByText("Extension 1")).toBeInTheDocument();
  });
});
