import React, { useEffect, useState } from "react";

import { gql, TypedDocumentNode, useMutation } from "@apollo/client";
import { Application, SetApplicationTagsInput, Tag, TagStatus } from "demos-server";

import { useToast } from "components/toast";
import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TagChip } from "components/tags/TagChip";
import { Checkbox } from "components/input";
import { Input } from "components/input/Input";
import { WarningIcon, ErrorIcon, LabelIcon } from "components/icons";
import { tw } from "tags/tw";

export const APPLY_TAGS_DIALOG_TITLE = "APPLY TAGS";

export const NO_MATCH_MESSAGE =
  "Entry not found. New tags remain unapproved until admin review. Ensure accuracy before adding.";

export const UNAPPROVED_WARNING_MESSAGE =
  "Unapproved tags are still searchable by others. Please verify it's correct before applying to prevent compounding errors.";

const STYLES = {
  tagLabel: tw`flex items-center gap-1 p-1 cursor-pointer hover:bg-gray-50 rounded border-b border-border-rules`,
  tagList: tw`flex flex-col border border-border-rules max-h-64 overflow-y-auto`,
};

const CREATE_TAG_BUTTON_CLASSES = tw`
  inline-flex items-center justify-center gap-xs
  font-semibold text-[14px] px-[16px] py-[12px]
  rounded-md border border-action text-action bg-white
  hover:bg-action hover:text-white
  focus:outline-none focus:ring-2 focus:ring-action-focus
  transition-all cursor-pointer whitespace-nowrap
  disabled:bg-gray-200 disabled:border-border-rules
  disabled:text-text-placeholder disabled:cursor-not-allowed
`;

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
  onCreateTag,
  canCreateTag,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onCreateTag: () => void;
  canCreateTag: boolean;
}) => {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Input
          name="input-apply-tags-search"
          type="text"
          label="Demonstration Type"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          isRequired={true}
        />
      </div>
      <button
        data-testid="button-create-tag"
        name="button-create-tag"
        type="button"
        disabled={!canCreateTag}
        onClick={onCreateTag}
        className={CREATE_TAG_BUTTON_CLASSES}
      >
        Create Tag
        <LabelIcon />
      </button>
    </div>
  );
};

const TagSelector = ({
  allTags,
  selectedTags,
  setSelectedTags,
  createdTags,
  onCreateTag,
}: {
  allTags: Tag[];
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
  createdTags: Tag[];
  onCreateTag: (tagName: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleToggleTag = (targetTag: Tag) => {
    if (selectedTags.map((tag) => tag.tagName).includes(targetTag.tagName)) {
      setSelectedTags(selectedTags.filter((tag) => tag.tagName !== targetTag.tagName));
    } else {
      setSelectedTags([...selectedTags, targetTag]);
    }
  };

  // Dedupe by tagName — createdTags spread first so new tags appear at the top.
  const seen = new Set<string>();
  const mergedTags = [...createdTags, ...allTags].filter((tag) => {
    if (seen.has(tag.tagName)) return false;
    seen.add(tag.tagName);
    return true;
  });

  const filteredTags = mergedTags.filter((tag) =>
    tag.tagName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasMatches = filteredTags.length > 0 || searchQuery.trim().length === 0;
  const canCreateTag = !hasMatches && searchQuery.trim().length > 0;

  const hasUnapprovedSelected = selectedTags.some((tag) => tag.approvalStatus === "Unapproved");

  const handleCreateTag = () => {
    const newTagName = searchQuery.trim();
    onCreateTag(newTagName);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col gap-1">
      <SearchField
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onCreateTag={handleCreateTag}
        canCreateTag={canCreateTag}
      />

      {!hasMatches && searchQuery.trim().length > 0 && (
        <div
          className="flex items-center gap-1 p-1 text-sm text-error-dark"
          data-testid="no-match-message"
          role="alert"
        >
          <ErrorIcon className="shrink-0" width="16" height="16" />
          <span>{NO_MATCH_MESSAGE}</span>
        </div>
      )}

      {hasUnapprovedSelected && (
        <div
          className="flex items-center gap-1 p-1 bg-yellow-50 border border-yellow-300 rounded text-sm"
          data-testid="unapproved-warning-banner"
          role="alert"
        >
          <WarningIcon className="shrink-0" width="16" height="16" />
          <span className="italic text-text-font">{UNAPPROVED_WARNING_MESSAGE}</span>
        </div>
      )}

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
  const [setApplicationTagsMutation] = useMutation(SET_APPLICATION_TAGS_MUTATION);
  const { showSuccess, showError } = useToast();

  const [selectedTags, setSelectedTags] = useState<Tag[]>([...initiallySelectedTags]);
  const [createdTags, setCreatedTags] = useState<Tag[]>([]);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setHasChanges(tagSetsDiffer(selectedTags, initiallySelectedTags));
  }, [selectedTags]);

  const handleCreateTag = (tagName: string) => {
    const unapproved: TagStatus = "Unapproved";
    const newTag: Tag = { tagName, approvalStatus: unapproved };

    // Add to created tags list (shown at top of selector)
    setCreatedTags((prev) => {
      if (prev.some((t) => t.tagName === tagName)) return prev;
      return [newTag, ...prev];
    });

    // Auto-select the newly created tag
    setSelectedTags((prev) => {
      if (prev.some((t) => t.tagName === tagName)) return prev;
      return [...prev, newTag];
    });
  };

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
          Apply Tag(s)
        </Button>
      }
    >
      <div className="flex flex-col gap-1">
        <TagSelector
          allTags={allTags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          createdTags={createdTags}
          onCreateTag={handleCreateTag}
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
