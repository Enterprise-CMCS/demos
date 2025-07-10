import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SecondaryButton } from "../../button/SecondaryButton";
import { RawDemonstration } from "../tables/DemonstrationTable";

export const DemonstrationColumns: ColumnDef<RawDemonstration>[] = [
  {
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
  },
  {
    header: "State/Territory",
    accessorKey: "stateName",
  },
  {
    header: "Title",
    accessorKey: "title",
  },
  {
    header: "Project Officer",
    accessorKey: "projectOfficer",
  },
  {
    header: "Status",
    accessorKey: "status",
  },
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
