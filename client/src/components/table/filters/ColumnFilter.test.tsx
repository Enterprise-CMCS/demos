import React from "react";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { highlightCell, Table } from "../Table";
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

  it("filters rows correctly when using the dropdown and typing a filter value", async () => {
    render(<Table<Demonstration> columnFilter columns={columns} data={mockRawData} />);

    const user = userEvent.setup();

    const filterSelect = screen.getByLabelText(/filter by:/i);
    await user.selectOptions(filterSelect, ["stateName"]);

    const filterInput = screen.getByPlaceholderText(/type to filter/i);
    await user.type(filterInput, "North Carolina");

    expect(
      screen.getByText("Medicaid Florida Reproductive Health: Fertility Demonstration")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Medicaid Montana Expenditure Cap Demonstration")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Medicaid Alaska Delivery System Reform Incentive Payment (DSRIP) Demonstration")
    ).not.toBeInTheDocument();
  });

  it("renders the 'no results found' message when filter results return no demonstrations", async () => {
    render(
      <Table<Demonstration>
        columns={columns}
        data={mockRawData}
        columnFilter
        noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
      />
    );
    const user = userEvent.setup();

    const filterSelect = screen.getByLabelText(/filter by:/i);
    await user.selectOptions(filterSelect, ["name"]);

    const filterInput = screen.getByPlaceholderText(/type to filter/i);
    await user.type(filterInput, "ZZZZZZZ");

    expect(
      screen.getByText("No results were returned. Adjust your search and filter criteria.")
    ).toBeInTheDocument();
  });

  it("renders the filter dropdown without `expander` or `select` options", () => {
    render(
      <Table<Demonstration>
        columns={columns}
        data={mockRawData}
        columnFilter
      />
    );

    const filterSelect = screen.getByLabelText(/filter by:/i);

    const options = Array.from(
      filterSelect.querySelectorAll("option")
    ).map((opt) => opt.textContent);

    expect(options).not.toContain("expander");
    expect(options).not.toContain("select");
    expect(options).toContain("State/Territory");
    expect(options).toContain("Title");
    expect(options).toContain("Project Officer");
  });
});
