import React from "react";
import { gql, TypedDocumentNode } from "@apollo/client/core";
import { useMutation } from "@apollo/client";

import { TagName } from "demos-server";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { AlertIcon } from "components/icons";
import { useToast } from "components";
import { GET_DEMONSTRATION_TYPE_USAGE_QUERY } from "components/table";

export const DELETE_TYPE_TAG_DIALOG_TITLE = "Delete Type/Tag(s)";
export const DELETE_TYPE_TAG_WARNING_TEXT = "This action cannot be undone!";
export const DELETE_TYPE_TAG_DIALOG_NAME = "delete-type-tag-dialog";
export const DELETE_TYPE_TAG_BUTTON_NAME = "button-delete-type-tag";

export const DELETE_TYPE_TAGS_MUTATION: TypedDocumentNode<
  { deleteTags: number  },
  { tagNames: TagName[] }
> = gql`
  mutation deleteTags($tagNames: [TagName!]!) {
    deleteTags(tagNames: $tagNames)
  }
`;

export const DeleteTypeTagDialog = ({
  typeTagNames,
  onClose,
}: {
  typeTagNames: TagName[];
  onClose: () => void;
}) => {
  const [displayText] = React.useState<string>(typeTagNames.join(", "));
  const [ deleteTags ] = useMutation(DELETE_TYPE_TAGS_MUTATION);
  const { showSuccess, showError } = useToast();

  const handleDelete = async () => {
    onClose();
    try {
      await deleteTags({
        variables: {
          tagNames: typeTagNames,
        },
        refetchQueries: [GET_DEMONSTRATION_TYPE_USAGE_QUERY],
      });
      showSuccess("Successfully deleted type/tag(s)");
    } catch {
      showError("Failed to delete type/tag(s)");
    }
  };

  const isMultiple = typeTagNames.length > 1;

  return (
    <BaseDialog
      name={DELETE_TYPE_TAG_DIALOG_NAME}
      title={DELETE_TYPE_TAG_DIALOG_TITLE}
      maxWidthClass="max-w-[500px]"
      onClose={onClose}
      actionButton={
        <Button name={DELETE_TYPE_TAG_BUTTON_NAME} onClick={handleDelete}>
          Delete
        </Button>
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
