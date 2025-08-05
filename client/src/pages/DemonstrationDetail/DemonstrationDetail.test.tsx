import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { ALL_MOCKS } from "mock-data/index";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { MockedProvider } from "@apollo/client/testing";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import { DemonstrationDetail } from "./DemonstrationDetail";

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

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Test Demonstration")).toBeInTheDocument();
    });

    // Check breadcrumb navigation
    expect(
      screen.getByRole("link", { name: /demonstration list/i })
    ).toBeInTheDocument();

    // Get the attributes list and verify its structure
    const attributesList = screen.getByTestId("demonstration-attributes-list");
    expect(attributesList).toBeInTheDocument();
    expect(attributesList).toHaveAttribute("role", "list");

    // Get all list items (excluding pipe separators)
    const listItems = within(attributesList).getAllByRole("listitem");
    const attributeItems = listItems.filter(
      (item) => !item.textContent?.includes("|")
    );

    // Expected attributes in order
    const expectedAttributes = [
      { label: "State/Territory", value: "CA" },
      { label: "Project Officer", value: "John Doe" },
      { label: "Status", value: "Active" },
      { label: "Effective", value: "1/1/2025" },
      { label: "Expiration", value: "12/31/2025" },
    ];

    // Verify we have the expected number of attribute items
    expect(attributeItems).toHaveLength(expectedAttributes.length);

    // Loop through and verify each attribute
    expectedAttributes.forEach((expected, index) => {
      const item = attributeItems[index];
      expect(item).toHaveTextContent(expected.label);
      expect(item).toHaveTextContent(expected.value);

      // Verify the structure: should contain both label and value
      expect(item.textContent).toMatch(
        new RegExp(`${expected.label}.*${expected.value}`)
      );
    });
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
