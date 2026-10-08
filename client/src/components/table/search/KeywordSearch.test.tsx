import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createColumnHelper } from "@tanstack/react-table";
import { Table } from "components/table";
import { TestTableType, testTableData, testColumns } from "components/table/Table.test";
import {
  highlightCell,
  KEYWORD_SEARCH_INPUT_NAME,
  KEYWORD_SEARCH_CLEAR_BUTTON_NAME,
  KeywordSearch,
} from "./KeywordSearch";

const TestTable = () => (
  <Table<TestTableType>
    keywordSearch={(table) => <KeywordSearch table={table} />}
    columns={testColumns}
    data={testTableData}
    noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
  />
);

/**
 * Assert that all provided text items are visible in the document
 */
function expectVisible(items: string[]) {
  items.forEach((item) => {
    expect(screen.getByText(item)).toBeInTheDocument();
  });
}

/**
 * Assert that all provided text items are hidden (not in the document)
 */
function expectHidden(items: string[]) {
  items.forEach((item) => {
    expect(screen.queryByText(item)).not.toBeInTheDocument();
  });
}

describe("KeywordSearch Component", () => {
  let unmount: () => void;

  beforeEach(() => {
    ({ unmount } = render(<TestTable />));
  });

  describe("Initial Render", () => {
    it("renders the keyword search input with correct label", () => {
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      expect(keywordSearchInput).toBeInTheDocument();
      expect(keywordSearchInput).toHaveValue("");
      expect(screen.getByText("Search:")).toBeInTheDocument();
    });

    it("renders with search icon and no clear icon initially", () => {
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);
      const searchContainer = keywordSearchInput.closest("div");

      // Search icon should be present
      const searchIcon = (searchContainer as HTMLElement).querySelector("svg");
      expect(searchIcon).toBeInTheDocument();

      // Clear button should not be present initially
      const clearButton = screen.queryByTestId(KEYWORD_SEARCH_CLEAR_BUTTON_NAME);
      expect(clearButton).not.toBeInTheDocument();
    });

    it("displays all table rows initially", () => {
      expectVisible(["Item One", "Item Two", "Item Three", "Item Four", "Item Five"]);
    });

    it("does not retain the search value after remounting", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      await user.type(keywordSearchInput, "unique");
      expect(keywordSearchInput).toHaveValue("unique");

      unmount();
      render(<TestTable />);

      expect(screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME)).toHaveValue("");
    });
  });

  describe("Input Interaction", () => {
    it("shows clear icon when text is typed", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      await user.type(keywordSearchInput, "unique");

      // Clear button should now be visible
      const clearButton = screen.getByTestId(KEYWORD_SEARCH_CLEAR_BUTTON_NAME);
      expect(clearButton).toBeInTheDocument();
      expect(keywordSearchInput).toHaveValue("unique");
    });

    it("clears input and removes clear icon when clear button is clicked", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      // Type in search input
      await user.type(keywordSearchInput, "unique");

      // Verify clear button appears
      const clearButton = screen.getByTestId(KEYWORD_SEARCH_CLEAR_BUTTON_NAME);
      expect(clearButton).toBeInTheDocument();

      // Click clear button
      await user.click(clearButton);

      // Input should be cleared and clear button should disappear
      expect(keywordSearchInput).toHaveValue("");
      expect(screen.queryByTestId(KEYWORD_SEARCH_CLEAR_BUTTON_NAME)).not.toBeInTheDocument();
    });

    it("restores all rows when search is cleared", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      // Search for something specific
      await user.type(keywordSearchInput, "unique");

      // Wait for filtering
      await waitFor(() => {
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
      });

      // Clear search
      const clearButton = screen.getByTestId(KEYWORD_SEARCH_CLEAR_BUTTON_NAME);
      await user.click(clearButton);

      // All items should be visible again
      await waitFor(() => {
        expectVisible(["Item One", "Item Two", "Item Three", "Item Four", "Item Five"]);
      });
    });
  });

  describe("Search Filtering", () => {
    it("filters table content based on single keyword in description", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      await user.type(keywordSearchInput, "unique");

      await waitFor(
        () => {
          expectVisible(["Item One"]);
          expectHidden(["Item Two", "Item Three", "Item Four", "Item Five"]);
        },
        { timeout: 500 }
      );
    });

    it("filters table content based on option values", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      await user.type(keywordSearchInput, "Beta");

      await waitFor(
        () => {
          expectVisible(["Item Two"]);
          expectHidden(["Item One", "Item Three", "Item Four", "Item Five"]);
        },
        { timeout: 500 }
      );
    });

    it("filters based on multiple keywords", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      await user.type(keywordSearchInput, "fourth Alpha");

      await waitFor(
        () => {
          expectVisible(["Item Four"]);
          expectHidden(["Item One", "Item Two", "Item Three", "Item Five"]);
        },
        { timeout: 500 }
      );
    });

    it("shows multiple results when keyword matches multiple rows", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      await user.type(keywordSearchInput, "Alpha");

      await waitFor(
        () => {
          expectVisible(["Item One", "Item Four", "Item Five"]);
          expectHidden(["Item Two", "Item Three"]);
        },
        { timeout: 500 }
      );
    });

    it("is case insensitive", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      await user.type(keywordSearchInput, "UNIQUE");

      await waitFor(
        () => {
          expectVisible(["Item One"]);
          expectHidden(["Item Two"]);
        },
        { timeout: 500 }
      );
    });

    it("handles partial word matches", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      await user.type(keywordSearchInput, "spec");

      await waitFor(
        () => {
          expectVisible(["Item Three"]);
          expectHidden(["Item One", "Item Two", "Item Four", "Item Five"]);
        },
        { timeout: 500 }
      );
    });
  });

  describe("Text Highlighting", () => {
    it("treats regular expression characters as literal search text", () => {
      const highlighted = highlightCell({
        cell: { getValue: () => "Example (draft)" },
        table: { getState: () => ({ globalFilter: ["("] }) },
      } as never);

      render(<>{highlighted}</>);

      expect(screen.getByText("(").tagName.toLowerCase()).toBe("mark");
    });

    it("highlights matching text in search results", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

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
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

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
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

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
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      await user.type(keywordSearchInput, "nonexistent");

      await waitFor(
        () => {
          expect(
            screen.getByText("No results were returned. Adjust your search and filter criteria.")
          ).toBeInTheDocument();

          // No table rows should be visible
          expectHidden(["Item One", "Item Two", "Item Three", "Item Four", "Item Five"]);
        },
        { timeout: 500 }
      );
    });

    it("returns to showing results when valid search is entered after no results", async () => {
      const user = userEvent.setup();
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

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
          expectVisible(["Item One"]);
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
      const keywordSearchInput = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      // Type quickly without waiting
      await user.type(keywordSearchInput, "u");
      await user.type(keywordSearchInput, "n");
      await user.type(keywordSearchInput, "i");
      await user.type(keywordSearchInput, "q");
      await user.type(keywordSearchInput, "u");
      await user.type(keywordSearchInput, "e");

      // Should still show all items initially (debounce hasn't fired)
      expectVisible(["Item One", "Item Two"]);

      // Wait for debounce to complete
      await waitFor(
        () => {
          expectVisible(["Item One"]);
          expectHidden(["Item Two"]);
        },
        { timeout: 500 }
      );
    });
  });

  describe("State Abbreviation Expansion", () => {
    type StateTableType = {
      id: string;
      state: string;
    };

    const stateTestData: StateTableType[] = [
      { id: "1", state: "Texas" },
      { id: "2", state: "Hawaii" },
      { id: "3", state: "Pennsylvania" },
      { id: "4", state: "New Mexico" },
    ];

    const buildStateTable = () => {
      const columnHelper = createColumnHelper<StateTableType>();
      const columns = [columnHelper.accessor("state", { header: "State", cell: highlightCell })];
      return (
        <Table<StateTableType>
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columns={columns}
          data={stateTestData}
          noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
        />
      );
    };

    const searchAndAssert = async (
      searchTerm: string,
      expectedVisible: string[],
      expectedHidden: string[]
    ) => {
      const user = userEvent.setup();
      unmount();
      render(buildStateTable());
      const input = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);
      await user.type(input, searchTerm);

      // Wait for filtering to apply - check both visible and hidden items
      await waitFor(
        () => {
          expectedVisible.forEach((item) => {
            expect(screen.getByText(item)).toBeInTheDocument();
          });

          // Verify hidden items by checking they're not in any data row (skip header row)
          const allRows = screen.getAllByRole("row");
          const dataRows = allRows.slice(1); // Skip header row
          const visibleRowText = dataRows.map((row) => row.textContent).join(" ");
          expectedHidden.forEach((item) => {
            expect(visibleRowText).not.toContain(item);
          });
        },
        { timeout: 1000 }
      );
    };

    it("filters by state abbreviation (TX matches Texas)", async () => {
      await searchAndAssert("TX", ["Texas"], ["Hawaii", "Pennsylvania", "New Mexico"]);
    });

    it("filters by full state name", async () => {
      await searchAndAssert("Texas", ["Texas"], ["Hawaii"]);
    });

    it("filters case-insensitively", async () => {
      await searchAndAssert("tx", ["Texas"], ["Hawaii"]);
    });

    it("filters multi-word states by abbreviation (NM matches New Mexico)", async () => {
      await searchAndAssert("NM", ["New Mexico"], ["Texas"]);
    });

    it("highlights abbreviation in state name", () => {
      const highlighted = highlightCell({
        cell: { getValue: () => "Texas" },
        table: { getState: () => ({ globalFilter: ["TX"] }) },
      } as never);

      const { container } = render(<>{highlighted}</>);
      const marks = container.querySelectorAll("mark");
      expect(marks.length).toBeGreaterThan(0);
    });

    it("restores all results when search is cleared", async () => {
      const user = userEvent.setup();
      unmount();
      render(buildStateTable());
      const input = screen.getByTestId(KEYWORD_SEARCH_INPUT_NAME);

      await user.type(input, "TX");
      await waitFor(() => expect(screen.getByText("Texas")).toBeInTheDocument());

      await user.click(screen.getByTestId(KEYWORD_SEARCH_CLEAR_BUTTON_NAME));
      await waitFor(() => {
        expect(screen.getByText("Texas")).toBeInTheDocument();
        expect(screen.getByText("Hawaii")).toBeInTheDocument();
        expect(screen.getByText("Pennsylvania")).toBeInTheDocument();
        expect(screen.getByText("New Mexico")).toBeInTheDocument();
      });
    });

    it("finds states by abbreviation (PA matches Pennsylvania)", async () => {
      await searchAndAssert("PA", ["Pennsylvania"], ["Texas"]);
    });

    it("finds states by abbreviation (HI matches Hawaii)", async () => {
      await searchAndAssert("HI", ["Hawaii"], ["Texas"]);
    });
  });
});
