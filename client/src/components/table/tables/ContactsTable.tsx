import React from "react";

import { CircleButton } from "components/button/CircleButton";
import { EditContactDialog } from "components/dialog/EditContactDialog";
import { RemoveContactDialog } from "components/dialog/RemoveContactDialog";
import { DeleteIcon, EditIcon, ImportIcon } from "components/icons";
import { useToast } from "components/toast";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { createSelectColumnDef } from "../columns/selectColumn";
import { PaginationControls } from "../PaginationControls";
import { TableHead } from "../Table";
import {
  Person,
  DemonstrationRoleAssignment as ServerDemonstrationRoleAssignment,
} from "demos-server";

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

function DocumentActionButtons({
  onEditContact,
  onDeleteContacts,
  hasSelectedContact,
  hasSelectedContacts,
}: {
  onEditContact: () => void;
  onDeleteContacts: () => void;
  hasSelectedContact: boolean;
  hasSelectedContacts: boolean;
}) {
  return (
    <div className="flex gap-2 ml-4">
      <CircleButton name="Add Contact" onClick={() => {}}>
        <ImportIcon />
      </CircleButton>
      <CircleButton name="Edit Contact" onClick={onEditContact} disabled={!hasSelectedContact}>
        <EditIcon />
      </CircleButton>
      <CircleButton
        name="Remove Contact"
        onClick={onDeleteContacts}
        disabled={!hasSelectedContacts}
      >
        <DeleteIcon />
      </CircleButton>
    </div>
  );
}

type ContactsTableProps = {
  roles: DemonstrationRoleAssignment[] | null;
  demonstrationId: string;
};

type ContactDialogMode = "edit" | "remove" | null;

export const ContactsTable: React.FC<ContactsTableProps> = ({ roles = [], demonstrationId }) => {
  const [rowSelection, setRowSelection] = React.useState({});
  const [dialogMode, setDialogMode] = React.useState<ContactDialogMode>(null);
  const [selectedContact, setSelectedContact] = React.useState<DemonstrationRoleAssignment | null>(
    null
  );
  const { showError } = useToast();

  const contactsTable = useReactTable<DemonstrationRoleAssignment>({
    data: roles || [],
    columns: contactsColumns,
    state: { rowSelection },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
  });

  const handleEditContact = () => {
    const selectedRows = contactsTable.getSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      showError("Please select a contact to edit");
      return;
    }

    if (selectedRows.length > 1) {
      showError("Please select one contact to edit");
      return;
    }

    const contactToEdit = selectedRows[0].original;
    setSelectedContact(contactToEdit);
    setDialogMode("edit");
  };

  const handleDeleteContacts = () => {
    const selectedRows = contactsTable.getSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      showError("Please select contacts to delete");
      return;
    }

    setDialogMode("remove");
  };

  const handleCloseDialog = () => {
    setDialogMode(null);
    setSelectedContact(null);
  };

  const selectedRows = contactsTable.getSelectedRowModel().rows;
  const selectedContacts = selectedRows.map((row) => row.original);
  const hasSelectedContact = selectedRows.length === 1;
  const hasSelectedContacts = selectedRows.length > 0;

  return (
    <>
      <div className="flex items-center justify-end mb-2">
        <div className="mr-1">
          <DocumentActionButtons
            onEditContact={handleEditContact}
            onDeleteContacts={handleDeleteContacts}
            hasSelectedContact={hasSelectedContact}
            hasSelectedContacts={hasSelectedContacts}
          />
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
                    {!value && cell.column.id !== "select" && cell.column.id !== "isPrimary"
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

      {/* Edit Contact Dialog */}
      {selectedContact && (
        <EditContactDialog
          isOpen={dialogMode === "edit"}
          onClose={handleCloseDialog}
          contact={selectedContact}
          demonstrationId={demonstrationId}
        />
      )}

      {/* Remove Contact Dialog */}
      <RemoveContactDialog
        isOpen={dialogMode === "remove"}
        onClose={handleCloseDialog}
        contacts={selectedContacts.map((contact) => ({
          ...contact,
          demonstration: { id: demonstrationId },
        }))}
      />
    </>
  );
};
