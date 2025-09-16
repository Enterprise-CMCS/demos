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
import { EditContactDialog } from "components/dialog/EditContactDialog";
import { RemoveContactDialog } from "components/dialog/RemoveContactDialog";
import { useToast } from "components/toast";

type ContactType =
  | "Primary Project Officer"
  | "Secondary Project Officer"
  | "State Representative"
  | "Subject Matter Expert";

export type Contact = {
  id: string;
  fullName: string | null;
  email: string | null;
  contactType: ContactType | null;
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
  contacts?: Contact[];
  onUpdateContact?: (contactId: string, contactType: string) => Promise<void>;
  onDeleteContacts?: (contactIds: string[]) => Promise<void>;
};

export const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts = [],
  onUpdateContact,
  onDeleteContacts,
}) => {
  const [rowSelection, setRowSelection] = React.useState({});
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  const [selectedContactIds, setSelectedContactIds] = React.useState<string[]>([]);
  const { showError } = useToast();

  const contactsTable = useReactTable<Contact>({
    data: contacts || [],
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
    setIsEditDialogOpen(true);
  };

  const handleDeleteContacts = () => {
    const selectedRows = contactsTable.getSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      showError("Please select contacts to delete");
      return;
    }

    const contactIds = selectedRows.map((row) => row.original.id);
    setSelectedContactIds(contactIds);
    setIsRemoveDialogOpen(true);
  };

  const handleConfirmRemoveContacts = async (contactIds: string[]) => {
    if (onDeleteContacts) {
      onDeleteContacts(contactIds);
    } else {
      // TODO: Add actual API call here when available
      console.log("Deleting contacts:", contactIds);
    }
    setIsRemoveDialogOpen(false);
    setSelectedContactIds([]);
  };
  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedContact(null);
  };

  const handleSubmitContact = async (contactId: string, contactType: string) => {
    if (onUpdateContact) {
      await onUpdateContact(contactId, contactType);
    }
    // TODO: Add actual API call here when available
    console.log("Updating contact:", { contactId, contactType });
  };

  const selectedRows = contactsTable.getSelectedRowModel().rows;
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

      {/* Edit Contact Dialog */}
      {selectedContact && (
        <EditContactDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseDialog}
          contact={selectedContact}
          onSubmit={handleSubmitContact}
        />
      )}

      {/* Remove Contact Dialog */}
      <RemoveContactDialog
        isOpen={isRemoveDialogOpen}
        onClose={() => setIsRemoveDialogOpen(false)}
        onConfirm={handleConfirmRemoveContacts}
        contactIds={selectedContactIds}
      />
    </>
  );
};
