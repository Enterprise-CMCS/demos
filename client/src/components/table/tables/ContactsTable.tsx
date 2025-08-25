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

type ContactType =
  | "Primary Project Officer"
  | "Secondary Project Officer"
  | "State Representative"
  | "Subject Matter Expert";

export type Contact = {
  id: string;
  fullName?: string;
  email?: string;
  contactType?: ContactType;
};

const CreateContactModal: React.FC = () => {
  return <div>AddContactModal</div>;
};

const EditContactModal: React.FC = () => {
  return <div>AddContactModal</div>;
};

const DeleteContactModal: React.FC = () => {
  return <div>AddContactModal</div>;
};

const contactsColumnHelper = createColumnHelper<Contact>();
const contactsColumns = [
  contactsColumnHelper.display({
    id: "select",
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
  }),
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

type DisplayedModal = null | "add" | "edit" | "remove";

interface DocumentModalsProps {
  displayedModal: DisplayedModal;
  onClose: () => void;
  selectedContacts: Contact[];
}

function ContactModals({ displayedModal, selectedContacts }: DocumentModalsProps) {
  if (displayedModal === "add") {
    return <CreateContactModal />;
  }
  if (displayedModal === "edit" && selectedContacts.length === 1) {
    const selectedDoc = selectedContacts[0];

    if (!selectedDoc) return null;

    return <EditContactModal />;
  }
  if (displayedModal === "remove" && selectedContacts.length > 0) {
    return <DeleteContactModal />;
  }
  return null;
}

interface DocumentActionButtonsProps {
  onShowModal: (modal: DisplayedModal) => void;
  editDisabled: boolean;
  removeDisabled: boolean;
}

function DocumentActionButtons({
  onShowModal,
  editDisabled,
  removeDisabled,
}: DocumentActionButtonsProps) {
  return (
    <div className="flex gap-2 ml-4">
      <CircleButton name="Add Contact" onClick={() => onShowModal("add")}>
        <ImportIcon />
      </CircleButton>
      <CircleButton
        name="Edit Contact"
        onClick={() => !editDisabled && onShowModal("edit")}
        disabled={editDisabled}
      >
        <EditIcon />
      </CircleButton>
      <CircleButton
        name="Remove Contact"
        onClick={() => !removeDisabled && onShowModal("remove")}
        disabled={removeDisabled}
      >
        <DeleteIcon />
      </CircleButton>
    </div>
  );
}

type ContactsTableProps = {
  contacts: Contact[];
};

export const ContactsTable: React.FC<ContactsTableProps> = ({ contacts }) => {
  const [rowSelection, setRowSelection] = React.useState({});
  const [displayedModal, setDisplayedModal] = React.useState<DisplayedModal>(null);

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
          <DocumentActionButtons
            onShowModal={setDisplayedModal}
            editDisabled={contactsTable.getSelectedRowModel().rows.length !== 1}
            removeDisabled={contactsTable.getSelectedRowModel().rows.length < 1}
          />
        </div>
      </div>
      <table className="w-full table-fixed text-sm">
        <thead>
          {contactsTable.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="bg-gray-200">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-2 py-1 font-semibold text-left border-b cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{
                    asc: " ↑",
                    desc: " ↓",
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
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
                    {value === undefined || value === null || value === ""
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
      <ContactModals
        displayedModal={displayedModal}
        onClose={() => setDisplayedModal(null)}
        selectedContacts={contactsTable.getSelectedRowModel().rows.map((row) => row.original)}
      />
    </>
  );
};
