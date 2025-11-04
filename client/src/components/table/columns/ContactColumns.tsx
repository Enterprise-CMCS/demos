import * as React from "react";

import type { Role } from "demos-server";
import Switch from "react-switch";

import { createColumnHelper } from "@tanstack/react-table";

import { CircleButton } from "../../button/CircleButton";
import { DeleteIcon } from "../../icons";
import { Select } from "../../input/select/Select";

export { CONTACT_TYPES } from "demos-server-constants";

export type ContactType = Role;

export type ContactRow = {
  id?: string;
  personId: string;
  name: string;
  email: string;
  idmRoles?: string[];
  contactType?: ContactType;
  isPrimary?: boolean;
};

type ContactColumnsProps = {
  getFilteredContactTypeOptions: (idmRoles?: string[]) => Array<{ label: string; value: string }>;
  onContactTypeChange: (personId: string, value: ContactType) => void;
  onPrimaryToggle: (personId: string) => void;
  onRemoveContact: (personId: string) => void;
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
              options={getFilteredContactTypeOptions(contact.idmRoles)}
              placeholder="Select Type…"
              onSelect={(value) => {
                const typedValue = value as ContactType;
                onContactTypeChange(contact.personId, typedValue);
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
      cell: (info) => {
        const contact = info.row.original;
        return (
          <div className="inline-flex items-center justify-center">
            <Switch
              checked={!!contact.isPrimary}
              onChange={() => onPrimaryToggle(contact.personId)}
              onColor="#6B7280"
              offColor="#E5E7EB"
              checkedIcon={false}
              uncheckedIcon={false}
              height={18}
              width={40}
              handleDiameter={24}
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.6)"
              activeBoxShadow="0 0 2px 3px #3bf"
            />
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      size: 80,
      cell: (info) => {
        const contact = info.row.original;
        return (
          <div className="text-center">
            <CircleButton
              name="Delete Contact"
              size="small"
              onClick={() => onRemoveContact(contact.personId)}
              disabled={contact.contactType === "Project Officer" && contact.isPrimary}
            >
              <DeleteIcon
                width="15"
                height="15"
                fill={
                  contact.contactType === "Project Officer" && contact.isPrimary
                    ? "#9CA3AF"
                    : "#CD2026"
                }
              />
            </CircleButton>
          </div>
        );
      },
    }),
  ];
}
