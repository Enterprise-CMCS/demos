import * as React from "react";

import {
  ChevronDownIcon,
  ChevronRightIcon,
} from "components/icons";

import { ColumnDef } from "@tanstack/react-table";
import { highlightText } from "../search/KeywordSearch";
import { SecondaryButton } from "../../button/SecondaryButton";
import { RawDemonstration } from "../../../pages/Demonstrations";

const selectColumn: ColumnDef<RawDemonstration> = {
  id: "Select",
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
};

const dataColumns: ColumnDef<RawDemonstration>[] = [
  {
    header: "State/Territory",
    accessorKey: "stateId",
    cell: ({ row, table }) => {
      const value = row.getValue("stateId") as string;
      const searchQuery = table.getState().globalFilter || "";
      return highlightText(value, searchQuery);
    },
  },
  // ticket says this should be not searchable, though i feel like it should be.
  // { header: "Number", accessorKey: "demoNumber", enableGlobalFilter: false },
  {
    header: "Title",
    accessorKey: "title",
    cell: ({ row, table }) => {
      const value = row.getValue("title") as string;
      const searchQuery = table.getState().globalFilter || "";
      return highlightText(value, searchQuery);
    },
  },
  {
    header: "Project Officer",
    accessorKey: "projectOfficer",
    cell: ({ row, table }) => {
      const value = row.getValue("projectOfficer") as string;
      const searchQuery = table.getState().globalFilter || "";
      return highlightText(value, searchQuery);
    },
  },
  {
    header: "Status",
    accessorKey: "demonstrationStatus",
    cell: ({ row, table }) => {
      const statusObj = row.getValue("demonstrationStatus") as { name: string };
      const value = statusObj?.name || "";
      const searchQuery = table.getState().globalFilter || "";
      return highlightText(value, searchQuery);
    },
  },
  {
    id: "viewDetails",
    enableGlobalFilter: false,
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
    enableSorting: false,
  },
];

const expanderColumn: ColumnDef<RawDemonstration> = {
  id: "expander",
  header: () => null,
  cell: ({ row }) =>
    row.getCanExpand() ? (
      <button
        type="button"
        aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
        aria-expanded={row.getIsExpanded()}
        aria-controls={`row-details-${row.id}`}
        className="inline-block select-none cursor-pointer"
        onClick={row.getToggleExpandedHandler()}
        tabIndex={0}
      >
        {row.getIsExpanded() ? (
          <ChevronDownIcon className="text-center w-2 h-2 text-brand" />
        ) : (
          <ChevronRightIcon className="text-center w-2 h-2 text-brand" />
        )}
      </button>
    ) : null,
  size: 20,
};

export const DemonstrationColumns: ColumnDef<RawDemonstration>[] = [
  selectColumn,
  ...dataColumns,
  expanderColumn,
];
