import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DemonstrationDetail } from "./DemonstrationDetail";
import { MockedProvider } from "@apollo/client/testing";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { GET_DEMONSTRATION_BY_ID_QUERY } from "queries/demonstrationQueries";
import { GET_ALL_DOCUMENTS_QUERY } from "hooks/useDocuments";
import documentData from "faker_data/documents.json";
import { testDemonstration } from "mock-data/demonstrationMocks";
import { GET_ALL_DOCUMENT_TYPES_QUERY } from "hooks/useDocumentType";

const demonstrationMocks = [
  {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: { demonstration: testDemonstration },
    },
  },
];

const documentMocks = [
  {
    request: {
      query: GET_ALL_DOCUMENTS_QUERY,
    },
    result: {
      data: {
        documents: documentData,
      },
    },
  },
];

const documentTypeMocks = [
  {
    request: {
      query: GET_ALL_DOCUMENT_TYPES_QUERY,
    },
    result: {
      data: {
        documentTypes: [
          { name: "Pre-Submission Concept" },
          { name: "General File" },
          {
            name: "Budget Neutrality Workbook",
          },
        ],
      },
    },
  },
];

// Combine both mock arrays
const combinedMocks = [
  ...demonstrationMocks,
  ...documentMocks,
  ...documentTypeMocks,
];

describe("Demonstration Detail", () => {
  it("renders the filter dropdown initially", async () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/demonstrations/1"]}>
          <MockedProvider mocks={combinedMocks} addTypename={false}>
            <Routes>
              <Route
                path="/demonstrations/:id"
                element={<DemonstrationDetail />}
              />
            </Routes>
          </MockedProvider>
        </MemoryRouter>
      </LocalizationProvider>
    );

    // Wait for both demonstration and documents to load
    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/filter by/i)).toBeInTheDocument();
    });
  });

  it("renders all document titles initially", async () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/demonstrations/1"]}>
          <MockedProvider mocks={combinedMocks} addTypename={false}>
            <Routes>
              <Route
                path="/demonstrations/:id"
                element={<DemonstrationDetail />}
              />
            </Routes>
          </MockedProvider>
        </MemoryRouter>
      </LocalizationProvider>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    // Check that documents from your faker data are rendered
    await waitFor(() => {
      // These should match the titles in your faker_data/documents.json
      expect(
        screen.getByText(/Initial project planning document/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Comprehensive final report/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Q2 budget breakdown/i)).toBeInTheDocument();
    });
  });

  it("filters documents by date when 'Date Uploaded' filter is used", async () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/demonstrations/1"]}>
          <MockedProvider mocks={combinedMocks} addTypename={false}>
            <Routes>
              <Route
                path="/demonstrations/:id"
                element={<DemonstrationDetail />}
              />
            </Routes>
          </MockedProvider>
        </MemoryRouter>
      </LocalizationProvider>
    );

    const user = userEvent.setup();

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/filter by/i)).toBeInTheDocument();
    });

    // Use the new interaction pattern for AutoCompleteSelect
    const columnSelect = screen.getByLabelText(/filter by/i);
    await user.clear(columnSelect);
    await user.type(columnSelect, "Date Uploaded");

    await waitFor(() => {
      const dropdownOptions = screen.getAllByText("Date Uploaded");
      const dropdownOption = dropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      expect(dropdownOption).toBeInTheDocument();
    });

    const dateUploadedDropdownOptions = screen.getAllByText("Date Uploaded");
    const dateUploadedDropdownOption = dateUploadedDropdownOptions.find(
      (el) => el.tagName === "LI" || el.closest("li")
    );
    await user.click(dateUploadedDropdownOption!);

    // Interact with the MUI DatePicker segments
    const monthInput = screen.getByLabelText("Month");
    const dayInput = screen.getByLabelText("Day");
    const yearInput = screen.getByLabelText("Year");

    // Enter date: 07/09/2025
    await user.click(monthInput);
    await user.type(monthInput, "07");

    await user.click(dayInput);
    await user.type(dayInput, "09");

    await user.click(yearInput);
    await user.type(yearInput, "2025");

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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/demonstrations/1"]}>
          <MockedProvider mocks={combinedMocks} addTypename={false}>
            <Routes>
              <Route
                path="/demonstrations/:id"
                element={<DemonstrationDetail />}
              />
            </Routes>
          </MockedProvider>
        </MemoryRouter>
      </LocalizationProvider>
    );

    const user = userEvent.setup();

    // Wait for the component to load completely
    await waitFor(() => {
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    // Wait for the filter dropdown to be available
    await waitFor(() => {
      expect(screen.getByLabelText(/filter by/i)).toBeInTheDocument();
    });

    // Use the new interaction pattern for AutoCompleteSelect
    const columnSelect = screen.getByLabelText(/filter by/i);
    await user.clear(columnSelect);
    await user.type(columnSelect, "Type");

    await waitFor(() => {
      const dropdownOptions = screen.getAllByText("Type");
      const dropdownOption = dropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      expect(dropdownOption).toBeInTheDocument();
    });

    const typeDropdownOptions = screen.getAllByText("Type");
    const typeDropdownOption = typeDropdownOptions.find(
      (el) => el.tagName === "LI" || el.closest("li")
    );
    await user.click(typeDropdownOption!);

    // Wait for the type filter input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/filter type/i)).toBeInTheDocument();
    });

    // Type a value that should exist but will filter out results
    const typeInput = screen.getByPlaceholderText(/filter type/i);
    await user.type(typeInput, "Budget Neutrality Workbook");

    await waitFor(() => {
      const budgetOptions = screen.getAllByText("Budget Neutrality Workbook");
      const budgetDropdownOption = budgetOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      expect(budgetDropdownOption).toBeInTheDocument();
    });

    const budgetOptions = screen.getAllByText("Budget Neutrality Workbook");
    const budgetDropdownOption = budgetOptions.find(
      (el) => el.tagName === "LI" || el.closest("li")
    );
    await user.click(budgetDropdownOption!);

    // Wait for the filter to be applied
    await waitFor(() => {
      expect(
        screen.getByText("No documents match your search criteria.")
      ).toBeInTheDocument();
    });
  });
});
