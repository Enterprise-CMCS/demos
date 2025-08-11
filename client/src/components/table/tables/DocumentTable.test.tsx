import React from "react";

import { pickDateInCalendar } from "components/input/DatePicker/DatePicker.test";
import { ToastProvider } from "components/toast";
import { ALL_MOCKS } from "mock-data/index";
import { beforeEach, describe, expect, it } from "vitest";

import { MockedProvider } from "@apollo/client/testing";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DocumentTable } from "./DocumentTable";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

describe("DocumentTable", () => {
  beforeEach(() => {
    render(
      <MockedProvider mocks={ALL_MOCKS} addTypename={false}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ToastProvider>
            <DocumentTable />
          </ToastProvider>
        </LocalizationProvider>
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
    await user.click(screen.getByText("Presentation Slides"));
    expect(editBtn).not.toBeDisabled();
    // Select another row (should switch selection)
    await user.click(screen.getByText("Legal Review"));
    expect(editBtn).toBeDisabled();
  });

  it("opens EditDocumentModal with correct documentId when edit button is clicked", async () => {
    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    // Select a row
    await user.click(screen.getByText("Feedback Summary"));
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
    expect(screen.getByText("Feedback Summary")).toBeInTheDocument();
    expect(screen.getByText("Presentation Slides")).toBeInTheDocument();
    expect(screen.getByText("Legal Review")).toBeInTheDocument();
    expect(screen.getByText("Contract Draft")).toBeInTheDocument();
    expect(screen.getByText("Timeline Overview")).toBeInTheDocument();
    expect(screen.getByText("Final Report")).toBeInTheDocument();
    expect(screen.getByText("Risk Assessment")).toBeInTheDocument();
    expect(screen.getByText("User Guide")).toBeInTheDocument();
    expect(screen.getByText("Technical Specification")).toBeInTheDocument();
    expect(screen.getByText("Test Plan")).toBeInTheDocument();
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
      month: 7,
      day: 8,
    });
    await pickDateInCalendar({
      datePickerRoot: endInput!.closest("[role='group']")!,
      year: 2025,
      month: 7,
      day: 10,
    });

    const table = screen.getByRole("table");
    // Should show only documents within the range (inclusive)
    expect(within(table).getByText("Final Report")).toBeInTheDocument(); // 2025-07-10
    expect(within(table).getByText("Risk Assessment")).toBeInTheDocument(); // 2025-07-09
    expect(within(table).getByText("User Guide")).toBeInTheDocument(); // 2025-07-08

    // Should NOT show documents outside the range
    expect(within(table).queryByText("Feedback Summary")).toBeNull();
    expect(within(table).queryByText("Presentation Slides")).toBeNull();
    // ...add other titles as needed
  });

  it("shows no documents if filter matches none", async () => {
    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByLabelText(/filter by:/i), ["type"]);

    const input = screen.getByPlaceholderText("Select Document Type");
    await user.type(input, "Other");

    // Find the list item containing "Other"
    const otherOption = screen.getByText("Other").closest("li");
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

    expect(titles).toEqual([
      "Feedback Summary",
      "Presentation Slides",
      "Legal Review",
      "Contract Draft",
      "Timeline Overview",
      "Final Report",
      "Risk Assessment",
      "User Guide",
      "Technical Specification",
      "Test Plan",
    ]);
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
      await user.type(searchInput, "Risk");
      await waitFor(() => {
        // Find all <mark> elements containing "Risk"
        const highlightedMarks = screen.getAllByText(
          (content, element) =>
            element!.tagName.toLowerCase() === "mark" && content.toLowerCase().includes("risk")
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
      await user.type(searchInput, "timeline");
      await waitFor(() => {
        expect(screen.getByText(/Timeline Overview/i)).toBeInTheDocument();
      });

      // Try a keyword that matches Document Type
      await user.clear(searchInput);
      await user.type(searchInput, "Specification");
      await waitFor(() => {
        expect(screen.getByText(/Technical Specification/i)).toBeInTheDocument();
      });

      // Try a keyword that matches Uploaded By
      await user.clear(searchInput);
      await user.type(searchInput, "admin");
      await waitFor(() => {
        expect(screen.getByText(/Legal Review/i)).toBeInTheDocument();
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

      await user.type(searchInput, "Test");
      await waitFor(() => {
        expect(screen.getByText(/Test Plan/i)).toBeInTheDocument();
      });

      // Find and click the clear icon
      const clearButton = screen.getByRole("button", { name: /clear search/i });
      await user.click(clearButton);

      // Search input should be cleared and all documents visible again
      expect(searchInput).toHaveValue("");
      expect(screen.getByText(/Feedback Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Plan/i)).toBeInTheDocument();
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
      await user.type(searchInput, "Plan");
      await waitFor(() => {
        expect(screen.getByText(/Test Plan/i)).toBeInTheDocument();
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
      await user.type(searchInput, "Guide");
      await waitFor(() => {
        expect(screen.getByText(/User Guide/i)).toBeInTheDocument();
      });

      // Clear search
      const clearButton = screen.getByRole("button", { name: /clear search/i });
      await user.click(clearButton);

      // Table should be sorted by Date Uploaded descending
      const rows = screen.getAllByRole("row").slice(1);
      const titles = rows.map((row) => row.querySelectorAll("td")[1]?.textContent?.trim() || "");
      expect(titles).toEqual([
        "Feedback Summary",
        "Presentation Slides",
        "Legal Review",
        "Contract Draft",
        "Timeline Overview",
        "Final Report",
        "Risk Assessment",
        "User Guide",
        "Technical Specification",
        "Test Plan",
      ]);
    });
  });
});
