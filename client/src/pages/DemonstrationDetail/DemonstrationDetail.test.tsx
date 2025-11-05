import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { ALL_MOCKS } from "mock-data/index";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { DemonstrationDetail } from "./DemonstrationDetail";

describe("DemonstrationDetail", () => {
  function renderWithProviders() {
    return render(
      <ToastProvider>
        <MockedProvider mocks={ALL_MOCKS} addTypename={false}>
          <MemoryRouter initialEntries={["/demonstrations/1"]}>
            <Routes>
              <Route path="/demonstrations/:id" element={<DemonstrationDetail />} />
            </Routes>
          </MemoryRouter>
        </MockedProvider>
      </ToastProvider>
    );
  }

  it("renders and switches to Amendments tab", async () => {
    renderWithProviders();

    // Wait for component to load and navigate to Documents tab where table is located
    await waitFor(() => {
      expect(screen.getByText("Summary Details")).toBeInTheDocument();
    });

    // Navigate to Documents tab first to access the table
    const documentsTab = screen.getByRole("button", { name: /Documents/i });
    fireEvent.click(documentsTab);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: /Documents/i })).toBeInTheDocument();

    const amendmentsTab = screen.getByRole("button", { name: /Amendments/i });
    fireEvent.click(amendmentsTab);

    expect(screen.getByText("Amendments")).toBeInTheDocument();
    expect(screen.getByText("Amendment 1 - Montana Medicaid Waiver")).toBeInTheDocument();
  });

  it("opens Add New Amendment modal", async () => {
    renderWithProviders();

    // Wait for component to load and navigate to Documents tab where table is located
    await waitFor(() => {
      expect(screen.getByText("Summary Details")).toBeInTheDocument();
    });

    // Navigate to Documents tab first to access the table
    const documentsTab = screen.getByRole("button", { name: /Documents/i });
    fireEvent.click(documentsTab);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Amendments/i }));
    fireEvent.click(screen.getByTestId("add-new-amendment"));

    expect(screen.getByText(/New Amendment/i)).toBeInTheDocument();
  });

  it("renders and switches to Extensions tab", async () => {
    renderWithProviders();

    // Wait for component to load and navigate to Documents tab where table is located
    await waitFor(() => {
      expect(screen.getByText("Summary Details")).toBeInTheDocument();
    });

    // Navigate to Documents tab first to access the table
    const documentsTab = screen.getByRole("button", { name: /Documents/i });
    fireEvent.click(documentsTab);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Extensions/i }));

    expect(screen.getByText("Extensions")).toBeInTheDocument();
    expect(screen.getByText("Extension 1 - Montana Medicaid Waiver")).toBeInTheDocument();
  });
});
