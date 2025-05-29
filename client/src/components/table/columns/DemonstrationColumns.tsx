// src/components/table/columns/DemonstrationColumns.ts
import { ColumnDef } from "@tanstack/react-table";
import { parseISO, format } from "date-fns";

export type DemonstrationTable = {
  id: number;
  name: string;
  description: string;
  eval_period_start_date: string;
  eval_period_end_date: string;
  demonstration_status_id: number;
  state_id: string;
  created_at: string;
  updated_at: string;
};

export const DemonstrationColumns: ColumnDef<DemonstrationTable>[] = [
  { header: "ID", accessorKey: "id" },
  { header: "Name", accessorKey: "name" },
  { header: "Description", accessorKey: "description" },
  {
    header: "Eval Start",
    accessorKey: "eval_period_start_date",
    cell: info => {
      const raw = info.getValue<string>();
      const dt = parseISO(raw);
      return isNaN(dt.getTime())
        ? raw
        : format(dt, "yyyy-MM-dd");
    },
  },
  {
    header: "Eval End",
    accessorKey: "eval_period_end_date",
    cell: info => {
      const raw = info.getValue<string>();
      const dt = parseISO(raw);
      return isNaN(dt.getTime())
        ? raw
        : format(dt, "yyyy-MM-dd");
    },
  },
  { header: "Status ID", accessorKey: "demonstration_status_id" },
  { header: "State", accessorKey: "state_id" },
  {
    header: "Created At",
    accessorKey: "created_at",
    cell: info => {
      const raw = info.getValue<string>();
      const dt = parseISO(raw);
      return isNaN(dt.getTime())
        ? raw
        : format(dt, "PP p");
    },
  },
  {
    header: "Updated At",
    accessorKey: "updated_at",
    cell: info => {
      const raw = info.getValue<string>();
      const dt = parseISO(raw);
      return isNaN(dt.getTime())
        ? raw
        : format(dt, "PP p");
    },
  },
];
