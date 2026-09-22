import React, { useEffect, useState } from "react";

import { gql, TypedDocumentNode, useMutation } from "@apollo/client";
import { Application, SetApplicationTagsInput, Tag } from "demos-server";

import { useToast } from "components/toast";
import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TagChip } from "components/tags/TagChip";
import { TagSelector } from "components/tags/TagSelector";

export { NO_MATCH_MESSAGE, UNAPPROVED_WARNING_MESSAGE } from "components/tags/TagSelector";

export const APPLY_TAGS_DIALOG_TITLE = "APPLY TAGS";

export const SET_APPLICATION_TAGS_MUTATION: TypedDocumentNode<
  { setApplicationTypes: Application },
  { input: SetApplicationTagsInput }
> = gql`
  mutation setApplicationTags($input: SetApplicationTagsInput!) {
    setApplicationTags(input: $input) {
      ... on Demonstration {
        id
        tags {
          tagName
          approvalStatus
        }
      }
      ... on Amendment {
        id
        tags {
          tagName
          approvalStatus
        }
      }
      ... on Extension {
        id
        tags {
          tagName
          approvalStatus
        }
      }
    }
  }
`;

const tagSetsDiffer = (setA: Tag[], setB: Tag[]): boolean => {
  return (
    setA.length !== setB.length ||
    setA.some((itemA) => !setB.map((itemB) => itemB.tagName).includes(itemA.tagName))
  );
};

export interface ApplyTagsDialogProps {
  demonstrationId: string;
  onClose: () => void;
  initiallySelectedTags: Tag[];
  allTags: Tag[];
}

export const ApplyTagsDialog: React.FC<ApplyTagsDialogProps> = ({
  demonstrationId,
  onClose,
  initiallySelectedTags,
  allTags,
}) => {
  const [setApplicationTagsMutation] = useMutation(SET_APPLICATION_TAGS_MUTATION);
  const { showSuccess, showError } = useToast();

  const [selectedTags, setSelectedTags] = useState<Tag[]>([...initiallySelectedTags]);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setHasChanges(tagSetsDiffer(selectedTags, initiallySelectedTags));
  }, [selectedTags]);

  const handleApply = async () => {
    onClose();
    try {
      await setApplicationTagsMutation({
        variables: {
          input: {
            applicationId: demonstrationId,
            applicationTags: selectedTags.map((tag) => tag.tagName),
          },
        },
      });
      showSuccess("Application tags updated");
    } catch (error) {
      showError("Failed to update application tags");
      throw error;
    }
  };

  return (
    <BaseDialog
      name="apply-tags-dialog"
      title={APPLY_TAGS_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={hasChanges}
      actionButton={
        <Button
          onClick={handleApply}
          name="button-confirm-apply-tags"
          aria-label="Apply tags"
          disabled={!hasChanges}
        >
          Apply Tag(s)
        </Button>
      }
    >
      <div className="flex flex-col gap-1">
        <TagSelector
          allTags={allTags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectionMode="multiple"
        />
        <div className="flex flex-col gap-1">
          <label className="block text-md font-semibold text-text-font">
            Selected Tag(s) ({selectedTags.length})
          </label>
          <div className="flex flex-wrap gap-1 min-h-8">
            {selectedTags.map((tag) => (
              <TagChip
                key={tag.tagName}
                tag={tag}
                onRemoveTag={() =>
                  setSelectedTags(selectedTags.filter((t) => t.tagName !== tag.tagName))
                }
              />
            ))}
            {selectedTags.length === 0 && (
              <p className="text-sm text-text-placeholder italic">No tags selected</p>
            )}
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};
