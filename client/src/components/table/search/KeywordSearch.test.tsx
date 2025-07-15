import React from "react";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { highlightText, Table } from "../Table";
import { Demonstration } from "pages/Demonstrations/Demonstrations";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { SecondaryButton } from "components/button";

const columnHelper = createColumnHelper<Demonstration>();

export const columns = [
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <input
        id="select-all-rows"
        type="checkbox"
        className="cursor-pointer"
        aria-label="Select all rows"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        id={`select-row-${row.id}`}
        type="checkbox"
        className="cursor-pointer"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        aria-label={`Select row ${row.index + 1}`}
      />
    ),
    size: 20,
  }),
  columnHelper.accessor("state.stateName", {
    id: "stateName",
    header: "State/Territory",
    cell: ({ row, table }) => {
      const value = row.getValue("stateName") as string;
      const searchQuery = table.getState().globalFilter || "";
      return highlightText(value, searchQuery);
    },
  }),
  columnHelper.accessor("name", {
    header: "Title",
    cell: ({ row, table }) => {
      const value = row.getValue("name") as string;
      const searchQuery = table.getState().globalFilter || "";
      return highlightText(value, searchQuery);
    },
  }),
  columnHelper.accessor("projectOfficer.fullName", {
    id: "projectOfficer",
    header: "Project Officer",
    cell: ({ row, table }) => {
      const value = row.getValue("projectOfficer") as string;
      const searchQuery = table.getState().globalFilter || "";
      return highlightText(value, searchQuery);
    },
  }),
  columnHelper.display({
    id: "viewDetails",
    cell: ({ row }) => {
      const handleClick = () => {
        const demoId = row.original.id;
        window.location.href = `/demonstrations/${demoId}`;
      };

      return (
        <SecondaryButton
          type="button"
          size="small"
          onClick={handleClick}
          className="px-2 py-0 text-sm font-medium"
        >
          View
        </SecondaryButton>
      );
    },
  }),
] as ColumnDef<Demonstration, unknown>[];

const mockRawData = [
  {
    id: "a",
    name: "Medicaid Montana Expenditure Cap Demonstration",
    description: "...",
    demonstrationStatus: {
      id: "d",
      name: "Active",
    },
    users: [{
      id: "g",
      fullName: "Luke Skywalker",
    }],
    state: {
      id: "MT",
      stateName: "Montana",
      stateCode: "MT",
    },
    projectOfficer: {
      id: "j",
      fullName: "Qui-Gon Jinn",
    },
  },
  {
    id: "b",
    name: "Medicaid Florida Reproductive Health: Fertility Demonstration",
    description: "...",
    demonstrationStatus: {
      id: "e",
      name: "Pending",
    },
    users: [{
      id: "h",
      fullName: "Darth Vader",
    }],
    state: {
      id: "NC",
      stateName: "North Carolina",
      stateCode: "NC",
    },
    projectOfficer: {
      id: "k",
      fullName: "Obi-Wan Kenobi",
    },
  },
  {
    id: "c",
    name: "Medicaid Alaska Delivery System Reform Incentive Payment (DSRIP) Demonstration",
    description: "...",
    demonstrationStatus: {
      id: "f",
      name: "Inactive",
    },
    users: [{
      id: "i",
      fullName: "Han Solo",
    }],
    state: {
      id: "WA",
      stateName: "Washington",
      stateCode: "WA",
    },
    projectOfficer: {
      id: "l",
      fullName: "Yoda",
    },
  },
] as Demonstration[];

describe("DemonstrationTable", () => {
  beforeEach(() => {
    localStorage.clear();
    render(
      <Table<Demonstration>
        keywordSearch
        columns={columns}
        data={mockRawData}
        noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
      />
    );
  });

  it("renders the keyword search input", () => {
    const keywordSearchInput = screen.getByLabelText(/Search:/i);

    expect(keywordSearchInput).toBeInTheDocument();
    expect(keywordSearchInput).toHaveValue("");
  });

  it("renders with search icon and no clear icon initially", () => {
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);
    const searchContainer = keywordSearchInput.closest("div");

    // Search icon should be present
    const searchIcon = (searchContainer as HTMLElement).querySelector("svg");
    expect(searchIcon).toBeInTheDocument();

    // Clear button should not be present initially
    const clearButton = screen.queryByLabelText(/clear search/i);
    expect(clearButton).not.toBeInTheDocument();
  });

  it("shows clear icon when text is typed and clears input when clicked", async () => {
    const user = userEvent.setup();
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);

    // Type in search input
    await user.type(keywordSearchInput, "Montana");

    // Clear button should now be visible
    const clearButton = screen.getByLabelText(/clear search/i);
    expect(clearButton).toBeInTheDocument();
    expect(keywordSearchInput).toHaveValue("Montana");

    // Click clear button
    await user.click(clearButton);

    // Input should be cleared and clear button should disappear
    expect(keywordSearchInput).toHaveValue("");
    expect(screen.queryByLabelText(/clear search/i)).not.toBeInTheDocument();
  });

  it("filters table content based on search string", async () => {
    const user = userEvent.setup();
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);

    // Type search term
    await user.type(keywordSearchInput, "Montana");

    // Wait for debounce (300ms + buffer)
    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
        })
      ).toBeInTheDocument();

      // Should not show other demonstrations
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "Medicaid Florida Reproductive Health: Fertility Demonstration";
        })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "Medicaid Alaska Delivery System Reform Incentive Payment (DSRIP) Demonstration";
        })
      ).not.toBeInTheDocument();
    }, { timeout: 500 });


  });

  it("filters table based on multiple keywords", async () => {
    const user = userEvent.setup();
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);

    // Type multiple keywords
    await user.type(keywordSearchInput, "Medicaid Florida");

    // Wait for debounce
    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Medicaid Florida Reproductive Health: Fertility Demonstration";
        })
      ).toBeInTheDocument();

      // Should not show demonstrations that don't contain both keywords
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
        })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "Medicaid Alaska Delivery System Reform Incentive Payment (DSRIP) Demonstration";
        })
      ).not.toBeInTheDocument();
    }, { timeout: 500 });


  });

  it("highlights matching text in search results", async () => {
    const user = userEvent.setup();
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);

    // Type search term
    await user.type(keywordSearchInput, "Expenditure");

    // Wait for debounce and highlighting to apply
    await waitFor(() => {
      const highlightedText = screen.getByText("Expenditure");
      expect(highlightedText.tagName.toLowerCase()).toBe("mark");
      expect(highlightedText).toHaveClass("bg-yellow-200", "font-semibold");

      // Verify the full text is still present (even if split across elements)
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
        })
      ).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it("maintains sorting regardless of search state", async () => {
    const user = userEvent.setup();

    // Click on Title column header to sort
    const titleHeader = screen.getByText("Title");
    await user.click(titleHeader);

    // Apply keyword search
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);
    await user.type(keywordSearchInput, "Medicaid");

    // Wait for debounce
    await waitFor(() => {
      const tableRows = screen.getAllByRole("row");
      const dataRows = tableRows.slice(1);

      // Extract titles from visible rows
      const visibleTitles = dataRows
        .map(row => {
          const titleCell = within(row).queryByText(/Medicaid.*Demonstration/);
          return titleCell?.textContent || "";
        })
        .filter(title => title.length > 0);

      // Verify titles are sorted alphabetically
      const sortedTitles = [...visibleTitles].sort();
      expect(visibleTitles).toEqual(sortedTitles);
    }, { timeout: 500 });

    // Clear search and verify sorting is maintained
    const clearButton = screen.getByLabelText(/clear search/i);
    await user.click(clearButton);

    const newTableRows = screen.getAllByRole("row");
    const newDataRows = newTableRows.slice(1);

    const allTitles = newDataRows
      .map(row => {
        const titleCell = within(row).queryByText(/Medicaid.*Demonstration/);
        return titleCell?.textContent || "";
      })
      .filter(title => title.length > 0);

    const allSortedTitles = [...allTitles].sort();
    expect(allTitles).toEqual(allSortedTitles);
  });

  it("renders the 'no results found' message for all demonstrations", async () => {
    const user = userEvent.setup();
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);
    await user.type(keywordSearchInput, "ZZZZZZZ");

    // Wait for debounce
    await waitFor(() => {
      expect(
        screen.getByText((content) =>
          content.includes("No results were returned. Adjust your search and filter criteria.")
        )
      ).toBeInTheDocument();
    }, { timeout: 500 });
  });
});
