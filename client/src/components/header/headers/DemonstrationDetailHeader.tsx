import React, { useState, useCallback } from "react";
import { CircleButton } from "components/button/CircleButton";
import { DeleteIcon, EditIcon, EllipsisIcon } from "components/icons";
import { ApolloError } from "@apollo/client";

type DemonstrationDetails = {
  id: string;
  name: string;
  state: { id: string };
  projectOfficer: { fullName: string };
};

interface DemonstrationDetailHeaderProps {
  data?: DemonstrationDetails;
  loading?: boolean;
  error?: ApolloError;
  onEdit: () => void;
  onDelete: () => void;
}

export const DemonstrationDetailHeader: React.FC<
  DemonstrationDetailHeaderProps
> = ({ data, loading, error, onEdit, onDelete }) => {
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

  if (error || !data) {
    return (
      <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between">
        Failed to load demonstration
      </div>
    );
  }

  return (
    <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between">
      <div>
        <span className="-ml-2 block text-sm">
          <a
            className="underline underline-offset-2 decoration-gray-400 decoration-1 decoration-opacity-40"
            href="/demonstrations"
          >
            Demonstration List
          </a>{" "}
          {">"} {data.id}
        </span>
        <span className="font-bold block">{data.name}</span>

        <div data-testid="demonstration-detail-row" className="block text-sm">
          <span className="font-semibold">State/Territory:</span>{" "}
          <span>{data.state.id}</span>
        </div>

        <div data-testid="demonstration-detail-row" className="block text-sm">
          <span className="font-semibold">Project Officer:</span>{" "}
          <span>{data.projectOfficer.fullName}</span>
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
            className={`transform transition-transform duration-200 ease-in-out ${
              showButtons ? "rotate-90" : "rotate-0"
            }`}
          >
            <EllipsisIcon width="24" height="24" />
          </span>
        </CircleButton>
      </div>
    </div>
  );
};
