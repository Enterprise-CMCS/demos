import React, { useState } from "react";
import { Tag } from "demos-server";
import { Checkbox } from "components/input";
import { Input } from "components/input/Input";
import { WarningIcon, ErrorIcon, LabelIcon } from "components/icons";
import { tw } from "tags/tw";

export const NO_MATCH_MESSAGE =
  "This demonstration type does not exist yet. Check for spelling errors and alternate names.";

export const UNAPPROVED_WARNING_MESSAGE =
  'Consult with SDG leadership and check spelling before creating a new tag/type. New tag/types are labelled "Unapproved" but can still be seen and used by others.';

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

const SearchField = ({
  searchQuery,
  setSearchQuery,
  onCreateTag,
  canCreateTag,
  placeholder,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onCreateTag: () => void;
  canCreateTag: boolean;
  placeholder: string;
}) => {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Input
          name="input-apply-tags-search"
          type="text"
          label="Demonstration Type"
          placeholder={placeholder}
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

export const TagSelector = ({
  allTags,
  selectedTags,
  setSelectedTags,
  selectionMode,
}: {
  allTags: Tag[];
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
  selectionMode: "single" | "multiple";
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [createdTags, setCreatedTags] = useState<Tag[]>([]);

  const handleToggleTag = (targetTag: Tag) => {
    if (selectedTags.map((tag) => tag.tagName).includes(targetTag.tagName)) {
      setSelectedTags(selectedTags.filter((tag) => tag.tagName !== targetTag.tagName));
    } else {
      setSelectedTags(selectionMode === "single" ? [targetTag] : [...selectedTags, targetTag]);
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
    tag.tagName.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const hasExactMatch =
    normalizedSearchQuery.length > 0 &&
    mergedTags.some((tag) => tag.tagName.trim().toLowerCase() === normalizedSearchQuery);
  const hasMatches = filteredTags.length > 0 || searchQuery.trim().length === 0;
  const canCreateTag =
    normalizedSearchQuery.length > 0 && (selectionMode === "single" ? !hasMatches : !hasExactMatch);

  const hasUnapprovedSelected = selectedTags.some((tag) => tag.approvalStatus === "Unapproved");

  const handleCreateTag = () => {
    const newTagName = searchQuery.trim();
    const newTag: Tag = { tagName: newTagName, approvalStatus: "Unapproved" };
    setCreatedTags((prev) => [newTag, ...prev]);
    setSelectedTags(selectionMode === "single" ? [newTag] : [...selectedTags, newTag]);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col gap-1">
      <SearchField
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onCreateTag={handleCreateTag}
        canCreateTag={canCreateTag}
        placeholder={selectionMode === "single" ? "Search demonstration types..." : "Search"}
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

      <div className="text-md font-semibold">
        {selectionMode === "single"
          ? "Select a tag"
          : `Select tags (${selectedTags.length} selected)`}
      </div>
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
