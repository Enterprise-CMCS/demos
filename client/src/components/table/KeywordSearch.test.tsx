import React from "react";

import { beforeEach, describe, expect, it } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Table } from "./Table";
import { TestType, testTableData } from "./Table.test";
import { highlightCell, KeywordSearch, TEST_IDS } from "./KeywordSearch";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<TestType>();

export const testColumns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: highlightCell,
    enableGlobalFilter: false,
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: highlightCell,
  }),
  columnHelper.accessor("option.name", {
    header: "Option",
    cell: highlightCell,
  }),
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    enableGlobalFilter: false,
  }),
];

describe.sequential("KeywordSearch Component", () => {
  beforeEach(() => {
    render(
      <Table<TestType>
        keywordSearch={(table) => <KeywordSearch table={table} />}
        columns={testColumns}
        data={testTableData}
        noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
      />
    );
  });

  describe("Initial Render", () => {
    it("renders the keyword search input with correct label", () => {
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      expect(keywordSearchInput).toBeInTheDocument();
      expect(keywordSearchInput).toHaveValue("");
      expect(screen.getByText("Search:")).toBeInTheDocument();
    });

    it("renders with search icon and no clear icon initially", () => {
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);
      const searchContainer = keywordSearchInput.closest("div");

      // Search icon should be present
      const searchIcon = (searchContainer as HTMLElement).querySelector("svg");
      expect(searchIcon).toBeInTheDocument();

      // Clear button should not be present initially
      const clearButton = screen.queryByTestId(TEST_IDS.clearButton);
      expect(clearButton).not.toBeInTheDocument();
    });

    it("displays all table rows initially", () => {
      // All 5 items should be visible
      expect(screen.getByText("Item One")).toBeInTheDocument();
      expect(screen.getByText("Item Two")).toBeInTheDocument();
      expect(screen.getByText("Item Three")).toBeInTheDocument();
      expect(screen.getByText("Item Four")).toBeInTheDocument();
      expect(screen.getByText("Item Five")).toBeInTheDocument();
    });
  });

  describe("Input Interaction", () => {
    it("shows clear icon when text is typed", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      await user.type(keywordSearchInput, "unique");

      // Clear button should now be visible
      const clearButton = screen.getByTestId(TEST_IDS.clearButton);
      expect(clearButton).toBeInTheDocument();
      expect(keywordSearchInput).toHaveValue("unique");
    });

    it("clears input and removes clear icon when clear button is clicked", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      // Type in search input
      await user.type(keywordSearchInput, "unique");

      // Verify clear button appears
      const clearButton = screen.getByTestId(TEST_IDS.clearButton);
      expect(clearButton).toBeInTheDocument();

      // Click clear button
      await user.click(clearButton);

      // Input should be cleared and clear button should disappear
      expect(keywordSearchInput).toHaveValue("");
      expect(screen.queryByLabelText(/clear search/i)).not.toBeInTheDocument();
    });

    it("restores all rows when search is cleared", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      // Search for something specific
      await user.type(keywordSearchInput, "unique");

      // Wait for filtering
      await waitFor(() => {
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
      });

      // Clear search
      const clearButton = screen.getByTestId(TEST_IDS.clearButton);
      await user.click(clearButton);

      // All items should be visible again
      await waitFor(() => {
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(screen.getByText("Item Two")).toBeInTheDocument();
        expect(screen.getByText("Item Three")).toBeInTheDocument();
        expect(screen.getByText("Item Four")).toBeInTheDocument();
        expect(screen.getByText("Item Five")).toBeInTheDocument();
      });
    });
  });

  describe("Search Filtering", () => {
    it("filters table content based on single keyword in description", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      await user.type(keywordSearchInput, "unique");

      await waitFor(
        () => {
          // Should show Item One (has "unique" in description)
          expect(screen.getByText("Item One")).toBeInTheDocument();

          // Should not show other items
          expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it("filters table content based on option values", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      await user.type(keywordSearchInput, "Beta");

      await waitFor(
        () => {
          // Should show Item Two (has "Option Beta")
          expect(screen.getByText("Item Two")).toBeInTheDocument();

          // Should not show other items
          expect(screen.queryByText("Item One")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it("filters based on multiple keywords", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      await user.type(keywordSearchInput, "fourth Alpha");

      await waitFor(
        () => {
          // Should show Item Four (has "fourth" in description and "Alpha" in description)
          expect(screen.getByText("Item Four")).toBeInTheDocument();

          // Should not show other items
          expect(screen.queryByText("Item One")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it("shows multiple results when keyword matches multiple rows", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      await user.type(keywordSearchInput, "Alpha");

      await waitFor(
        () => {
          // Should show Item One, Item Four, and Item Five (all have "Alpha")
          expect(screen.getByText("Item One")).toBeInTheDocument();
          expect(screen.getByText("Item Four")).toBeInTheDocument();
          expect(screen.getByText("Item Five")).toBeInTheDocument();

          // Should not show Item Two and Item Three
          expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it("is case insensitive", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      await user.type(keywordSearchInput, "UNIQUE");

      await waitFor(
        () => {
          expect(screen.getByText("Item One")).toBeInTheDocument();
          expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it("handles partial word matches", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      await user.type(keywordSearchInput, "spec");

      await waitFor(
        () => {
          // Should show Item Three (has "special" in description)
          expect(screen.getByText("Item Three")).toBeInTheDocument();

          // Should not show other items
          expect(screen.queryByText("Item One")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });

  describe("Text Highlighting", () => {
    it("highlights matching text in search results", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      await user.type(keywordSearchInput, "unique");

      await waitFor(
        () => {
          const highlightedText = screen.getByText("unique");
          expect(highlightedText.tagName.toLowerCase()).toBe("mark");
          expect(highlightedText).toHaveClass("bg-yellow-200", "font-semibold");
        },
        { timeout: 500 }
      );
    });

    it("highlights multiple instances of the same keyword", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      await user.type(keywordSearchInput, "item");

      await waitFor(
        () => {
          const highlightedTexts = screen.getAllByText("item");
          expect(highlightedTexts.length).toBeGreaterThan(1);

          highlightedTexts.forEach((element) => {
            expect(element.tagName.toLowerCase()).toBe("mark");
            expect(element).toHaveClass("bg-yellow-200", "font-semibold");
          });
        },
        { timeout: 500 }
      );
    });

    it("highlights multiple different keywords", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      await user.type(keywordSearchInput, "fourth Alpha");

      await waitFor(
        () => {
          const fourthText = screen.getByText("fourth");
          const alphaText = screen.getByText("Alpha");

          expect(fourthText.tagName.toLowerCase()).toBe("mark");
          expect(alphaText.tagName.toLowerCase()).toBe("mark");

          expect(fourthText).toHaveClass("bg-yellow-200", "font-semibold");
          expect(alphaText).toHaveClass("bg-yellow-200", "font-semibold");
        },
        { timeout: 500 }
      );
    });
  });

  describe("No Results State", () => {
    it("shows no results message when search yields no matches", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      await user.type(keywordSearchInput, "nonexistent");

      await waitFor(
        () => {
          expect(
            screen.getByText("No results were returned. Adjust your search and filter criteria.")
          ).toBeInTheDocument();

          // No table rows should be visible
          expect(screen.queryByText("Item One")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it("returns to showing results when valid search is entered after no results", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      // First search with no results
      await user.type(keywordSearchInput, "nonexistent");

      await waitFor(() => {
        expect(
          screen.getByText("No results were returned. Adjust your search and filter criteria.")
        ).toBeInTheDocument();
      });

      // Clear and search for something that exists
      await user.clear(keywordSearchInput);
      await user.type(keywordSearchInput, "unique");

      await waitFor(
        () => {
          expect(screen.getByText("Item One")).toBeInTheDocument();
          expect(
            screen.queryByText("No results were returned. Adjust your search and filter criteria.")
          ).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });

  describe("Debouncing", () => {
    it("debounces search input to avoid excessive filtering", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(TEST_IDS.input);

      // Type quickly without waiting
      await user.type(keywordSearchInput, "u");
      await user.type(keywordSearchInput, "n");
      await user.type(keywordSearchInput, "i");
      await user.type(keywordSearchInput, "q");
      await user.type(keywordSearchInput, "u");
      await user.type(keywordSearchInput, "e");

      // Should still show all items initially (debounce hasn't fired)
      expect(screen.getByText("Item One")).toBeInTheDocument();
      expect(screen.getByText("Item Two")).toBeInTheDocument();

      // Wait for debounce to complete
      await waitFor(
        () => {
          expect(screen.getByText("Item One")).toBeInTheDocument();
          expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });
});
