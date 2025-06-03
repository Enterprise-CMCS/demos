// src/components/table/columns/DemonstrationColumns.ts
import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";

// Your existing data type for rows:
export type DemonstrationTable = {
  id: number;
  title: string;
  description: string;
  evalPeriodStartDate: string;
  evalPeriodEndDate: string;
  demonstrationStatusId: number;
  stateId: string;
  projectOfficer: string;
  demoNumber: string;        // ← Make sure this exists since you refer to it
  createdAt: string;
  updatedAt: string;
};

// Step 1: Build your “select” column first
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
  size: 20, // narrow column, just enough for a checkbox
};

// Step 2: Build your other columns (including the expander at the end)
export const DemonstrationColumns: ColumnDef<DemonstrationTable>[] = [
  selectColumn,
  { header: "State/Territory", accessorKey: "stateId" },
  { header: "Number", accessorKey: "demoNumber" },
  { header: "Title", accessorKey: "title" },
  { header: "Project Officer", accessorKey: "projectOfficer" },
  {
    id: "expander",
    header: () => null, // no header label
    cell: ({ row }) =>
      row.getCanExpand() ? (
        <span
          className="inline-block w-4 text-center select-none cursor-pointer"
          onClick={row.getToggleExpandedHandler()}
        >
          {row.getIsExpanded() ? "▼" : "►"}
        </span>
      ) : null,
    size: 20,
  },
];
