import React from "react";
import { gql, useMutation } from "@apollo/client";

import { TagName } from "demos-server";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ErrorIcon } from "components/icons/Alert/ErrorIcon";
import { useToast } from "components";
import { GET_DEMONSTRATION_TYPE_USAGE_QUERY } from "components/table";

export const APPROVE_TYPE_TAG_DIALOG_TITLE = "Approve Type/Tag(s)";
export const APPROVAL_WARNING_TEXT = "Approval is permanent. Approved tags cannot be unapproved and may only be deleted.";
export const APPROVE_TYPE_TAG_DIALOG_NAME = "approve-type-tag-dialog";
export const APPROVE_TYPE_TAG_BUTTON_NAME = "button-approve-type-tag";

export const APPROVE_TYPE_TAGS_MUTATION = gql`
  mutation approveTags($tagNames: [TagName!]!) {
    approveTags(tagNames: $tagNames) {
      tagName
      approvalStatus
    }
  }
`;

export const ApproveTypeTagDialog = ({
  typeTagNames,
  onClose,
}: {
  typeTagNames: TagName[];
  onClose: () => void;
}) => {
  const [displayText] = React.useState<string>(typeTagNames.join(", "));
  const [approveTags] = useMutation(APPROVE_TYPE_TAGS_MUTATION);
  const { showSuccess, showError } = useToast();

  const handleApprove = async () => {
    onClose();
    try {
      await approveTags({
        variables: { tagNames: typeTagNames },
        refetchQueries: [GET_DEMONSTRATION_TYPE_USAGE_QUERY],
      });
      showSuccess("Successfully approved type/tag(s)");
    } catch {
      showError("Failed to approve type/tag(s)");
    }
  };

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
