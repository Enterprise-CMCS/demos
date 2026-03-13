import React, { useEffect, useState } from "react";

import { gql, TypedDocumentNode, useMutation } from "@apollo/client";
import { Application, SetApplicationTagsInput, Tag } from "demos-server";

import { useToast } from "components/toast";
import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TagChip } from "components/tags/TagChip";
import { Checkbox } from "components/input";
import { Input } from "components/input/Input";
import { tw } from "tags/tw";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application";

export const APPLY_TAGS_DIALOG_TITLE = "APPLY TAGS";
const STYLES = {
  tagLabel: tw`flex items-center gap-1 p-1 cursor-pointer hover:bg-gray-50 rounded border-b border-border-rules`,
  tagList: tw`flex flex-col border border-border-rules max-h-64 overflow-y-auto`,
};

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

const SearchField = ({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) => {
  return (
    <Input
      name="input-apply-tags-search"
      type="text"
      label="Demonstration Type"
      placeholder="Search"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      isRequired={true}
    />
  );
};

const TagSelector = ({
  allTags,
  selectedTags,
  setSelectedTags,
}: {
  allTags: Tag[];
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleToggleTag = (targetTag: Tag) => {
    if (selectedTags.map((tag) => tag.tagName).includes(targetTag.tagName)) {
      setSelectedTags(selectedTags.filter((tag) => tag.tagName !== targetTag.tagName));
    } else {
      setSelectedTags([...selectedTags, targetTag]);
    }
  };

  const filteredTags = allTags.filter((tag) =>
    tag.tagName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-1">
      <SearchField searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="text-md font-semibold">Select tags ({selectedTags.length} selected)</div>
      <div className={STYLES.tagList}>
        {filteredTags.map((tag) => (
          <label key={tag.tagName} className={STYLES.tagLabel}>
            <Checkbox
              name={`checkbox-${tag.tagName}`}
              checked={selectedTags.map((tag) => tag.tagName).includes(tag.tagName)}
              onChange={() => handleToggleTag(tag)}
            />
            <span className="text-sm text-text-font">
              {tag.tagName}
              {tag.approvalStatus === "Approved" ? "" : " (Unapproved)"}
            </span>
          </label>
        ))}
        {filteredTags.length === 0 && (
          <p className="text-sm text-text-placeholder italic p-2">No tags found</p>
        )}
      </div>
    </div>
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
  const [setApplicationTagsMutation] = useMutation(SET_APPLICATION_TAGS_MUTATION, {
    refetchQueries: [GET_WORKFLOW_DEMONSTRATION_QUERY],
  });
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
        <Button onClick={handleApply} name="button-confirm-apply-tags">
          Add Tag(s)
        </Button>
      }
    >
      <div className="flex flex-col gap-1">
        <TagSelector
          allTags={allTags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
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
