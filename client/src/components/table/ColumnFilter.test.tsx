import React from "react";

import { beforeEach, describe, expect, it } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Table } from "./Table";
import { testTableData, TestType } from "./Table.test";
import { createColumnHelper } from "@tanstack/react-table";
import { ColumnFilter } from "./ColumnFilter";
import { isAfter, isBefore, isSameDay } from "date-fns";
import { formatDate } from "util/formatDate";

const columnHelper = createColumnHelper<TestType>();

export const testColumns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("description", {
    header: "Description",
    enableColumnFilter: false,
  }),
  columnHelper.accessor("option.name", {
    header: "Option",
    filterFn: "arrIncludesSome",
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
    cell: ({ getValue }) => {
      return formatDate(getValue());
    },
    meta: {
      filterConfig: {
        filterType: "date",
      },
    },
    filterFn: (row, columnId, filterValue) => {
      const date: Date = row.getValue(columnId);
      const { start, end } = filterValue || {};
      if (start && end) {
        return (
          isSameDay(date, start) ||
          isSameDay(date, end) ||
          (isAfter(date, start) && isBefore(date, end))
        );
      }
      if (start) {
        return isSameDay(date, start) || isAfter(date, start);
      }
      if (end) {
        return isSameDay(date, end) || isBefore(date, end);
      }
      return true;
    },
  }),
];

describe("ColumnFilter Component", () => {
  beforeEach(() => {
    localStorage.removeItem("keyword-search");
    render(
      <Table<TestType>
        columns={testColumns}
        data={testTableData}
        columnFilter={(table) => <ColumnFilter table={table} />}
        noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
      />
    );
  });

  describe("Initial Render", () => {
    it("renders the filter dropdown with correct label", () => {
      expect(screen.getByText(/filter by:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by:/i)).toBeInTheDocument();
    });

    it("displays all table rows initially", () => {
      // All 5 items should be visible
      expect(screen.getByText("Item One")).toBeInTheDocument();
      expect(screen.getByText("Item Two")).toBeInTheDocument();
      expect(screen.getByText("Item Three")).toBeInTheDocument();
      expect(screen.getByText("Item Four")).toBeInTheDocument();
      expect(screen.getByText("Item Five")).toBeInTheDocument();
    });

    it("does not show filter input initially", () => {
      // No filter input should be visible until a column is selected
      expect(screen.queryByPlaceholderText(/filter name/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Select Option/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/filter date/i)).not.toBeInTheDocument();
    });
  });

  describe("Filter Selection", () => {
    it("shows filter input when a column is selected", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      // Type to filter the options and then click on the option
      await user.selectOptions(columnSelect, "Name");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });
    });

    it("changes filter input type based on column selection", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      // Test text filter (Name column)
      await user.selectOptions(columnSelect, "Name");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      // Test select filter (Option column)
      await user.selectOptions(columnSelect, "Option");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Select Option/i)).toBeInTheDocument();
      });

      // Test date filter (Date column)
      await user.selectOptions(columnSelect, "Date");

      // Expect two date filter pickers (start and end)
      await waitFor(() => {
        expect(document.body.querySelector('input[name="date-filter-start"]')).toBeInTheDocument();
        expect(document.body.querySelector('input[name="date-filter-end"]')).toBeInTheDocument();
      });
    });

    it("clears filter value when changing columns", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      // Select name column and enter a filter
      await user.selectOptions(columnSelect, "Name");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "Item One");

      // Change to option column
      await user.selectOptions(columnSelect, "Option");

      await waitFor(() => {
        const optionFilterInput = screen.getByPlaceholderText(/Select Option/i);
        expect(optionFilterInput).toHaveValue("");
      });
    });
  });

  describe("Text Filtering", () => {
    it("filters rows correctly by name column", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.selectOptions(columnSelect, "Name");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "Item One");

      await waitFor(() => {
        // Should show only Item One
        expect(screen.getByText("Item One")).toBeInTheDocument();

        // Should not show other items
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Five")).not.toBeInTheDocument();
      });
    });

    it("is case insensitive", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.selectOptions(columnSelect, "Name");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "item one");

      await waitFor(() => {
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
      });
    });

    it("handles partial matches", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.selectOptions(columnSelect, "Name");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "Item");

      await waitFor(() => {
        // Should show all items since they all contain "Item"
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(screen.getByText("Item Two")).toBeInTheDocument();
        expect(screen.getByText("Item Three")).toBeInTheDocument();
        expect(screen.getByText("Item Four")).toBeInTheDocument();
        expect(screen.getByText("Item Five")).toBeInTheDocument();
      });
    });
  });

  describe("Select Filter Type", () => {
    it("renders AutoCompleteSelect when column has select filter type", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.selectOptions(columnSelect, "Option");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Select Option/i)).toBeInTheDocument();
      });
    });

    it("filters correctly using select filter", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.selectOptions(columnSelect, "Option");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Select Option/i)).toBeInTheDocument();
      });

      const optionFilterInput = screen.getByPlaceholderText(/Select Option/i);
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

      await waitFor(() => {
        // Should show items with Option Alpha (Item One and Item Five)
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(screen.getByText("Item Five")).toBeInTheDocument();

        // Should not show items with other options
        expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument();
        expect(screen.queryByText("Item Four")).not.toBeInTheDocument();
      });
    });
    it("filters table rows by multiple selected options in multiselect filter", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.selectOptions(columnSelect, "Option");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Select Option/i)).toBeInTheDocument();
      });

      const optionFilterInput = screen.getByPlaceholderText(/Select Option/i);
      await user.click(optionFilterInput);

      // Select "Option Alpha"
      await user.type(optionFilterInput, "Option Alpha");
      await waitFor(async () => {
        const alphaOptions = screen.getAllByText("Option Alpha");
        const alphaDropdownOption = alphaOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(alphaDropdownOption).toBeInTheDocument();
        await user.click(alphaDropdownOption!);
      });

      // Select "Option Beta"
      await user.clear(optionFilterInput);
      await user.type(optionFilterInput, "Option Beta");
      await waitFor(async () => {
        const betaOptions = screen.getAllByText("Option Beta");
        const betaDropdownOption = betaOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(betaDropdownOption).toBeInTheDocument();
        await user.click(betaDropdownOption!);
      });

      // Table should show rows with either "Option Alpha" or "Option Beta"
      await waitFor(() => {
        expect(screen.getByText("Item One")).toBeInTheDocument(); // Option Alpha
        expect(screen.getByText("Item Two")).toBeInTheDocument(); // Option Beta
        expect(screen.queryByText("Item Three")).not.toBeInTheDocument(); // Option Gamma
        expect(screen.queryByText("Item Four")).not.toBeInTheDocument(); // Option Delta
        expect(screen.getByText("Item Five")).toBeInTheDocument(); // Option Alpha
      });
    });

    it("allows clearing selections in a multiselect filter", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.selectOptions(columnSelect, "Option");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Select Option/i)).toBeInTheDocument();
      });

      const optionFilterInput = screen.getByPlaceholderText(/Select Option/i);
      await user.click(optionFilterInput);

      // Select "Option Alpha"
      await user.type(optionFilterInput, "Option Alpha");
      await waitFor(async () => {
        // Get all "Option Alpha" elements
        const alphaOptions = screen.getAllByText("Option Alpha");
        // Find the one inside a dropdown list item
        const alphaDropdownOption = alphaOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(alphaDropdownOption).toBeInTheDocument();
        // Click to select
        await user.click(alphaDropdownOption!);
      });

      // Unselect "Option Alpha"
      await waitFor(async () => {
        const alphaOptions = screen.getAllByText("Option Alpha");
        const alphaDropdownOption = alphaOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(alphaDropdownOption).toBeInTheDocument();
        await user.click(alphaDropdownOption!);
      });

      // Assert checkbox is unchecked
      await waitFor(() => {
        const alphaOptions = screen.getAllByText("Option Alpha");
        const alphaDropdownOption = alphaOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        const alphaCheckbox = alphaDropdownOption?.querySelector('input[type="checkbox"]');
        expect(alphaCheckbox).toHaveProperty("checked", false);
      });
    });
  });

  describe("Date Filter Type", () => {
    it("renders DatePicker when column has date filter type", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.selectOptions(columnSelect, "Date");

      await waitFor(() => {
        expect(document.body.querySelector('input[name="date-filter-start"]')).toBeInTheDocument();
        expect(document.body.querySelector('input[name="date-filter-end"]')).toBeInTheDocument();
      });
    });

    it("filters rows by date range", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      // Select the Date column
      await user.selectOptions(columnSelect, "Date");

      const startInput = document.body.querySelector('input[name="date-filter-start"]');
      const endInput = document.body.querySelector('input[name="date-filter-end"]');
      // Open the start date picker calendar popup by clicking the calendar button
      fireEvent.change(startInput!, { target: { value: "2023-02-01" } });
      fireEvent.change(endInput!, { target: { value: "2023-04-01" } });

      // Wait for the filtered results
      await waitFor(() => {
        // Should show only items with date between 2023-02-01 and 2023-04-01 (inclusive)
        expect(screen.getByText("Item Two")).toBeInTheDocument(); // 2023-02-01
        expect(screen.getByText("Item Three")).toBeInTheDocument(); // 2023-03-01
        expect(screen.getByText("Item Four")).toBeInTheDocument(); // 2023-04-01

        // Should not show items outside the range
        expect(screen.queryByText("Item One")).not.toBeInTheDocument(); // 2023-01-01
        expect(screen.queryByText("Item Five")).not.toBeInTheDocument(); // 2023-05-01
      });
    });

    it("shows no results for unmatched MM/dd/yyyy date", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.selectOptions(columnSelect, "Date");

      const startInput = document.body.querySelector('input[name="date-filter-start"]');
      const endInput = document.body.querySelector('input[name="date-filter-end"]');
      // Open the start date picker calendar popup by clicking the calendar button
      fireEvent.change(startInput!, { target: { value: "2000-01-01" } });
      fireEvent.change(endInput!, { target: { value: "2000-01-02" } });

      await waitFor(() => {
        expect(
          screen.getByText("No results were returned. Adjust your search and filter criteria.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("No Results State", () => {
    it("shows no results message when filter yields no matches", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.selectOptions(columnSelect, "Name");

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);
      await user.type(nameFilterInput, "NonexistentItem");

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

    it("returns to showing results when valid filter is applied after no results", async () => {
      const user = userEvent.setup();
      const columnSelect = screen.getByLabelText(/filter by:/i);

      await user.selectOptions(columnSelect, ["Name"]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/filter name/i)).toBeInTheDocument();
      });

      const nameFilterInput = screen.getByPlaceholderText(/filter name/i);

      // First filter with no results
      await user.type(nameFilterInput, "NonexistentItem");

      await waitFor(() => {
        expect(
          screen.getByText("No results were returned. Adjust your search and filter criteria.")
        ).toBeInTheDocument();
      });

      // Clear and filter for something that exists
      await user.clear(nameFilterInput);
      await user.type(nameFilterInput, "Item One");

      await waitFor(() => {
        expect(screen.getByText("Item One")).toBeInTheDocument();
        expect(
          screen.queryByText("No results were returned. Adjust your search and filter criteria.")
        ).not.toBeInTheDocument();
      });
    });
  });
});
