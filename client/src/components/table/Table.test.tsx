import React from "react";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { highlightCell, Table } from "./Table";
import { SecondaryButton } from "components/button";
import { Demonstration } from "pages/Demonstrations/Demonstrations";

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
    cell: highlightCell,
  }),
  columnHelper.accessor("name", {
    header: "Title",
    cell: highlightCell,
  }),
  columnHelper.accessor("projectOfficer.fullName", {
    id: "projectOfficer",
    header: "Project Officer",
    cell: highlightCell,
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

  it("renders all demonstration titles initially", () => {
    render(<Table<Demonstration> columns={columns} data={mockRawData} />);

    expect(
      screen.getByText("Medicaid Montana Expenditure Cap Demonstration")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Medicaid Florida Reproductive Health: Fertility Demonstration")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Medicaid Alaska Delivery System Reform Incentive Payment (DSRIP) Demonstration")
    ).toBeInTheDocument();
  });

  it("renders the empty state message for all demonstrations when there is no data", () => {
    render(
      <Table<Demonstration>
        columns={columns}
        data={[]}
        emptyRowsMessage="No Demonstrations are tracked"
      />
    );

    expect(
      screen.getByText(/no demonstrations are tracked/i)
    ).toBeInTheDocument();
  });

  it("preserves existing filters when searching", async () => {
    render(
      <Table<Demonstration>
        columnFilter
        keywordSearch
        columns={columns}
        data={mockRawData}
      />
    );
    const user = userEvent.setup();

    // First apply a column filter
    const filterSelect = screen.getByLabelText(/filter by:/i);
    await user.selectOptions(filterSelect, ["stateName"]);

    const filterInput = screen.getByPlaceholderText(/type to filter/i);
    await user.type(filterInput, "Montana");

    // Verify filter is applied (only Montana demonstration visible)
    expect(
      screen.getByText((content, element) => {
        return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText((content, element) => {
        return element?.textContent === "Medicaid Florida Reproductive Health: Fertility Demonstration";
      })
    ).not.toBeInTheDocument();

    // Now add keyword search
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);
    await user.type(keywordSearchInput, "Medicaid");

    // Wait for debounce
    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
        })
      ).toBeInTheDocument();

      // Both filters should be active - still only Montana demonstration
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "Medicaid Florida Reproductive Health: Fertility Demonstration";
        })
      ).not.toBeInTheDocument();
    }, { timeout: 500 });

    // Verify the column filter input still has its value
    expect(filterInput).toHaveValue("Montana");
  });

  it("preserves existing search terms when applying a filter", async () => {
    render(
      <Table<Demonstration>
        columnFilter
        keywordSearch
        columns={columns}
        data={mockRawData}
      />
    );
    const user = userEvent.setup();

    // First apply a keyword search
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);
    await user.clear(keywordSearchInput); // Clear first
    await user.type(keywordSearchInput, "Medicaid");

    // Wait for debounce
    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Medicaid Florida Reproductive Health: Fertility Demonstration";
        })
      ).toBeInTheDocument();
    }, { timeout: 500 });

    // Now apply a column filter
    const filterSelect = screen.getByLabelText(/filter by:/i);
    await user.selectOptions(filterSelect, ["stateName"]);

    const filterInput = screen.getByPlaceholderText(/type to filter/i);
    await user.type(filterInput, "Montana");

    // Verify both filters are active - only Montana demonstration visible
    expect(
      screen.getByText((content, element) => {
        return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText((content, element) => {
        return element?.textContent === "Medicaid Florida Reproductive Health: Fertility Demonstration";
      })
    ).not.toBeInTheDocument();

    // Verify the keyword search input still has its value
    expect(keywordSearchInput).toHaveValue("Medicaid");
  });
});
