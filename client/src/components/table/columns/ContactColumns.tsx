import * as React from "react";

import type { Role } from "demos-server";
import Switch from "react-switch";

import { createColumnHelper } from "@tanstack/react-table";

import { CircleButton } from "../../button/CircleButton";
import { DeleteIcon } from "../../icons";
import { Select } from "../../input/select/Select";
import { useRef } from "react";
import { Tooltip } from "components/tooltip";

export { CONTACT_TYPES } from "demos-server-constants";

export type ContactType = Role;

export type ContactRow = {
  id: string;
  personId: string;
  name: string;
  email: string;
  idmRoles?: string[];
  contactType?: ContactType;
  isPrimary?: boolean;
};

type ContactColumnsProps = {
  getFilteredContactTypeOptions: (
    idmRoles?: string[],
    personId?: string,
    currentRowId?: string
  ) => Array<{ label: string; value: string }>;
  onContactTypeChange: (id: string, value: ContactType) => void;
  onPrimaryToggle: (id: string) => void;
  onRemoveContact: (id: string) => void;
};

type PrimaryToggleCellProps = { contact: ContactRow; onPrimaryToggle: (id: string) => void; };
function PrimaryToggleCell({
  contact,
  onPrimaryToggle,
}: PrimaryToggleCellProps) {
  const switchRef = useRef<HTMLDivElement>(null);
  const isReadonlyUser = contact.idmRoles?.includes("demos-restricted-cms-user");

  /*
    * Anchor Name must be sanitized because it is being generated something like "xyz-Project Officer-0"
    * Spaces are not valid in anchor names, so we replace them with hyphens.
    * The regex replaces any character that is not a letter, number, underscore, or hyphen with a hyphen.
  */
  const anchorName = `--readonly-anchor-${contact.id.replace(
    /[^a-zA-Z0-9_-]/g,
    "-"
  )}`;
  return (
    <div className="inline-flex items-center justify-center">
      <div ref={switchRef} className="inline-flex" style={{ anchorName }}>
        <Switch
          checked={!!contact.isPrimary}
          onChange={() => onPrimaryToggle(contact.id)}
          onColor="#6B7280"
          offColor="#E5E7EB"
          checkedIcon={false}
          uncheckedIcon={false}
          height={18}
          width={40}
          handleDiameter={24}
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.6)"
          activeBoxShadow="0 0 2px 3px #3bf"
          disabled={isReadonlyUser && !contact.isPrimary}
        />
      </div>
      {isReadonlyUser && !contact.isPrimary && (
        <Tooltip id={`readonly-tooltip-${contact.id}`} anchorName={anchorName} anchorRef={switchRef}>
          Restricted User Role
        </Tooltip>
      )}
    </div>
  );
};

export function ContactColumns({
  getFilteredContactTypeOptions,
  onContactTypeChange,
  onPrimaryToggle,
  onRemoveContact,
}: ContactColumnsProps) {
  const columnHelper = createColumnHelper<ContactRow>();

  return [
    columnHelper.accessor("name", {
      header: "Name",
      size: 180,
      cell: (info) => <div className="whitespace-pre-line text-sm">{info.getValue()}</div>,
    }),
    columnHelper.accessor("email", {
      header: "Email",
      size: 320,
      cell: (info) => (
        <div className="truncate text-gray-700 text-sm" title={info.getValue()}>
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("contactType", {
      header: "Contact Type",
      size: 320,
      cell: (info) => {
        const contact = info.row.original;
        const rowIndex = info.row.index;
        const isInvalid = !contact.contactType;
        return (
          <div className="w-full">
            <Select
              id={`contact-type-${rowIndex}`}
              value={contact.contactType}
              options={getFilteredContactTypeOptions(
                contact.idmRoles,
                contact.personId,
                contact.id
              )}
              placeholder="Select Type…"
              onSelect={(value) => {
                const typedValue = value as ContactType;
                onContactTypeChange(contact.id, typedValue);
              }}
              isRequired
              validationMessage={isInvalid ? "Contact Type is required" : ""}
            />
          </div>
        );
      },
    }),
    columnHelper.accessor("isPrimary", {
      header: "Primary",
      size: 100,
      cell: (info) => ( <PrimaryToggleCell contact={info.row.original} onPrimaryToggle={onPrimaryToggle} /> ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      size: 80,
      cell: (info) => {
        const contact = info.row.original;

        const isPrimaryProjectOfficer =
          contact.contactType === "Project Officer" && contact.isPrimary;

        const deleteDisabled = isPrimaryProjectOfficer;

        const deleteTooltip = isPrimaryProjectOfficer
          ? "Assign another Primary Project Officer to Delete"
          : "Delete";

        return (
          <div className="text-center">
            <CircleButton
              name="delete-contact"
              aria-label="Delete Contact"
              tooltip={deleteTooltip}
              size="small"
              onClick={() => onRemoveContact(contact.id)}
              disabled={deleteDisabled}
            >
              <DeleteIcon width="15" height="15" fill={deleteDisabled ? "#9CA3AF" : "#CD2026"} />
            </CircleButton>
          </div>
        );
      },
    }),
  ];
}
