import * as React from "react";

import {
  ChevronDownIcon,
  ChevronRightIcon,
} from "components/icons";

import { ColumnDef } from "@tanstack/react-table";

import { SecondaryButton } from "../../button/SecondaryButton";

export type DemonstrationColumns = {
  id: number;
  title: string;
  description: string;
  evalPeriodStartDate: string;
  evalPeriodEndDate: string;
  demonstrationStatusId: number;
  stateId: string;
  projectOfficer: string;
  demoNumber: string;
  createdAt: string;
  updatedAt: string;
};

const selectColumn: ColumnDef<DemonstrationColumns> = {
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

const dataColumns: ColumnDef<DemonstrationColumns>[] = [
  { header: "State/Territory", accessorKey: "stateId" },
  { header: "Number", accessorKey: "demoNumber" },
  { header: "Title", accessorKey: "title" },
  { header: "Project Officer", accessorKey: "projectOfficer" },
  {
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
    enableSorting: false,
  },
];

const expanderColumn: ColumnDef<DemonstrationColumns> = {
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

export const DemonstrationColumns: ColumnDef<DemonstrationColumns>[] = [
  selectColumn,
  ...dataColumns,
  expanderColumn,
];
