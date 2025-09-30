import React, { useCallback, useState } from "react";

import { CircleButton } from "components/button/CircleButton";
import { AmendmentDialog, ExtensionDialog } from "components/dialog";
import { AddNewIcon, DeleteIcon, EditIcon, EllipsisIcon } from "components/icons";
import { Demonstration, DemonstrationRoleAssignment, Person, State } from "demos-server";
import { formatDate } from "util/formatDate";

import { ApolloError } from "@apollo/client";

const safeDateFormat = (date: Date | string | null | undefined): string => {
  if (!date) return "--/--/----";

  try {
    if (typeof date === "string") {
      const datePart = date.split("T")[0];
      const [year, month, day] = datePart.split("-");
      return `${month}/${day}/${year}`;
    }

    if (date instanceof Date) {
      return formatDate(date);
    }

    return "--/--/----";
  } catch {
    return "--/--/----";
  }
};

export type DemonstrationHeaderDetails = Pick<
  Demonstration,
  "id" | "name" | "expirationDate" | "effectiveDate" | "status"
> & {
  state: Pick<State, "id">;
  roles: (Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
    person: Pick<Person, "fullName">;
  })[];
};

interface DemonstrationDetailHeaderProps {
  demonstration?: DemonstrationHeaderDetails;
  loading?: boolean;
  error?: ApolloError;
  onEdit: () => void;
  onDelete: () => void;
}

export const DemonstrationDetailHeader: React.FC<DemonstrationDetailHeaderProps> = ({
  demonstration,
  loading,
  error,
  onEdit,
  onDelete,
}) => {
  const [showButtons, setShowButtons] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalType, setModalType] = useState<"amendment" | "extension" | null>(null);

  const handleToggleButtons = useCallback(() => {
    setShowButtons((prev) => !prev);
  }, []);

  const handleEdit = useCallback(() => {
    onEdit();
  }, [onEdit]);

  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  if (loading) {
    return (
      <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between">
        Loading demonstration...
      </div>
    );
  }

  if (error || !demonstration) {
    return (
      <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between">
        Failed to load demonstration
      </div>
    );
  }

  const displayFields = [
    { label: "State/Territory", value: demonstration.state.id },
    {
      label: "Project Officer",
      value: (() => {
        const primaryProjectOfficer = demonstration.roles.find(
          (role) => role.role === "Project Officer" && role.isPrimary === true
        );

        if (!primaryProjectOfficer) {
          throw new Error(`No primary project officer found for demonstration ${demonstration.id}`);
        }

        return primaryProjectOfficer.person.fullName;
      })(),
    },
    { label: "Status", value: demonstration.status },
    {
      label: "Effective",
      value: safeDateFormat(demonstration.effectiveDate),
    },
    {
      label: "Expiration",
      value: safeDateFormat(demonstration.expirationDate),
    },
  ];

  const handleSelect = (item: string) => {
    setShowDropdown(false);
    if (item === "Amendment") setModalType("amendment");
    else if (item === "Extension") setModalType("extension");
  };

  return (
    <div
      className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between"
      data-testid="demonstration-detail-header"
    >
      <div>
        <span className="-ml-2 block text-sm mb-0.5">
          <a
            className="underline underline-offset-2 decoration-gray-400 decoration-1 decoration-opacity-40"
            href="/demonstrations"
          >
            Demonstration List
          </a>
          {">"} {demonstration.id}
        </span>
        <div>
          <div>
            <span className="font-bold block">{demonstration.name}</span>
          </div>

          <div>
            <ul
              className="inline-flex flex-wrap items-center gap-1"
              role="list"
              data-testid="demonstration-attributes-list"
            >
              {displayFields.map((field, index) => (
                <React.Fragment key={field.label}>
                  <li className="text-sm">
                    <strong>{field.label}</strong>:{" "}
                    <span data-testid={`demonstration-${field.label}`}>{field.value}</span>
                  </li>
                  {index < displayFields.length - 1 && (
                    <li className="text-sm mx-1" aria-hidden="true">
                      |
                    </li>
                  )}
                </React.Fragment>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="relative">
        {showButtons && (
          <span className="mr-0.75">
            <CircleButton
              name="Delete demonstration"
              data-testid="delete-button"
              onClick={handleDelete}
            >
              <DeleteIcon width="24" height="24" />
            </CircleButton>
            <CircleButton name="Edit demonstration" data-testid="edit-button" onClick={handleEdit}>
              <EditIcon width="24" height="24" />
            </CircleButton>
            <CircleButton
              name="Create New"
              data-testid="create-new-button"
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              <AddNewIcon width="24" height="24" />
            </CircleButton>
            {showDropdown && (
              <div className="absolute w-[160px] bg-white text-black rounded-[6px] shadow-lg border z-20">
                <button
                  data-testid="button-create-new-amendment"
                  onClick={() => handleSelect("Amendment")}
                  className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
                >
                  Amendment
                </button>
                <button
                  data-testid="button-create-new-extension"
                  onClick={() => handleSelect("Extension")}
                  className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
                >
                  Extension
                </button>
              </div>
            )}
          </span>
        )}
        <CircleButton
          name="Toggle more options"
          data-testid="toggle-ellipsis-button"
          onClick={handleToggleButtons}
        >
          <span
            className={`transform transition-transform duration-200 ease-in-out ${
              showButtons ? "rotate-90" : "rotate-0"
            }`}
          >
            <EllipsisIcon width="24" height="24" />
          </span>
        </CircleButton>
      </div>
      {modalType === "amendment" && (
        <AmendmentDialog
          mode="add"
          onClose={() => setModalType(null)}
          demonstrationId={demonstration.id}
        />
      )}
      {modalType === "extension" && (
        <ExtensionDialog
          mode="add"
          onClose={() => setModalType(null)}
          demonstrationId={demonstration.id}
        />
      )}
    </div>
  );
};
