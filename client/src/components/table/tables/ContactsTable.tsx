import React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PaginationControls } from "../PaginationControls";
import { CircleButton } from "components/button/CircleButton";
import { DeleteIcon, EditIcon, ImportIcon } from "components/icons";
import { createSelectColumnDef } from "../columns/selectColumn";
import { TableHead } from "../Table";

type ContactType =
  | "Primary Project Officer"
  | "Secondary Project Officer"
  | "State Representative"
  | "Subject Matter Expert";

export type Contact = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  contactType?: ContactType | null;
};

const contactsColumnHelper = createColumnHelper<Contact>();
const contactsColumns = [
  createSelectColumnDef(contactsColumnHelper),
  contactsColumnHelper.accessor("fullName", {
    id: "fullName",
    header: "Name",
  }),
  contactsColumnHelper.accessor("email", {
    id: "email",
    header: "Email",
  }),
  contactsColumnHelper.accessor("contactType", {
    id: "contactType",
    header: "Contact Type",
  }),
];

function DocumentActionButtons() {
  return (
    <div className="flex gap-2 ml-4">
      <CircleButton name="Add Contact" onClick={() => {}}>
        <ImportIcon />
      </CircleButton>
      <CircleButton name="Edit Contact" onClick={() => {}}>
        <EditIcon />
      </CircleButton>
      <CircleButton name="Remove Contact" onClick={() => {}}>
        <DeleteIcon />
      </CircleButton>
    </div>
  );
}

type ContactsTableProps = {
  contacts?: Contact[];
};

export const ContactsTable: React.FC<ContactsTableProps> = ({ contacts = [] }) => {
  const [rowSelection, setRowSelection] = React.useState({});

  const contactsTable = useReactTable<Contact>({
    data: contacts || [],
    columns: contactsColumns,
    state: { rowSelection },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
  });

  return (
    <>
      <div className="flex items-center justify-end mb-2">
        <div className="mr-1">
          <DocumentActionButtons />
        </div>
      </div>
      <table className="w-full table-fixed text-sm">
        <TableHead headerGroups={contactsTable.getHeaderGroups()} />
        <tbody>
          {contactsTable.getRowModel().rows.map((row) => (
            <tr
              onClick={row.getToggleSelectedHandler()}
              key={row.id}
              className={row.depth > 0 ? "bg-gray-200" : ""}
            >
              {row.getVisibleCells().map((cell) => {
                const value = cell.getContext().getValue();
                return (
                  <td key={cell.id} className="px-2 py-1 border-b">
                    {!value && cell.column.id !== "select"
                      ? "-"
                      : flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationControls table={contactsTable} />
    </>
  );
};
