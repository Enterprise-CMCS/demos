import React, { useCallback, useState } from "react";

import { CircleButton, IconButton } from "components/button";
import { AddNewIcon, ChevronLeftIcon, DeleteIcon, EditIcon, EllipsisIcon } from "components/icons";
import { Demonstration, Person, State } from "demos-server";
import { formatDate } from "util/formatDate";
import { gql, useQuery } from "@apollo/client";
import { useDialog } from "components/dialog/DialogContext";

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

  // Ensure this component is rendered inside a DialogProvider in your app;
  const { showEditDemonstrationDialog, showCreateAmendmentDialog, showCreateExtensionDialog } =
    useDialog();

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
        <span aria-label="loading">Loading demonstration...</span>
      </div>
    );
  }

  if (error || !demonstration) {
    return (
      <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between">
        Error Loading Demonstration
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
      value: demonstration.effectiveDate ? formatDate(demonstration.effectiveDate) : "--/--/----",
    },
    {
      label: "Expiration",
      value: demonstration.expirationDate ? formatDate(demonstration.expirationDate) : "--/--/----",
    },
  ];

  return (
    <div
      className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between"
      data-testid="demonstration-detail-header"
    >
      <div className="flex items-start gap-2">
        <div>
          <span className="-ml-2 block text-[12px] mb-0.5">
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
              <IconButton
                icon={<ChevronLeftIcon />}
                name="Back to demonstrations"
                onClick={() => (window.location.href = "/demonstrations")}
              />
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
                      <li className="text-[12px]">
                        <strong>{field.label}</strong>:{" "}
                        <span data-testid={`demonstration-${field.label}`}>{field.value}</span>
                      </li>
                      {index < displayFields.length - 1 && (
                        <li className="text-[12px]" aria-hidden="true">
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
              onClick={() => {}}
            >
              <DeleteIcon width="24" height="40" />
            </CircleButton>
            <CircleButton
              name="Edit demonstration"
              data-testid="edit-button"
              onClick={() => {
                setShowDropdown(false);
                showEditDemonstrationDialog(demonstrationId);
              }}
            >
              <EditIcon width="24" height="40" />
            </CircleButton>
            <CircleButton
              name="Create New"
              data-testid="create-new-button"
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              <AddNewIcon width="24" height="40" />
            </CircleButton>
            {showDropdown && (
              <div className="absolute w-[160px] bg-white text-black rounded-[6px] shadow-lg border z-20">
                <button
                  data-testid="button-create-new-amendment"
                  onClick={() => {
                    setShowDropdown(false);
                    showCreateAmendmentDialog(demonstrationId);
                  }}
                  className="w-full text-left px-1 py-[10px] hover:bg-gray-100"
                >
                  Amendment
                </button>
                <button
                  data-testid="button-create-new-extension"
                  onClick={() => {
                    setShowDropdown(false);
                    showCreateExtensionDialog(demonstrationId);
                  }}
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
            <EllipsisIcon width="24" height="40" />
          </span>
        </CircleButton>
      </div>
    </div>
  );
};
