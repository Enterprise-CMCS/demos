import React from "react";

import { pickDateInCalendar } from "components/input/DatePicker/DatePicker.test";
import { ToastProvider } from "components/toast";
import { ALL_MOCKS } from "mock-data/index";
import { beforeEach, describe, expect, it } from "vitest";

import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DocumentTable } from "./DocumentTable";

describe("DocumentTable", () => {
  beforeEach(() => {
    localStorage.clear();
    render(
      <MockedProvider mocks={ALL_MOCKS} addTypename={false}>
        <ToastProvider>
          <DocumentTable />
        </ToastProvider>
      </MockedProvider>
    );
  });

  it("renders action buttons (add/edit)", async () => {
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Add Document/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Edit Document/i)).toBeInTheDocument();
  });

  it("opens AddDocumentModal when add button is clicked", async () => {
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/Add Document/i));
    expect(screen.getByText(/Add New Document/i)).toBeInTheDocument();
  });

  it("disables Edit button when no or multiple documents are selected, enables for one", async () => {
    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    const editBtn = screen.getByLabelText(/Edit Document/i);
    expect(editBtn).toBeDisabled();
    // Select one row
    await user.click(screen.getByText("Meeting Minutes"));
    expect(editBtn).not.toBeDisabled();
    // Select another row (should switch selection)
    await user.click(screen.getByText("Budget Summary"));
    expect(editBtn).toBeDisabled();
  });

  it("opens EditDocumentModal with correct documentId when edit button is clicked", async () => {
    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    // Select a row
    await user.click(screen.getByText("Budget Summary"));
    const editBtn = screen.getByLabelText(/Edit Document/i);
    await user.click(editBtn);
    // Modal should open, assuming it renders 'edit document' text
    expect(screen.getByText(/edit document/i)).toBeInTheDocument();
  });

  it("renders the filter dropdown initially", async () => {
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/filter by:/i)).toBeInTheDocument();
  });

  it("renders all document titles initially", async () => {
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    expect(screen.getByText("Meeting Minutes")).toBeInTheDocument();
    expect(screen.getByText("Budget Summary")).toBeInTheDocument();
    expect(screen.getByText("Final Report")).toBeInTheDocument();
    expect(screen.getByText("Project Plan")).toBeInTheDocument();
  });

  it("filters documents by upload date range when 'Upload Date' filter is used", async () => {
    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    // Select the createdAt filter column
    await user.selectOptions(screen.getByLabelText(/filter by:/i), ["createdAt"]);

    const startInput = document.body.querySelector('input[name="date-filter-start"]');
    const endInput = document.body.querySelector('input[name="date-filter-end"]');
    // Open the start date picker calendar popup by clicking the calendar button
    await pickDateInCalendar({
      datePickerRoot: startInput!.closest("[role='group']")!,
      year: 2025,
      month: 1,
      day: 1,
    });
    await pickDateInCalendar({
      datePickerRoot: endInput!.closest("[role='group']")!,
      year: 2025,
      month: 1,
      day: 2,
    });

    const table = screen.getByRole("table");
    // Should show only documents within the range (inclusive)
    expect(within(table).getByText("Final Report")).toBeInTheDocument();
    expect(within(table).getByText("Project Plan")).toBeInTheDocument();

    // Should NOT show documents outside the range
    expect(within(table).queryByText("Meeting Minutes")).toBeNull();
    expect(within(table).queryByText("Budget Summary")).toBeNull();
    // ...add other titles as needed
  });

  it("shows no documents if filter matches none", async () => {
    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByLabelText(/filter by:/i), ["type"]);

    const input = screen.getByPlaceholderText("Select Document Type");
    await user.type(input, "Q&A");

    // Find the list item containing "Other"
    const otherOption = screen.getByText("Q&A").closest("li");
    expect(otherOption).toBeInTheDocument();

    // Find the checkbox inside the "Other" option and click it
    const checkbox = within(otherOption!).getByRole("checkbox");
    await user.click(checkbox);

    const table = screen.getByRole("table");

    // No documents should appear
    expect(
      within(table).getByText("No results were returned. Adjust your search and filter criteria.")
    ).toBeInTheDocument();
  });

  it("defaults to sorting by createdAt descending (newest first)", async () => {
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    const rows = screen.getAllByRole("row").slice(1); // skip header

    const titles = rows.map((row) => {
      const cells = row.querySelectorAll("td");
      return cells[1]?.textContent?.trim() || "";
    });

    expect(titles).toEqual(["Meeting Minutes", "Budget Summary", "Final Report", "Project Plan"]);
  });

  describe("Keyword Search functionality", () => {
    it("shows a visible and accessible search bar", async () => {
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });
      const searchInput = screen.getByLabelText(/search:/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("allows typing keywords and returns matching documents immediately", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });
      const searchInput = screen.getByLabelText(/search:/i);

      await user.clear(searchInput);
      await user.type(searchInput, "July");
      await waitFor(() => {
        // Find all <mark> elements containing "July"
        const highlightedMarks = screen.getAllByText(
          (content, element) =>
            element!.tagName.toLowerCase() === "mark" && content.toLowerCase().includes("july")
        );
        expect(highlightedMarks.length).toBeGreaterThan(0);

        highlightedMarks.forEach((element) => {
          expect(element.tagName.toLowerCase()).toBe("mark");
          expect(element).toHaveClass("bg-yellow-200", "font-semibold");
        });
      });
    });

    it("matches keywords against all relevant columns", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });
      const searchInput = screen.getByLabelText(/search:/i);

      // Try a keyword that matches Description
      await user.clear(searchInput);
      await user.type(searchInput, "stakeholder");
      await waitFor(() => {
        expect(screen.getByText(/Meeting Minutes/i)).toBeInTheDocument();
      });

      // Try a keyword that matches Document Type
      await user.clear(searchInput);
      await user.type(searchInput, "general");
      await waitFor(() => {
        expect(screen.getByText(/Budget Summary/i)).toBeInTheDocument();
      });

      // Try a keyword that matches Uploaded By
      await user.clear(searchInput);
      await user.type(searchInput, "Alice Brown");
      await waitFor(() => {
        expect(screen.getByText(/Initial project planning document/i)).toBeInTheDocument();
      });
    });

    it("highlights keywords in search results", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });
      const searchInput = screen.getByLabelText(/search:/i);

      await user.clear(searchInput);
      await user.type(searchInput, "Plan");

      await waitFor(
        () => {
          // Find all <mark> elements containing "Plan"
          const highlightedTexts = screen.getAllByText("Plan");
          expect(highlightedTexts.length).toBeGreaterThan(0);

          highlightedTexts.forEach((element) => {
            expect(element.tagName.toLowerCase()).toBe("mark");
            // Optionally check for highlight classes if you use them
            expect(element).toHaveClass("bg-yellow-200", "font-semibold");
          });
        },
        { timeout: 500 }
      );
    });

    it("shows a 'no results found' message if no records match", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });
      const searchInput = screen.getByLabelText(/search:/i);

      await user.type(searchInput, "notarealkeyword");
      await waitFor(() => {
        expect(
          screen.getByText(/No results were returned. Adjust your search and filter criteria./i)
        ).toBeInTheDocument();
      });
    });

    it("shows a clear (X) icon and resets results when clicked", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });
      const searchInput = screen.getByLabelText(/search:/i);

      await user.type(searchInput, "stakeholder");

      await waitFor(() => {
        expect(screen.getByText(/Meeting Minutes/i)).toBeInTheDocument();
        expect(screen.queryByText(/Q2 budget breakdown/i)).not.toBeInTheDocument();
      });

      // Find and click the clear icon
      const clearButton = screen.getByRole("button", { name: /clear search/i });
      await user.click(clearButton);

      // Search input should be cleared and all documents visible again
      expect(searchInput).toHaveValue("");
      expect(screen.getByText(/Meeting Minutes/i)).toBeInTheDocument();
      expect(screen.getByText(/Q2 budget breakdown/i)).toBeInTheDocument();
    });

    it("restores previous sort settings after clearing search", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });

      // Sort by Document Type
      const typeHeader = screen.getByRole("columnheader", {
        name: /Document Type/i,
      });
      await user.click(typeHeader);

      let rows = screen.getAllByRole("row").slice(1);
      const beforeFilterTypes = rows.map(
        (row) => row.querySelectorAll("td")[2]?.textContent?.trim() || ""
      );

      // Apply search
      const searchInput = screen.getByLabelText(/search:/i);
      await user.type(searchInput, "Project");
      await waitFor(() => {
        expect(screen.getByText(/Initial project planning document/i)).toBeInTheDocument();
      });

      // Clear search
      const clearButton = screen.getByRole("button", { name: /clear search/i });
      await user.click(clearButton);

      // Table should still be sorted by Document Type
      rows = screen.getAllByRole("row").slice(1);
      const afterFilterTypes = rows.map(
        (row) => row.querySelectorAll("td")[2]?.textContent?.trim() || ""
      );
      expect(beforeFilterTypes).toEqual(afterFilterTypes);
    });

    it("shows default sort order after clearing search if no sort was applied", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText(/search:/i);
      await user.type(searchInput, "Report");
      await waitFor(() => {
        expect(screen.getByText(/Comprehensive final report/i)).toBeInTheDocument();
      });

      // Clear search
      const clearButton = screen.getByRole("button", { name: /clear search/i });
      await user.click(clearButton);

      // Table should be sorted by Date Uploaded descending
      const rows = screen.getAllByRole("row").slice(1);
      const titles = rows.map((row) => row.querySelectorAll("td")[1]?.textContent?.trim() || "");
      expect(titles).toEqual(["Meeting Minutes", "Budget Summary", "Final Report", "Project Plan"]);
    });
  });
});
