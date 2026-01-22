import React, { useCallback, useState } from "react";

import { CircleButton } from "components/button";
import { BaseButton } from "components/button/BaseButton";
import { AddNewIcon, ChevronLeftIcon, DeleteIcon, EditIcon, EllipsisIcon } from "components/icons";
import { Demonstration, Person, State } from "demos-server";
import { formatDate } from "util/formatDate";
import { gql, useQuery } from "@apollo/client";
import { useDialog } from "components/dialog/DialogContext";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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
      className="w-full bg-brand text-white px-4 flex items-center justify-between"
      data-testid="demonstration-detail-header"
    >
      <div className="flex items-start gap-2">
        <div>
          <span className="-ml-2 block text-[14px] mb-0.5">
            <a
              className="underline underline-offset-2 decoration-gray-400 decoration-1 decoration-opacity-40"
              href="/demonstrations"
            >
              Demonstration List
            </a>
            {/* \u00A0 is unicode for non-breaking space */}
            {"\u00A0 > \u00A0"} {demonstration.id}
          </span>
          <div className="flex gap-1 items-center -ml-2">
            <div>
              {/* Using w-10 and h-12 does not work b/c we are overriding matching sytles e.g. h-[40px] in BB */}
              <BaseButton
                name="Back to demonstrations"
                onClick={() => navigate("/demonstrations")}
                className="w-[48px] h-[60px] mt-[10px] bg-brand text-white hover:bg-white hover:text-brand border border-white mb-1"
              >
                {/* BaseButton is overriding the values of Chevron, span somehow negates it */}
                <span>
                  <ChevronLeftIcon height="14" width="14" />
                </span>
              </BaseButton>
            </div>
            <div>
              <span className="text-[18px] font-bold block mb-1.5">{demonstration.name}</span>
              <div>
                <ul
                  className="inline-flex flex-wrap items-center gap-1"
                  role="list"
                  data-testid="demonstration-attributes-list"
                >
                  {displayFields.map((field, index) => (
                    <React.Fragment key={field.label}>
                      <li className="text-[16px] mt-0.5">
                        <strong>{field.label}</strong>:{" "}
                        <span data-testid={`demonstration-${field.label}`}>{field.value}</span>
                      </li>
                      {index < displayFields.length - 1 && (
                        <li className="text-[16px] mt-0.5" aria-hidden="true">
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
      <div className="relative mt-4">
        {showButtons && (
          <span className="mr-0.75">
            <span>
              <CircleButton
                name="Delete demonstration"
                data-testid="delete-button"
                size="small"
                onClick={() => {}}
              >
                <DeleteIcon />
              </CircleButton>
              <CircleButton
                name="Edit demonstration"
                data-testid="edit-button"
                size="small"
                onClick={() => {
                  setShowDropdown(false);
                  showEditDemonstrationDialog(demonstrationId);
                }}
              >
                <EditIcon />
              </CircleButton>
              <CircleButton
                name="Create New"
                data-testid="create-new-button"
                size="small"
                onClick={() => setShowDropdown((prev) => !prev)}
              >
                <AddNewIcon />
              </CircleButton>
            </span>
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
          size="small"
          onClick={handleToggleButtons}
        >
          <span
            className={`transform transition-transform duration-200 ease-in-out ${
              showButtons ? "rotate-90" : "rotate-0"
            }`}
          >
            <EllipsisIcon />
          </span>
        </CircleButton>
      </div>
    </div>
  );
};
