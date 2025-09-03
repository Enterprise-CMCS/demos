import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { ALL_MOCKS } from "mock-data/index";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

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

  it("renders demonstration header info", async () => {
    renderWithProviders();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Summary Details")).toBeInTheDocument();
    });

    // Check breadcrumb navigation
    expect(screen.getByRole("link", { name: /demonstration list/i })).toBeInTheDocument();

    // Get the attributes list and verify its structure
    const attributesList = screen.getByTestId("demonstration-attributes-list");
    expect(attributesList).toBeInTheDocument();
    expect(attributesList).toHaveAttribute("role", "list");

    // Get all list items (excluding pipe separators)
    const listItems = within(attributesList).getAllByRole("listitem");
    const attributeItems = listItems.filter((item) => !item.textContent?.includes("|"));

    // Expected attributes in order
    const expectedAttributes = [
      { label: "State/Territory", value: "MT" },
      { label: "Project Officer", value: "John Doe" },
      { label: "Status", value: "Approved" },
      { label: "Effective", value: "01/01/2025" },
      { label: "Expiration", value: "12/01/2025" },
    ];

    // Verify we have the expected number of attribute items
    expect(attributeItems).toHaveLength(expectedAttributes.length);

    // Loop through and verify each attribute
    expectedAttributes.forEach((expected, index) => {
      const item = attributeItems[index];
      expect(item).toHaveTextContent(expected.label);
      expect(item).toHaveTextContent(expected.value);

      // Verify the structure: should contain both label and value
      expect(item.textContent).toMatch(new RegExp(`${expected.label}.*${expected.value}`));
    });
  });

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

  it("shows Add button and dropdown options", async () => {
    renderWithProviders();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Summary Details")).toBeInTheDocument();
    });

    const toggleButton = screen.getByTestId("Toggle more options");
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId("Create New")).toBeInTheDocument();
    });

    const addButton = screen.getByTestId("Create New");

    // Click the Add button to open the dropdown
    fireEvent.click(addButton);

    // Verify Amendment and Extension options appear
    await waitFor(() => {
      expect(screen.getByTestId("button-create-new-amendment")).toBeInTheDocument();
      expect(screen.getByTestId("button-create-new-extension")).toBeInTheDocument();
    });

    expect(screen.getByText("Amendment")).toBeInTheDocument();
    expect(screen.getByText("Extension")).toBeInTheDocument();
  });

  it("opens Add Amendment Modal when Amendment option is clicked", async () => {
    renderWithProviders();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Summary Details")).toBeInTheDocument();
    });

    const toggleButton = screen.getByTestId("Toggle more options");
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId("Create New")).toBeInTheDocument();
    });

    const addButton = screen.getByTestId("Create New");
    fireEvent.click(addButton);

    // Wait for dropdown to appear and click Amendment
    await waitFor(() => {
      expect(screen.getByTestId("button-create-new-amendment")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("button-create-new-amendment"));

    // Verify Amendment modal appears
    await waitFor(() => {
      expect(screen.getByText(/New Amendment/i)).toBeInTheDocument();
    });
  });

  it("opens Add Extension Modal when Extension option is clicked", async () => {
    renderWithProviders();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Summary Details")).toBeInTheDocument();
    });

    const toggleButton = screen.getByTestId("Toggle more options");
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId("Create New")).toBeInTheDocument();
    });

    const addButton = screen.getByTestId("Create New");
    fireEvent.click(addButton);

    // Wait for dropdown to appear and click Extension
    await waitFor(() => {
      expect(screen.getByTestId("button-create-new-extension")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("button-create-new-extension"));

    // Verify Extension modal appears
    await waitFor(() => {
      expect(screen.getByText(/New Extension/i)).toBeInTheDocument();
    });
  });
});
