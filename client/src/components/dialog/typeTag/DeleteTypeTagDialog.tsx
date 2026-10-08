import React from "react";

import { TagName } from "demos-server";

import { ErrorButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { AlertIcon } from "components/icons";

export const DELETE_TYPE_TAG_DIALOG_TITLE = "Delete Type/Tag(s)";
export const DELETE_TYPE_TAG_WARNING_TEXT = "This action cannot be undone!";
export const DELETE_TYPE_TAG_DIALOG_NAME = "delete-type-tag-dialog";
export const DELETE_TYPE_TAG_BUTTON_NAME = "button-delete-type-tag";

export const DeleteTypeTagDialog = ({
  typeTagNames,
  onClose,
}: {
  typeTagNames: TagName[];
  onClose: () => void;
}) => {
  const [displayText] = React.useState<string>(typeTagNames.join(", "));

  // TODO: DEMOS-2488 - Integration for Delete TypeTagDialog
  const handleDelete = () => onClose();

  const isMultiple = typeTagNames.length > 1;

  return (
    <BaseDialog
      name={DELETE_TYPE_TAG_DIALOG_NAME}
      title={DELETE_TYPE_TAG_DIALOG_TITLE}
      maxWidthClass="max-w-[500px]"
      onClose={onClose}
      actionButton={
        <ErrorButton name={DELETE_TYPE_TAG_BUTTON_NAME} onClick={handleDelete}>
          Delete
        </ErrorButton>
      }
    >
      <div className="flex flex-col gap-1 items-start text-left">
        {isMultiple ?
          (
            <>
              <span>Are you sure you want to remove the types/tags?</span>
              <div className="flex flex-col">
                {typeTagNames.map((typeTagName) => (
                  <span key={typeTagName}>"{typeTagName}"</span>
                ))}
              </div>
            </>
          ) :
          (
            <span>
              Are you sure you want to remove "{displayText}"?
            </span>
          )
        }

        <div className="flex flex-col items-start">
          <span className="text-error flex items-center gap-0-5">
            <AlertIcon />
            {DELETE_TYPE_TAG_WARNING_TEXT}
          </span>
        </div>
      </div>
    </BaseDialog>
  );
};
