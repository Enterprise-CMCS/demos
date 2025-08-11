import React, {
  useCallback,
  useState,
} from "react";

import { CircleButton } from "components/button/CircleButton";
import {
  DeleteIcon,
  EditIcon,
  EllipsisIcon,
} from "components/icons";
import { Demonstration } from "demos-server";

export type DemonstrationHeaderDetails = {
  state: Pick<Demonstration["state"], "id">;
  projectOfficer: Pick<Demonstration["projectOfficer"], "fullName">;
  demonstrationStatus: Pick<Demonstration["demonstrationStatus"], "name">;
  effectiveDate: Demonstration["effectiveDate"];
  expirationDate: Demonstration["expirationDate"];
  id: Demonstration["id"];
  name: Demonstration["name"];
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
    { label: "Project Officer", value: demonstration.projectOfficer.fullName },
    { label: "Status", value: demonstration.demonstrationStatus.name },
    { label: "Effective", value: demonstration.effectiveDate },
    { label: "Expiration", value: demonstration.expirationDate },
  ];

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
                    {field.value instanceof Date
                      ? field.value.toLocaleDateString("en-US", {
                        timeZone: "UTC",
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                      })
                      : field.value}
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
              aria-label="Delete demonstration"
              className="cursor-pointer flex items-center gap-1 px-1 py-1 mr-0.75"
              data-testid="delete-button"
              onClick={handleDelete}
            >
              <DeleteIcon width="24" height="24" />
            </CircleButton>
            <CircleButton
              aria-label="Edit demonstration"
              className="cursor-pointer flex items-center gap-1 px-1 py-1"
              data-testid="edit-button"
              onClick={handleEdit}
            >
              <EditIcon width="24" height="24" />
            </CircleButton>
          </span>
        )}
        <CircleButton
          className="cursor-pointer flex items-center gap-1 px-1 py-1"
          aria-label="Toggle more options"
          data-testid="toggle-ellipsis-button"
          onClick={handleToggleButtons}
        >
          <span
            className={`transform transition-transform duration-200 ease-in-out ${showButtons ? "rotate-90" : "rotate-0"
            }`}
          >
            <EllipsisIcon width="24" height="24" />
          </span>
        </CircleButton>
      </div>
    </div>
  );
};
