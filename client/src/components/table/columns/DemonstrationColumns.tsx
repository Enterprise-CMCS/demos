// src/components/table/columns/DemonstrationColumns.ts
import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowRightIcon, ArrowDownIcon } from "components/icons";

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

const dataColumns: ColumnDef<DemonstrationColumns>[] = [
  { header: "State/Territory", accessorKey: "stateId" },
  { header: "Number", accessorKey: "demoNumber" },
  { header: "Title", accessorKey: "title" },
  { header: "Project Officer", accessorKey: "projectOfficer" },
];

const expanderColumn: ColumnDef<DemonstrationColumns> = {
  id: "expander",
  header: () => null,
  cell: ({ row }) =>
    row.getCanExpand() ? (
      <span
        aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
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

export const DemonstrationColumns: ColumnDef<DemonstrationColumns>[] = [
  selectColumn,
  ...dataColumns,
  expanderColumn,
];
