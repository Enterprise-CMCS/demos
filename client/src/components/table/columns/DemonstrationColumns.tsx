// src/components/table/columns/DemonstrationColumns.ts
import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowRightIcon, ArrowDownIcon } from "components/icons";

export type DemonstrationTable = {
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

// 1) “Select” checkbox column
const selectColumn: ColumnDef<DemonstrationTable> = {
  id: "select",
  header: ({ table }) => (
    <input
      type="checkbox"
      className="cursor-pointer"
      checked={table.getIsAllPageRowsSelected()}
      onChange={table.getToggleAllPageRowsSelectedHandler()}
    />
  ),
  cell: ({ row }) => (
    <input
      type="checkbox"
      className="cursor-pointer"
      checked={row.getIsSelected()}
      onChange={row.getToggleSelectedHandler()}
    />
  ),
  size: 20,
};

// 2) Your data columns
const dataColumns: ColumnDef<DemonstrationTable>[] = [
  { header: "State/Territory", accessorKey: "stateId" },
  { header: "Number", accessorKey: "demoNumber" },
  { header: "Title", accessorKey: "title" },
  { header: "Project Officer", accessorKey: "projectOfficer" },
];

// 3) Expander column, using SVGs from components/icons
const expanderColumn: ColumnDef<DemonstrationTable> = {
  id: "expander",
  header: () => null,
  cell: ({ row }) =>
    row.getCanExpand() ? (
      <span
        className="inline-block select-none cursor-pointer"
        onClick={row.getToggleExpandedHandler()}
      >
        {row.getIsExpanded() ? (
          <ArrowDownIcon className="text-center w-2 h-2 text-gray-600" />
        ) : (
          <ArrowRightIcon className="text-center w-2 h-2 text-gray-600" />
        )}
      </span>
    ) : null,
  size: 20,
};

// 4) Export final array
export const DemonstrationColumns: ColumnDef<DemonstrationTable>[] = [
  selectColumn,
  ...dataColumns,
  expanderColumn,
];
