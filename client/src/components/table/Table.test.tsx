import React from "react";

import { describe, expect, it } from "vitest";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createColumnHelper } from "@tanstack/react-table";
import { Table } from "./Table";
import { highlightCell, KeywordSearch } from "./KeywordSearch";
import { ColumnFilter } from "./ColumnFilter";
import { createSelectColumnDef } from "./columns/selectColumn";

export type TestTableType = {
  id: string;
  name: string;
  description: string;
  option: {
    name: string;
  };
  date: Date;
};

const columnHelper = createColumnHelper<TestTableType>();

export const testColumns = [
  createSelectColumnDef(columnHelper),
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

export const testTableData: TestTableType[] = [
  {
    id: "1",
    name: "Item One",
    description: "This is the first item with unique content",
    option: {
      name: "Option Alpha",
    },
    date: new Date(2023, 0, 1),
  },
  {
    id: "2",
    name: "Item Two",
    description: "This is the second item with different content",
    option: {
      name: "Option Beta",
    },
    date: new Date(2023, 1, 1),
  },
  {
    id: "3",
    name: "Item Three",
    description: "This is the third item with special keywords",
    option: {
      name: "Option Gamma",
    },
    date: new Date(2023, 2, 1),
  },
  {
    id: "4",
    name: "Item Four",
    description: "This is the fourth item with Alpha reference",
    option: {
      name: "Option Delta",
    },
    date: new Date(2023, 3, 1),
  },
  {
    id: "5",
    name: "Item Five",
    description: "This is the fifth item with common words",
    option: {
      name: "Option Alpha",
    },
    date: new Date(2023, 4, 1),
  },
];

describe("Table Component Interactions", () => {
  describe("Basic Rendering", () => {
    it("renders all test items initially", () => {
      render(<Table<TestTableType> columns={testColumns} data={testTableData} />);

      expect(screen.getByText("Item One")).toBeInTheDocument();
      expect(screen.getByText("Item Two")).toBeInTheDocument();
      expect(screen.getByText("Item Three")).toBeInTheDocument();
      expect(screen.getByText("Item Four")).toBeInTheDocument();
      expect(screen.getByText("Item Five")).toBeInTheDocument();
    });

    it("renders the empty state message when there is no data", () => {
      render(
        <Table<TestTableType>
          columns={testColumns}
          data={[]}
          emptyRowsMessage="No items are available"
        />
      );

      expect(screen.getByText(/no items are available/i)).toBeInTheDocument();
    });
  });

  describe("Sorting Interactions", () => {
    it("maintains sorting when applying filters and search", async () => {
      render(
        <Table<TestTableType>
          columnFilter={(table) => <ColumnFilter table={table} />}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columns={testColumns}
          data={testTableData}
        />
      );
      const user = userEvent.setup();

      // Click on Name column header to sort
      const nameHeader = screen.getByRole("columnheader", { name: "Name Sort" });
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
      const columnSelect = screen.getByTestId("filter-by-column");
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
            const cells = within(row).getAllByRole("cell");
            return cells[1]?.textContent || ""; // First cell is the Name column
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
        <Table<TestTableType>
          columnFilter={(table) => <ColumnFilter table={table} />}
          keywordSearch={(table) => <KeywordSearch table={table} />}
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
      const columnSelect = screen.getByTestId("filter-by-column");
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

  describe("Long Text Handling", () => {
    it("handles long continuous strings without breaking table layout", () => {
      const longTextData: TestTableType[] = [
        {
          id: "long1",
          name: "OneContinuousLongString.LastName@email.com",
          description: "Normal description",
          option: { name: "Option Alpha" },
          date: new Date(2023, 0, 1),
        },
      ];

      render(<Table columns={testColumns} data={longTextData} />);

      expect(screen.getByText("OneContinuousLongString.LastName@email.com")).toBeInTheDocument();

      // Verify table doesn't overflow its container horizontally
      const table = screen.getByRole("table");
      const tableRect = table.getBoundingClientRect();
      const containerRect = table.parentElement!.getBoundingClientRect();

      expect(tableRect.width).toBeLessThanOrEqual(containerRect.width);
    });
  });

  describe("row selection", () => {
    it("clears row selection whenever table data is updated", async () => {
      const mockTable = (data: TestTableType[]) => (
        <Table<TestTableType>
          columns={testColumns}
          data={data}
          actionButtons={(table) => {
            const selected = table.getSelectedRowModel().rows.map((r) => r.original);
            return (
              <div>
                <span data-testid="selected-count">{selected.length}</span>
              </div>
            );
          }}
        />
      );

      const user = userEvent.setup();

      const { rerender } = render(mockTable(testTableData));
      await user.click(screen.getByTestId("select-row-1"));
      expect(screen.getByTestId("selected-count")).toHaveTextContent("1");

      // sanity check to verify rerender preserves state normally
      rerender(mockTable(testTableData));
      expect(screen.getByTestId("selected-count")).toHaveTextContent("1");

      // simulated data change
      rerender(mockTable({ ...testTableData }));
      expect(screen.getByTestId("selected-count")).toHaveTextContent("0");
    });
  });
});
