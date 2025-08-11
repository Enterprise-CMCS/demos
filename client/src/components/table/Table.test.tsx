import React from "react";

import { describe, expect, it } from "vitest";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createColumnHelper } from "@tanstack/react-table";
import { Table } from "./Table";
import { highlightCell, KeywordSearch } from "./KeywordSearch";
import { ColumnFilter } from "./ColumnFilter";

type TestOptionType = {
  name: string;
};

export type TestType = {
  name: string;
  description: string;
  option: TestOptionType;
  date: Date;
};

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
    meta: {
      filterConfig: {
        filterType: "select",
        options: [
          { label: "Option Alpha", value: "Option Alpha" },
          { label: "Option Beta", value: "Option Beta" },
          { label: "Option Gamma", value: "Option Gamma" },
          { label: "Option Delta", value: "Option Delta" },
        ],
      },
    },
  }),
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    enableGlobalFilter: false,
    meta: {
      filterConfig: {
        filterType: "date",
      },
    },
  }),
];

export const testTableData: TestType[] = [
  {
    name: "Item One",
    description: "This is the first item with unique content",
    option: {
      name: "Option Alpha",
    },
    date: new Date("2023-01-01"),
  },
  {
    name: "Item Two",
    description: "This is the second item with different content",
    option: {
      name: "Option Beta",
    },
    date: new Date("2023-02-01"),
  },
  {
    name: "Item Three",
    description: "This is the third item with special keywords",
    option: {
      name: "Option Gamma",
    },
    date: new Date("2023-03-01"),
  },
  {
    name: "Item Four",
    description: "This is the fourth item with Alpha reference",
    option: {
      name: "Option Delta",
    },
    date: new Date("2023-04-01"),
  },
  {
    name: "Item Five",
    description: "This is the fifth item with common words",
    option: {
      name: "Option Alpha",
    },
    date: new Date("2023-05-01"),
  },
];

describe.sequential("Table Component Interactions", () => {
  describe("Basic Rendering", () => {
    it("renders all test items initially", () => {
      render(<Table<TestType> columns={testColumns} data={testTableData} />);

      expect(screen.getByText("Item One")).toBeInTheDocument();
      expect(screen.getByText("Item Two")).toBeInTheDocument();
      expect(screen.getByText("Item Three")).toBeInTheDocument();
      expect(screen.getByText("Item Four")).toBeInTheDocument();
      expect(screen.getByText("Item Five")).toBeInTheDocument();
    });

    it("renders the empty state message when there is no data", () => {
      render(
        <Table<TestType>
          columns={testColumns}
          data={[]}
          emptyRowsMessage="No items are available"
        />
      );

      expect(screen.getByText(/no items are available/i)).toBeInTheDocument();
    });
  });

  describe("Filter and Search Interactions", () => {
    it("preserves existing column filters when keyword searching", async () => {
      render(
        <Table<TestType>
          columnFilter={(table) => <ColumnFilter table={table} />}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columns={testColumns}
          data={testTableData}
        />
      );
      const user = userEvent.setup();

      // First apply a column filter for Option
      const columnSelect = screen.getByLabelText(/filter by:/i);
      await user.selectOptions(columnSelect, "Option");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/select option/i)).toBeInTheDocument();
      });

      const optionFilterInput = screen.getByPlaceholderText(/select option/i);
      await user.type(optionFilterInput, "Option Alpha");

      await waitFor(() => {
        const alphaOptions = screen.getAllByText("Option Alpha");
        const alphaDropdownOption = alphaOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(alphaDropdownOption).toBeInTheDocument();
      });

      const alphaOptions = screen.getAllByText("Option Alpha");
      const alphaDropdownOption = alphaOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(alphaDropdownOption!);

      // Verify filter is applied (only items with Option Alpha visible)
      await waitFor(() => {
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(screen.getByText("Item Five")).toBeInTheDocument();
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
      });

      // Now add keyword search
      const keywordSearchInput = screen.getByLabelText(/keyword search/i);
      await user.type(keywordSearchInput, "first");

      // Wait for debounce
      await waitFor(
        () => {
          // Should show only "Item One" (has "first" and "Option Alpha")
          expect(screen.getByText("Item One")).toBeInTheDocument();
          expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );

      // Verify the column filter input still has its value
      expect(optionFilterInput).toHaveValue("Option Alpha");
    });

    it("preserves existing keyword search when applying column filters", async () => {
      render(
        <Table<TestType>
          columnFilter={(table) => <ColumnFilter table={table} />}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columns={testColumns}
          data={testTableData}
        />
      );
      const user = userEvent.setup();

      // First apply a keyword search
      const keywordSearchInput = screen.getByLabelText(/keyword search/i);
      await user.clear(keywordSearchInput); // Clear any existing content
      await user.type(keywordSearchInput, "different");

      // Wait for debounce to apply search
      await waitFor(
        () => {
          // Should show only "Item Two" (contains "different")
          expect(screen.getByText("Item Two")).toBeInTheDocument();
          expect(screen.queryByText("Item One")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
          expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );

      // Now apply a column filter for Name
      const columnSelect = screen.getByLabelText(/filter by:/i);
      await user.selectOptions(columnSelect, "Name");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "Item Two");

      // Verify both filters are active - only Item Two visible (matches both filters)
      await waitFor(() => {
        expect(screen.getByText("Item Two")).toBeInTheDocument();
        expect(screen.queryByText("Item One")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
      });

      // Verify the keyword search input still has its value
      expect(keywordSearchInput).toHaveValue("different");
    });

    it("clears keyword search but preserves column filters when clearing keyword search", async () => {
      render(
        <Table<TestType>
          columnFilter={(table) => <ColumnFilter table={table} />}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columns={testColumns}
          data={testTableData}
        />
      );
      const user = userEvent.setup();

      // Apply keyword search first
      const keywordSearchInput = screen.getByLabelText(/keyword search/i);
      await user.clear(keywordSearchInput); // Clear any existing content
      await user.type(keywordSearchInput, "Alpha");

      // Apply column filter
      const columnSelect = screen.getByLabelText(/filter by:/i);
      await user.selectOptions(columnSelect, "Name");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "Item Four");

      // Verify filtered state - only Item Four should be visible (has "Alpha" and matches "Item Four")
      await waitFor(() => {
        expect(screen.getByText("Item Four")).toBeInTheDocument();
        expect(screen.queryByText("Item One")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
      });

      // Clear keyword search
      const clearButton = screen.getByLabelText(/clear search/i);
      await user.click(clearButton);

      // Verify keyword search is cleared but column filter is preserved
      await waitFor(() => {
        // Only Item Four should still be visible (column filter is still active)
        expect(screen.getByText("Item Four")).toBeInTheDocument();
        expect(screen.queryByText("Item One")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
      });

      // Verify keyword search is cleared
      expect(keywordSearchInput).toHaveValue("");

      // Verify column filter is still active
      expect(nameFilterInput).toHaveValue("Item Four");
    });

    it("clears column filter but preserves keyword search when column filter is manually cleared", async () => {
      render(
        <Table<TestType>
          columnFilter={(table) => <ColumnFilter table={table} />}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columns={testColumns}
          data={testTableData}
        />
      );
      const user = userEvent.setup();

      // Apply both filters
      const keywordSearchInput = screen.getByLabelText(/keyword search/i);
      await user.clear(keywordSearchInput);
      await user.type(keywordSearchInput, "Alpha");

      const columnSelect = screen.getByLabelText(/filter by:/i);
      await user.selectOptions(columnSelect, "Name");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.clear(nameFilterInput);
      await user.type(nameFilterInput, "Item Four");

      // Verify filtered state
      await waitFor(() => {
        expect(screen.getByText("Item Four")).toBeInTheDocument();
        expect(screen.queryByText("Item One")).not.toBeInTheDocument();
      });

      // Clear column filter by clearing the name filter input
      await user.clear(nameFilterInput);

      // Verify all items matching keyword search are visible again
      await waitFor(() => {
        // Should show Item One, Item Four, and Item Five (all contain "Alpha")
        // Item One: has "Option Alpha"
        // Item Four: description contains "Alpha reference"
        // Item Five: has "Option Alpha"
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(screen.getByText("Item Four")).toBeInTheDocument();
        expect(screen.getByText("Item Five")).toBeInTheDocument();

        // Should not show items that don't contain "Alpha"
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
      });

      // Verify keyword search is still active
      expect(keywordSearchInput).toHaveValue("Alpha");

      // Verify column filter is cleared
      expect(nameFilterInput).toHaveValue("");
    });
  });

  describe("Sorting Interactions", () => {
    it("maintains sorting when applying filters and search", async () => {
      render(
        <Table<TestType>
          columnFilter={(table) => <ColumnFilter table={table} />}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columns={testColumns}
          data={testTableData}
        />
      );
      const user = userEvent.setup();

      // Click on Name column header to sort
      const nameHeader = screen.getByRole("columnheader", { name: "Name" });
      await user.click(nameHeader);

      // Apply keyword search that returns multiple results
      const keywordSearchInput = screen.getByLabelText(/keyword search/i);
      await user.type(keywordSearchInput, "Item");

      // Wait for debounce and verify all items are still sorted
      await waitFor(
        () => {
          const tableRows = screen.getAllByRole("row");
          const dataRows = tableRows.slice(1); // Skip header row

          // Extract names from visible rows
          const visibleNames = dataRows
            .map((row) => {
              const nameCell = within(row).queryByText(/Item/);
              return nameCell?.textContent || "";
            })
            .filter((name) => name.length > 0);

          // Verify names are sorted alphabetically
          const sortedNames = [...visibleNames].sort();
          expect(visibleNames).toEqual(sortedNames);
        },
        { timeout: 500 }
      );

      // Apply column filter and verify sorting is maintained
      const columnSelect = screen.getByLabelText(/filter by:/i);
      await user.selectOptions(columnSelect, "Option");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/select option/i)).toBeInTheDocument();
      });

      const optionFilterInput = screen.getByPlaceholderText(/select option/i);
      await user.type(optionFilterInput, "Option Alpha");

      await waitFor(() => {
        const alphaOptions = screen.getAllByText("Option Alpha");
        const alphaDropdownOption = alphaOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(alphaDropdownOption).toBeInTheDocument();
      });

      const alphaOptions = screen.getAllByText("Option Alpha");
      const alphaDropdownOption = alphaOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(alphaDropdownOption!);

      // Verify filtered items are still sorted
      await waitFor(() => {
        const tableRows = screen.getAllByRole("row");
        const dataRows = tableRows.slice(1);

        const visibleNames = dataRows
          .map((row) => {
            const nameCell = within(row).queryByText(/Item/);
            return nameCell?.textContent || "";
          })
          .filter((name) => name.length > 0);

        // Should show "Item Five" and "Item One" in that order (alphabetical)
        expect(visibleNames).toEqual(["Item Five", "Item One"]);
      });
    });
  });

  describe("No Results State Interactions", () => {
    it("shows no results message when both filters yield no matches", async () => {
      render(
        <Table<TestType>
          columnFilter={(table) => <ColumnFilter table={table} />}
          keywordSearch={(table) => <KeywordSearch table={table} debounceMs={500} />}
          columns={testColumns}
          data={testTableData}
          noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
        />
      );
      const user = userEvent.setup();

      // Apply keyword search
      const keywordSearchInput = screen.getByLabelText(/keyword search/i);
      await user.type(keywordSearchInput, "nonexistent");

      // Apply column filter
      const columnSelect = screen.getByLabelText(/filter by:/i);
      await user.selectOptions(columnSelect, "Name");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "nonexistent");

      await waitFor(() => {
        expect(
          screen.getByText("No results were returned. Adjust your search and filter criteria.")
        ).toBeInTheDocument();

        // No table rows should be visible
        expect(screen.queryByText("Item One")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
      });
    });
  });
});
