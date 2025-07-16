import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DemonstrationDetail } from "./DemonstrationDetail";
import { MockedProvider } from "@apollo/client/testing";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { demonstrationMocks } from "mock-data/demonstrationMocks";
import { documentMocks } from "mock-data/documentMocks";

// Combine both mock arrays
const combinedMocks = [...demonstrationMocks, ...documentMocks];

describe("Demonstration Detail", () => {
  it("renders the filter dropdown initially", async () => {
    render(
      <MemoryRouter initialEntries={["/demonstrations/1"]}>
        <MockedProvider mocks={combinedMocks} addTypename={false}>
          <Routes>
            <Route path="/demonstrations/:id" element={<DemonstrationDetail />} />
          </Routes>
        </MockedProvider>
      </MemoryRouter>
    );

    // Wait for both demonstration and documents to load
    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/choose column to filter/i)).toBeInTheDocument();
    });
  });

  it("renders all document titles initially", async () => {
    render(
      <MemoryRouter initialEntries={["/demonstrations/1"]}>
        <MockedProvider mocks={combinedMocks} addTypename={false}>
          <Routes>
            <Route path="/demonstrations/:id" element={<DemonstrationDetail />} />
          </Routes>
        </MockedProvider>
      </MemoryRouter>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    // Check that documents from your faker data are rendered
    await waitFor(() => {
      // These should match the titles in your faker_data/documents.json
      expect(screen.getByText(/Initial project planning document/i)).toBeInTheDocument();
      expect(screen.getByText(/Comprehensive final report/i)).toBeInTheDocument();
      expect(screen.getByText(/Q2 budget breakdown/i)).toBeInTheDocument();
    });
  });

  it("filters documents by upload date when 'Upload Date' filter is used", async () => {
    render(
      <MemoryRouter initialEntries={["/demonstrations/1"]}>
        <MockedProvider mocks={combinedMocks} addTypename={false}>
          <Routes>
            <Route path="/demonstrations/:id" element={<DemonstrationDetail />} />
          </Routes>
        </MockedProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/choose column to filter/i)).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/choose column to filter/i), ["uploadDate"]);

    // Wait for the date filter to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/filter date uploaded/i)).toBeInTheDocument();
    });

    const dateInput = screen.getByLabelText(/filter date uploaded/i);

    // Type a date matching documents from your faker data
    await user.type(dateInput, "2025-07-09");

    const table = screen.getByRole("table");

    // Should show only documents with that upload date
    await waitFor(() => {
      const rows = within(table).getAllByRole("row");
      // Should have header row plus filtered documents
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  it("shows no documents if filter matches none", async () => {
    render(
      <MemoryRouter initialEntries={["/demonstrations/1"]}>
        <MockedProvider mocks={combinedMocks} addTypename={false}>
          <Routes>
            <Route path="/demonstrations/:id" element={<DemonstrationDetail />} />
          </Routes>
        </MockedProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();

    // Wait for the component to load completely
    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    // Wait for the filter dropdown to be available
    await waitFor(() => {
      expect(screen.getByLabelText(/choose column to filter/i)).toBeInTheDocument();
    });

    // Select the "type" column from the dropdown
    await user.selectOptions(screen.getByLabelText(/choose column to filter/i), ["type"]);

    // Wait for the type filter input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/filter type/i)).toBeInTheDocument();
    });

    // Type a non-existent type in the input field
    const typeInput = screen.getByPlaceholderText(/filter type/i);
    await user.type(typeInput, "Budget Neutrality Workbook");
    await userEvent.click(screen.getByText("Budget Neutrality Workbook"));

    // Wait for the filter to be applied
    await waitFor(() => {
      expect(screen.getByText("No documents match your search criteria.")).toBeInTheDocument();
    });
  });
});
