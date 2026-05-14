import React, { useCallback, useState } from "react";
import { CircleButton } from "components/button";
import { DeleteIcon, EditIcon, EllipsisIcon } from "components/icons";

type EditAndDeleteButtonGroupProps = {
  onDelete: () => void;
  onEdit: () => void;
  defaultExpanded?: boolean;
  deleteDisabled?: boolean;
  editDisabled?: boolean;
};

export const EditAndDeleteButtonGroup: React.FC<EditAndDeleteButtonGroupProps> = ({
  onDelete,
  onEdit,
  defaultExpanded = true,
  deleteDisabled = false,
  editDisabled = false,
}) => {
  const [showButtons, setShowButtons] = useState(defaultExpanded);

  const handleToggleButtons = useCallback(() => {
    setShowButtons((currentValue) => !currentValue);
  }, []);

  return (
    <div className="flex items-center gap-1 mt-[2px]">
      {showButtons ? (
        <>
          <button
            type="button"
            name="Delete deliverable"
            data-testid="delete-deliverable-button"
            onClick={onDelete}
            disabled={deleteDisabled}
            className="inline-flex items-center justify-center text-[#CD2026] hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
          >
            <DeleteIcon fill="currentColor" width="18" height="18" />
          </button>
          <button
            type="button"
            name="Edit deliverable"
            data-testid="edit-deliverable-button"
            onClick={onEdit}
            disabled={editDisabled}
            className="inline-flex items-center justify-center text-action hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
          >
            <EditIcon width="18" height="18" />
          </button>
        </>
      ) : null}
      <CircleButton
        name="Toggle deliverable options"
        data-testid="toggle-deliverable-ellipsis-button"
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
  );
};
