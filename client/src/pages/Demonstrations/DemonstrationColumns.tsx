import React from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { SecondaryButton } from "components/button";
import { Demonstration } from "./Demonstrations";
import { highlightText } from "components/table/Table";

const columnHelper = createColumnHelper<Demonstration>();

export const demonstrationColumns = [
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
