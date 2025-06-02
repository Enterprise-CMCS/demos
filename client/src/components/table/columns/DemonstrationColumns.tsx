// src/components/table/columns/DemonstrationColumns.ts
import { ColumnDef } from "@tanstack/react-table";
import { parseISO, format } from "date-fns";

export type DemonstrationTable = {
  id: number;
  title: string;
  description: string;
  evalPeriodStartDate: string;
  evalPeriodEndDate: string;
  demonstrationStatusId: number;
  stateId: string;
  createdAt: string;
  updatedAt: string;
};

export const DemonstrationColumns: ColumnDef<DemonstrationTable>[] = [
  // if you wnat to reorder, you set it here.
  { header: "State", accessorKey: "stateId" },
  { header: "Number", accessorKey: "demoNumber" },
  { header: "Title", accessorKey: "title" },
  { header: "Project Officer", accessorKey: "projectOfficer" },
];
