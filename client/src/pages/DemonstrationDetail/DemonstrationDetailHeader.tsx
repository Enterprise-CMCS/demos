import React, { useCallback, useState } from "react";

import { CircleButton, SecondaryButton } from "components/button";
import { AddNewIcon, ChevronLeftIcon, DeleteIcon, EditIcon, EllipsisIcon } from "components/icons";
import { Demonstration, Person, State } from "demos-server";
import { formatDate } from "utils/formatDate";
import { gql, useQuery } from "@apollo/client";
import { Loading } from "components/loading/Loading";
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
  const { data, loading, error } = useQuery<{
    demonstration: DemonstrationHeaderDetails;
  }>(DEMONSTRATION_HEADER_DETAILS_QUERY, {
    variables: { demonstrationId },
  });
  const { showEditDemonstrationDialog, showCreateAmendmentDialog, showCreateExtensionDialog } =
    useDialog();

  const handleToggleButtons = useCallback(() => {
    setShowButtons((prev) => !prev);
  }, []);

  if (loading) {
    return <Loading />;
  }
  if (error || !data) {
    return <div>Error Loading Demonstration</div>;
  }

  const demonstration = data?.demonstration;

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
    <>
      <div className="flex flex-col gap-xs">
        <div className="text-sm">
          <a
            className="underline underline-offset-2 decoration-gray-400 decoration-1 decoration-opacity-40"
            href="/demonstrations"
          >
            Demonstration List
          </a>
          {">"} {demonstration.id}
        </div>
        <div className="flex gap-1 items-center">
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
                      <li className="text-sm" aria-hidden="true">
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
      <div>
        {showButtons && (
          <>
            <CircleButton
              name="Delete demonstration"
              data-testid="delete-button"
              onClick={() => {}}
            >
              <DeleteIcon className="w-[24px] h-[24px]" />
            </CircleButton>
            <CircleButton
              name="Edit demonstration"
              data-testid="edit-button"
              onClick={() => {
                setShowDropdown(false);
                showEditDemonstrationDialog(demonstrationId);
              }}
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
          </>
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
    </>
  );
};
