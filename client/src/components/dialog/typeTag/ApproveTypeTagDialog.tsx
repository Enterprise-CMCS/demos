import React from "react";

import { TagName } from "demos-server";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ErrorIcon } from "components/icons/Alert/ErrorIcon";

export const APPROVE_TYPE_TAG_DIALOG_TITLE = "Approve Type/Tag(s)";
export const APPROVAL_WARNING_TEXT = "Approval is permanent. Approved tags cannot be unapproved and may only be deleted.";
export const APPROVE_TYPE_TAG_DIALOG_NAME = "approve-type-tag-dialog";
export const APPROVE_TYPE_TAG_BUTTON_NAME = "button-approve-type-tag";

export const ApproveTypeTagDialog = ({
  typeTagNames,
  onClose,
}: {
  typeTagNames: TagName[];
  onClose: () => void;
}) => {
  const [displayText] = React.useState<string>(typeTagNames.join(", "));

  // TODO: DEMOS-2527 - Integration for Approve TypeTagDialog
  const handleApprove = () => onClose();

  const isMultiple = typeTagNames.length > 1;

  return (
    <BaseDialog
      name={APPROVE_TYPE_TAG_DIALOG_NAME}
      title={APPROVE_TYPE_TAG_DIALOG_TITLE}
      maxWidthClass="max-w-[500px]"
      onClose={onClose}
      actionButton={
        <Button name={APPROVE_TYPE_TAG_BUTTON_NAME} onClick={handleApprove}>
          Approve
        </Button>
      }
    >
      <div className="flex flex-col gap-1 items-start text-left">
        {isMultiple ?
          (
            <>
              <span>Are you sure you want to approve the types/tags?</span>
              <div className="flex flex-col">
                {typeTagNames.map((typeTagName) => (
                  <span key={typeTagName}>"{typeTagName}"</span>
                ))}
              </div>
            </>
          ) :
          (
            <span>
              Are you sure you want to approve "{displayText}"?
            </span>
          )
        }

        <div className="text-error flex items-start gap-2 text-sm">
          <ErrorIcon className="mt-0.5" />
          <span>
            {APPROVAL_WARNING_TEXT}
          </span>
        </div>
      </div>
    </BaseDialog>
  );
};
