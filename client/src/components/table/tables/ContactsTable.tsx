import React from "react";

import {
  DemonstrationRoleAssignment as ServerDemonstrationRoleAssignment,
  Person,
} from "demos-server";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { createSelectColumnDef } from "../columns/selectColumn";
import { PaginationControls } from "../PaginationControls";
import { TableHead } from "../Table";

export type DemonstrationRoleAssignment = Pick<
  ServerDemonstrationRoleAssignment,
  "role" | "isPrimary"
> & {
  person: Pick<Person, "id" | "fullName" | "email">;
};

const contactsColumnHelper = createColumnHelper<DemonstrationRoleAssignment>();
const contactsColumns = [
  createSelectColumnDef(contactsColumnHelper),
  contactsColumnHelper.accessor("person.fullName", {
    id: "fullName",
    header: "Name",
  }),
  contactsColumnHelper.accessor("person.email", {
    id: "email",
    header: "Email",
    sortingFn: "alphanumeric",
  }),
  contactsColumnHelper.accessor("role", {
    id: "contactType",
    header: "Contact Type",
  }),
  contactsColumnHelper.accessor("isPrimary", {
    id: "isPrimary",
    header: "Primary",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
];

type ContactsTableProps = {
  roles: DemonstrationRoleAssignment[] | null;
};

export const ContactsTable: React.FC<ContactsTableProps> = ({ roles = [] }) => {
  const table = useReactTable<DemonstrationRoleAssignment>({
    data: roles || [],
    columns: contactsColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <table className="w-full table-fixed text-sm">
        <TableHead headerGroups={table.getHeaderGroups()} />
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1 border-b">
                  {flexRender(cell.column.columnDef.cell, cell.getContext()) ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <PaginationControls table={table} />
    </>
  );
};
