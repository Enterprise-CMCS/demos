import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { DemonstrationDetail } from "./DemonstrationDetail";
import { MockedProvider } from "@apollo/client/testing";
import { ALL_MOCKS } from "mock-data/index";

describe("DemonstrationDetail", () => {
  function renderWithProviders() {
    return render(
      <ToastProvider>
        <MockedProvider mocks={ALL_MOCKS} addTypename={false}>
          <MemoryRouter initialEntries={["/demonstrations/1"]}>
            <Routes>
              <Route
                path="/demonstrations/:id"
                element={<DemonstrationDetail />}
              />
            </Routes>
          </MemoryRouter>
        </MockedProvider>
      </ToastProvider>
    );
  }

  it("renders demonstration header info", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const rows = screen.getAllByTestId("demonstration-detail-row");

    const stateRow = rows.find(
      (row) =>
        row.textContent?.includes("State/Territory:") &&
        row.textContent?.includes("CA")
    );
    const officerRow = rows.find(
      (row) =>
        row.textContent?.includes("Project Officer:") &&
        row.textContent?.includes("John Doe")
    );

    expect(stateRow).toBeDefined();
    expect(officerRow).toBeDefined();
  });

  it("renders and switches to Amendments tab", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: /Documents/i })
    ).toBeInTheDocument();

    const amendmentsTab = screen.getByRole("button", { name: /Amendments/i });
    fireEvent.click(amendmentsTab);

    expect(screen.getByText("Amendments")).toBeInTheDocument();
    expect(screen.getByText("Amendment 1")).toBeInTheDocument();
  });

  it("opens Add New Amendment modal", async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Amendments/i }));
    fireEvent.click(screen.getByRole("button", { name: /Add New/i }));

    expect(screen.getByText(/New Amendment/i)).toBeInTheDocument();
  });

  it("renders and switches to Extensions tab", async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: /Documents/i })
    ).toBeInTheDocument();

    const extensionsTab = screen.getByRole("button", { name: /Extensions/i });
    fireEvent.click(extensionsTab);

    expect(screen.getByText("Extensions")).toBeInTheDocument();
    expect(screen.getByText("Extension 1")).toBeInTheDocument();
  });
});
