import React, { useCallback, useState } from "react";

import { CircleButton, SecondaryButton } from "components/button";
import { AmendmentDialog, EditDemonstrationDialog, ExtensionDialog } from "components/dialog";
import { AddNewIcon, ChevronLeftIcon, DeleteIcon, EditIcon, EllipsisIcon } from "components/icons";
import { Demonstration, Person, State } from "demos-server";
import { safeDateFormat } from "util/formatDate";
import { gql, useQuery } from "@apollo/client";

export const DEMONSTRATION_HEADER_DETAILS_QUERY = gql`
  query DemonstrationHeaderDetails($demonstrationId: ID!) {
    demonstration(id: $demonstrationId) {
      id
      name
      expirationDate
      effectiveDate
      status
      state {
        id
      }
      primaryProjectOfficer {
        id
        fullName
      }
    }
  }
`;

export type DemonstrationHeaderDetails = Pick<
  Demonstration,
  "id" | "name" | "expirationDate" | "effectiveDate" | "status"
> & {
  state: Pick<State, "id">;
  primaryProjectOfficer: Pick<Person, "id" | "fullName">;
};

interface DemonstrationDetailHeaderProps {
  demonstrationId: string;
}

export const DemonstrationDetailHeader: React.FC<DemonstrationDetailHeaderProps> = ({
  demonstrationId,
}) => {
  const [showButtons, setShowButtons] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalType, setModalType] = useState<"amendment" | "extension" | "edit" | "delete" | null>(
    null
  );
  const { data, loading, error } = useQuery<{
    demonstration: DemonstrationHeaderDetails;
  }>(DEMONSTRATION_HEADER_DETAILS_QUERY, {
    variables: { demonstrationId },
  });

  const handleToggleButtons = useCallback(() => {
    setShowButtons((prev) => !prev);
  }, []);

  const demonstration = data?.demonstration;
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
      value: demonstration.primaryProjectOfficer.fullName,
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
      <div className="flex items-start gap-2">
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
          <div className="flex gap-1 items-center -ml-2">
            <div>
              <SecondaryButton
                name="Back to demonstrations"
                onClick={() => (window.location.href = "/demonstrations")}
              >
                <ChevronLeftIcon width="28" height="20" />
              </SecondaryButton>
            </div>
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
        </div>
      </div>
      <div className="relative">
        {showButtons && (
          <span className="mr-0.75">
            <CircleButton
              name="Delete demonstration"
              data-testid="delete-button"
              onClick={() => setModalType("delete")}
            >
              <DeleteIcon width="24" height="24" />
            </CircleButton>
            <CircleButton
              name="Edit demonstration"
              data-testid="edit-button"
              onClick={() => setModalType("edit")}
            >
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
      {modalType === "edit" && (
        <EditDemonstrationDialog
          isOpen={true}
          onClose={() => setModalType(null)}
          demonstrationId={demonstration.id}
        />
      )}
      {modalType === "delete" && (
        <div>
          <p>Delete functionality not yet implemented</p>
        </div>
      )}
    </div>
  );
};
